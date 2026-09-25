import { Request, Response } from "express";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { mockOrders, mockProducts } from "../data/mockData";
import { isDBConnected } from "../config/db";

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

    if (!isDBConnected()) {
      // In-Memory calculation fallback
      const filteredOrders = mockOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });

      const nonCancelledOrders = filteredOrders.filter((o) => o.status !== "cancelled");

      const summary = nonCancelledOrders.reduce(
        (acc, o) => {
          acc.totalRevenue += o.subtotal || 0;
          acc.totalBuyCost += o.totalBuyCost || 0;
          acc.totalProfit += o.totalProfit || 0;
          acc.totalDeliveryCollected += o.deliveryCharge || 0;
          acc.totalGrossAmount += o.totalAmount || 0;
          acc.orderCount += 1;
          return acc;
        },
        {
          totalRevenue: 0,
          totalBuyCost: 0,
          totalProfit: 0,
          totalDeliveryCollected: 0,
          totalGrossAmount: 0,
          orderCount: 0,
        }
      );

      const profitMargin =
        summary.totalRevenue > 0
          ? Number(((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2))
          : 0;

      const statusCounts: Record<string, number> = {
        pending: 0,
        in_progress: 0,
        in_courier: 0,
        delivered: 0,
        cancelled: 0,
      };

      filteredOrders.forEach((o) => {
        if (statusCounts[o.status] !== undefined) {
          statusCounts[o.status] += 1;
        }
      });

      // Category breakdown
      const categoryMap = new Map<string, { revenue: number; cost: number; profit: number; itemsSold: number }>();
      nonCancelledOrders.forEach((order) => {
        order.items.forEach((item) => {
          const prod = mockProducts.find((p) => p._id === item.product);
          const cat = prod?.category || "general";
          const current = categoryMap.get(cat) || { revenue: 0, cost: 0, profit: 0, itemsSold: 0 };
          current.revenue += item.subtotal || 0;
          current.cost += (item.buyPrice || 0) * (item.quantity || 1);
          current.profit += item.profit || 0;
          current.itemsSold += item.quantity || 1;
          categoryMap.set(cat, current);
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, data]) => ({
        _id: cat,
        ...data,
      }));

      // Daily trend
      const dailyMap = new Map<string, { revenue: number; cost: number; profit: number; orders: number }>();
      nonCancelledOrders.forEach((order) => {
        const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
        const current = dailyMap.get(dateStr) || { revenue: 0, cost: 0, profit: 0, orders: 0 };
        current.revenue += order.subtotal || 0;
        current.cost += order.totalBuyCost || 0;
        current.profit += order.totalProfit || 0;
        current.orders += 1;
        dailyMap.set(dateStr, current);
      });

      const dailyTrend = Array.from(dailyMap.entries())
        .map(([dateStr, data]) => ({
          _id: dateStr,
          ...data,
        }))
        .sort((a, b) => a._id.localeCompare(b._id));

      // Top products
      const productMap = new Map<string, { image: string; quantitySold: number; totalRevenue: number; totalProfit: number }>();
      nonCancelledOrders.forEach((order) => {
        order.items.forEach((item) => {
          const current = productMap.get(item.name) || {
            image: item.image,
            quantitySold: 0,
            totalRevenue: 0,
            totalProfit: 0,
          };
          current.quantitySold += item.quantity || 1;
          current.totalRevenue += item.subtotal || 0;
          current.totalProfit += item.profit || 0;
          productMap.set(item.name, current);
        });
      });

      const topProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({
          _id: name,
          ...data,
        }))
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 5);

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
        categoryBreakdown,
        dailyTrend,
        topProducts,
      });
      return;
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
