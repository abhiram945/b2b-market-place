import AsyncJob from '../models/AsyncJob.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { JOB_TYPES } from './jobQueue.js';
import { generateInvoice } from './invoiceGenerator.js';
import { processProductNotifications, sendEmail, sendWhatsApp } from './notificationSender.js';

const POLL_INTERVAL_MS = 4000;
const RETRY_DELAY_MS = 15000;

let workerHandle = null;
let isTickRunning = false;

const markFailed = async (job, error) => {
  const attempts = job.attempts + 1;
  const shouldRetry = attempts < job.maxAttempts;

  await AsyncJob.findByIdAndUpdate(job._id, {
    status: shouldRetry ? 'queued' : 'failed',
    attempts,
    lockedAt: null,
    lastError: error.message || 'job failed',
    runAt: shouldRetry ? new Date(Date.now() + RETRY_DELAY_MS) : job.runAt,
  });
};

const deleteCompletedJob = async (job) => {
  await AsyncJob.findByIdAndDelete(job._id);
};

const processInvoiceJob = async (job) => {
  const { orderId, userId } = job.payload;
  const [order, buyer] = await Promise.all([
    Order.findById(orderId),
    User.findById(userId),
  ]);

  if (!order || !buyer) {
    throw new Error('order or buyer not found for invoice job');
  }

  await generateInvoice(order, buyer);
};

const processProductNotificationJob = async (job) => {
  const { productId, oldPrice, oldStock } = job.payload;
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('product not found for notification job');
  }

  await processProductNotifications(product, oldPrice, oldStock);
};

const processUserStatusNotificationJob = async (job) => {
  const { userId, status } = job.payload;
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('user not found for status notification job');
  }

  const subject = `Your Account has been ${status}`;
  const message = `Hi ${user.fullName}, your registration on the  Market Mea has been ${status}.`;

  await sendEmail(user.email, subject, message);
  if (user.phoneNumber) {
    await sendWhatsApp(user.phoneNumber, message);
  }
};

const processOrderStatusNotificationJob = async (job) => {
  const { orderId, status } = job.payload;
  const order = await Order.findById(orderId).populate('user', 'fullName email phoneNumber');

  if (!order || !order.user) {
    throw new Error('order or buyer not found for order status job');
  }

  const subject = `Order #${order._id.toString().toUpperCase()} Update`;
  const message = `Hi ${order.user.fullName}, the status of your order has been updated to: ${status.toUpperCase()}.`;

  await sendEmail(order.user.email, subject, message);
  if (order.user.phoneNumber) {
    await sendWhatsApp(order.user.phoneNumber, message);
  }
};

const processJob = async (job) => {
  switch (job.type) {
    case JOB_TYPES.INVOICE:
      return processInvoiceJob(job);
    case JOB_TYPES.PRODUCT_NOTIFICATION:
      return processProductNotificationJob(job);
    case JOB_TYPES.USER_STATUS_NOTIFICATION:
      return processUserStatusNotificationJob(job);
    case JOB_TYPES.ORDER_STATUS_NOTIFICATION:
      return processOrderStatusNotificationJob(job);
    default:
      throw new Error(`unsupported job type: ${job.type}`);
  }
};

const claimNextJob = async () => {
  return AsyncJob.findOneAndUpdate(
    {
      status: 'queued',
      runAt: { $lte: new Date() },
    },
    {
      status: 'processing',
      lockedAt: new Date(),
    },
    {
      sort: { createdAt: 1 },
      new: true,
    }
  );
};

const claimJobById = async (jobId) => {
  return AsyncJob.findOneAndUpdate(
    {
      _id: jobId,
      status: 'queued',
      runAt: { $lte: new Date() },
    },
    {
      status: 'processing',
      lockedAt: new Date(),
    },
    { new: true }
  );
};

const processNextAvailableJobs = async () => {
  if (isTickRunning) return;
  isTickRunning = true;

  try {
    let job = await claimNextJob();
    while (job) {
      try {
        await processJob(job);
        await deleteCompletedJob(job);
      } catch (error) {
        console.error(`[job-worker] job ${job._id} failed:`, error.message);
        await markFailed(job, error);
      }
      job = await claimNextJob();
    }
  } finally {
    isTickRunning = false;
  }
};

export const startJobWorker = () => {
  if (workerHandle) clearInterval(workerHandle);

  console.log(`[job-worker ${process.pid}] Starting Change Stream listener...`);

  // 1. Process any missed jobs on startup
  void processNextAvailableJobs();

  // 2. Watch for new jobs (Change Stream)
  const changeStream = AsyncJob.watch([
    { $match: { operationType: 'insert' } }
  ]);

  changeStream.on('change', async (change) => {
    const newJobId = change.fullDocument._id;
    
    // Small delay to ensure DB consistency or handle multiple inserts
    setTimeout(async () => {
      const job = await claimJobById(newJobId);
      if (job) {
        try {
          await processJob(job);
          await deleteCompletedJob(job);
        } catch (error) {
          console.error(`[job-worker] job ${job._id} failed:`, error.message);
          await markFailed(job, error);
        }
      }
      
      // Also check if any other jobs were missed during processing
      void processNextAvailableJobs();
    }, 100);
  });

  changeStream.on('error', (error) => {
    console.error('[job-worker] Change Stream error:', error);
    // Restart logic: ensure handle is cleared before trying to restart
    setTimeout(() => {
      workerHandle = null;
      startJobWorker();
    }, 5000);
  });

  // Keep a secondary fallback poller (less frequent) just in case stream fails
  workerHandle = setInterval(() => {
    void processNextAvailableJobs();
  }, 30000); 
};
