import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cluster from 'cluster';
import os from 'os';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { optionalProtect } from './middleware/authMiddleware.js';
import { checkMaintenance } from './middleware/maintenanceMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === "development" ? process.env.DEV_CLIENT_URL : process.env.PROD_CLIENT_URL_WWW,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use('/uploads/brands', express.static(path.join(__dirname, '/uploads/brands')));
app.use('/uploads/banners', express.static(path.join(__dirname, '/uploads/banners')));

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again after an hour'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api', optionalProtect, checkMaintenance);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  // Instances should be 2 less than available cores, but at least 1
  const numInstances = Math.max(1, numCPUs - 2);

  console.log(`Primary ${process.pid} is running`);
  console.log(`Forking ${numInstances} workers...`);

  for (let i = 0; i < numInstances; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking a new one...`);
    cluster.fork();
  });
} else {
  const startServer = async () => {
    await connectDB();

    // Start job worker in a separate thread in every worker instance
    const workerPath = path.join(__dirname, 'utils', 'worker.js');
    const worker = new Worker(workerPath);
    
    worker.on('error', (error) => {
      console.error(`[Worker Thread Error] ${error.message}`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[Worker Thread Exit] Stopped with code ${code}`);
      }
    });
    app.listen(PORT, () => console.log(`Server instance ${process.pid} running on port ${PORT}`));
  };

  startServer();
}
