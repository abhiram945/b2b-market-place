import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { USER_STATUS, ORDER_STATUS, ROLES } from '../utils/constants.js';

const getEffectiveRole = (user) => user?.activeRole || user?.role || user?.roles?.[0];

const getDashboardSummary = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const activeRole = getEffectiveRole(req.user);

  if (activeRole === ROLES.BUYER) {
    const [totalOrders, pendingOrders] = await Promise.all([
      Order.countDocuments({ user: req.user._id }),
      Order.countDocuments({ user: req.user._id, status: ORDER_STATUS.PENDING }),
    ]);

    return res.json({ totalOrders, pendingOrders });
  }

  if (activeRole === ROLES.VENDOR) {
    const [activeListings, lowStockItems, newOrders, recentOrders, totalSalesResult] = await Promise.all([
      Product.countDocuments({ user: req.user._id }),
      Product.countDocuments({ user: req.user._id, stockQty: { $lt: 100 } }),
      Order.countDocuments({ status: ORDER_STATUS.PENDING, 'items.vendor': req.user._id }),
      Order.find({ 'items.vendor': req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id createdAt status items'),
      Order.aggregate([
        { $match: { status: { $ne: ORDER_STATUS.CANCELLED }, 'items.vendor': req.user._id } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': req.user._id } },
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: { $multiply: ['$items.quantity', '$items.price'] },
            },
          },
        },
      ]),
    ]);

    const filteredRecentOrders = recentOrders.map((order) => ({
      _id: order._id,
      createdAt: order.createdAt,
      status: order.status,
      items: order.items.filter((item) => item.vendor.toString() === req.user._id.toString()).map((item) => ({
        productTitle: item.productTitle,
        quantity: item.quantity,
      })),
    }));

    return res.json({
      activeListings,
      lowStockItems,
      newOrders,
      totalSales: totalSalesResult[0]?.totalSales || 0,
      recentOrders: filteredRecentOrders,
    });
  }

  if (activeRole === ROLES.ADMIN) {
    const [pendingUsers, approvedUsers, rejectedUsers, totalOrders, totalProducts] = await Promise.all([
      User.countDocuments({ status: USER_STATUS.PENDING }),
      User.countDocuments({ status: USER_STATUS.APPROVED }),
      User.countDocuments({ status: USER_STATUS.REJECTED }),
      Order.countDocuments({}),
      Product.countDocuments({}),
    ]);

    return res.json({
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      totalOrders,
      totalProducts,
    });
  }

  res.json({});
});

export { getDashboardSummary };
