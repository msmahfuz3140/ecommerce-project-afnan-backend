import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Product } from "../models/Product";

// GET /api/analytics/profit-loss (Admin Only)
export const getProfitLossAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = "7days", startDate, endDate } = req.query;

    let start = new Date();
    const end = new Date();

    if (range === "7days") {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (range === "30days") {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (range === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (range === "custom" && startDate && endDate) {
      start = new Date(String(startDate));
      end.setTime(new Date(String(endDate)).getTime());
      end.setHours(23, 59, 59, 999);
    } else {
      // "all" - beginning of time
      start = new Date(0);
    }

    // Match criteria: within date range and non-cancelled orders
    const dateMatch = {
      createdAt: { $gte: start, $lte: end },
    };

    // Aggregate summary for non-cancelled orders
    const summaryAgg = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$subtotal" },
          totalBuyCost: { $sum: "$totalBuyCost" },
          totalProfit: { $sum: "$totalProfit" },
          totalDeliveryCollected: { $sum: "$deliveryCharge" },
          totalGrossAmount: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const summary = summaryAgg[0] || {
      totalRevenue: 0,
      totalBuyCost: 0,
      totalProfit: 0,
      totalDeliveryCollected: 0,
      totalGrossAmount: 0,
      orderCount: 0,
    };

    // Calculate profit margin percentage
    const profitMargin =
      summary.totalRevenue > 0
        ? Number(((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2))
        : 0;

    // Order counts by status within the period
    const statusCountsAgg = await Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const statusCounts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      in_courier: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCountsAgg.forEach((s) => {
      if (s._id) {
        statusCounts[s._id] = s.count;
      }
    });

    // Category wise profit and sales breakdown
    const categoryBreakdownAgg = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          status: { $ne: "cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      {
        $unwind: {
          path: "$productDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$productDoc.category", "general"] },
          revenue: { $sum: "$items.subtotal" },
          cost: { $sum: { $multiply: ["$items.buyPrice", "$items.quantity"] } },
          profit: { $sum: "$items.profit" },
          itemsSold: { $sum: "$items.quantity" },
        },
      },
    ]);

    // Daily trend data points for chart
    const dailyTrendAgg = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$subtotal" },
          cost: { $sum: "$totalBuyCost" },
          profit: { $sum: "$totalProfit" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products with profit
    const topProductsAgg = await Order.aggregate([
      {
        $match: {
          ...dateMatch,
          status: { $ne: "cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          image: { $first: "$items.image" },
          quantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          totalProfit: { $sum: "$items.profit" },
        },
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      range,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      metrics: {
        totalRevenue: summary.totalRevenue,
        totalBuyCost: summary.totalBuyCost,
        totalProfit: summary.totalProfit,
        profitMargin,
        totalOrders: summary.orderCount,
        statusCounts,
      },
      categoryBreakdown: categoryBreakdownAgg,
      dailyTrend: dailyTrendAgg,
      topProducts: topProductsAgg,
    });
  } catch (error: any) {
    console.error("Analytics calculation error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to calculate analytics" });
  }
};
