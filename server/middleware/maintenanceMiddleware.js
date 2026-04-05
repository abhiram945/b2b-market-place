import asyncHandler from 'express-async-handler';
import { getConfig } from '../utils/jsonStore.js';
import { ROLES } from '../utils/constants.js';

const checkMaintenance = asyncHandler(async (req, res, next) => {
  const config = await getConfig();

  if (config.maintenanceMode) {
    // If maintenance mode is ON, only allow admins
    // We check req.user which is populated by protect middleware
    // If protect is not used, req.user will be undefined
    
    // Exception for maintenance status check itself (if it was on a different route, but here it's fine)
    if (req.path === '/api/admin/maintenance' && req.method === 'GET') {
      return next();
    }

    // If user is logged in and is an admin, let them through
    if (req.user && req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Otherwise, return 503
    res.status(503);
    throw new Error('Server is under maintenance. Please try again later.');
  }

  next();
});

export { checkMaintenance };
