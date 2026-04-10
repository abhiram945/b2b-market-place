import AsyncJob from '../models/AsyncJob.js';

export const JOB_TYPES = {
  INVOICE: 'invoice',
  PRODUCT_NOTIFICATION: 'product_notification',
  USER_STATUS_NOTIFICATION: 'user_status_notification',
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
