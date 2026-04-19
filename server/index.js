import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
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
import { startJobWorker } from './utils/jobWorker.js';


import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV==="development" ? process.env.DEV_CLIENT_URL : process.env.PROD_CLIENT_URL_WWW,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(cookieParser());

// Serve static files (but not sensitive ones like invoices)
// Protected route will handle invoices
app.use('/uploads/brands', express.static(path.join(__dirname, '/uploads/brands')));
app.use('/uploads/banners', express.static(path.join(__dirname, '/uploads/banners')));


const authLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 20, // Limit each IP to 20 login/register attempts per hour
	standardHeaders: true,
	legacyHeaders: false,
    message: 'Too many authentication attempts, please try again after an hour'
});

// Apply rate limiting
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

const startServer = async () => {
  await connectDB();
  startJobWorker();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
