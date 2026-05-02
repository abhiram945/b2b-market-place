import AsyncJob from '../models/AsyncJob.js';

export const JOB_TYPES = {
  INVOICE: 'invoice',
  PRODUCT_NOTIFICATION: 'product_notification',
  USER_STATUS_NOTIFICATION: 'user_status_notification',
  ORDER_STATUS_NOTIFICATION: 'order_status_notification',
};

export const enqueueJob = async (type, payload, options = {}) => {
  const {
    runAt = new Date(),
    maxAttempts = 3,
  } = options;

  return AsyncJob.create({
    type,
    payload,
    runAt,
    maxAttempts,
  });
};

export const bulkEnqueueJobs = async (jobs, options = {}) => {
  if (!jobs || jobs.length === 0) return;
  return AsyncJob.insertMany(
    jobs.map(job => ({
      type: job.type,
      payload: job.payload,
      runAt: job.runAt || new Date(),
      maxAttempts: job.maxAttempts || 3,
      status: 'queued'
    })),
    options
  );
};
