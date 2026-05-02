import connectDB from '../config/db.js';
import { startJobWorker } from './jobWorker.js';

const run = async () => {
  try {
    await connectDB();
    startJobWorker();
    console.log(`[Worker Thread] Job worker started in thread ${process.pid}`);
  } catch (error) {
    console.error('[Worker Thread] Failed to start:', error);
    process.exit(1);
  }
};

run();
