import { Request, Response } from "express";
import { Order, OrderStatus } from "../models/Order";
import { Product } from "../models/Product";
import { mockOrders, mockProducts, OrderRecord } from "../data/mockData";
import { isDBConnected } from "../config/db";

const generateOrderId = (): string => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `#AUR-${randomDigits}`;
};

// POST /api/orders (Public - Customer Checkout via Cash on Delivery)
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerName, phone, address, city = "Dhaka", note = "", items } = req.body;

    if (!customerName || !phone || !address) {
      res.status(400).json({ success: false, message: "Customer name, phone number, and address are required" });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Order must contain at least one item" });
      return;
    }

    let calculatedSubtotal = 0;
    let calculatedBuyCost = 0;
    const verifiedItems = [];

    for (const item of items) {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const prodId = item.productId || item._id;

      let product: any = null;
      if (isDBConnected()) {
        try {
          product = await Product.findById(prodId);
        } catch (e) {}
      }

      if (!product) {
        product = mockProducts.find((p) => p._id === prodId || p.slug === prodId);
      }

      if (!product) {
        // Fallback placeholder item so order doesn't break
        product = {
          _id: prodId,
          name: item.name || "AuraMart Product",
          images: [item.image || ""],
          sellPrice: Number(item.price) || 1500,
          buyPrice: Number(item.buyPrice) || 800,
        };
      }

      const itemSellPrice = product.sellPrice;
      const itemBuyPrice = product.buyPrice || 0;
      const itemSubtotal = itemSellPrice * quantity;
      const itemProfit = (itemSellPrice - itemBuyPrice) * quantity;

      calculatedSubtotal += itemSubtotal;
      calculatedBuyCost += itemBuyPrice * quantity;

      verifiedItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || "",
        quantity,
        buyPrice: itemBuyPrice,
        sellPrice: itemSellPrice,
        subtotal: itemSubtotal,
        profit: itemProfit,
      });
    }

    const deliveryCharge = city.toLowerCase().includes("outside") ? 130 : 70;
    const totalAmount = calculatedSubtotal + deliveryCharge;
    const totalProfit = calculatedSubtotal - calculatedBuyCost;
    const orderId = generateOrderId();

    const orderData = {
      orderId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      note: note.trim(),
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      deliveryCharge,
      totalAmount,
      totalBuyCost: calculatedBuyCost,
      totalProfit,
      status: "pending" as OrderStatus,
      paymentMethod: "cash_on_delivery" as const,
      statusHistory: [
        {
          status: "pending" as OrderStatus,
          changedAt: new Date(),
          note: "Order placed by customer via Cash on Delivery",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isDBConnected()) {
      const savedMockOrder: OrderRecord = {
        _id: `ord_${Date.now()}`,
        ...orderData,
      };
      mockOrders.unshift(savedMockOrder);
      res.status(201).json({
        success: true,
        message: "Order placed successfully! We will contact you soon.",
        order: savedMockOrder,
      });
      return;
    }

    const order = new Order(orderData);
    await order.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully! We will contact you soon.",
      order,
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to place order" });
  }
};

// GET /api/orders (Admin Only)
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    if (!isDBConnected()) {
      let filtered = [...mockOrders];

      if (status && status !== "all") {
        filtered = filtered.filter((o) => o.status === status);
      }

      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.customerName.toLowerCase().includes(q) ||
            o.phone.toLowerCase().includes(q) ||
            o.orderId.toLowerCase().includes(q)
        );
      }

      const counts: Record<string, number> = {
        all: mockOrders.length,
        pending: mockOrders.filter((o) => o.status === "pending").length,
        in_progress: mockOrders.filter((o) => o.status === "in_progress").length,
        in_courier: mockOrders.filter((o) => o.status === "in_courier").length,
        delivered: mockOrders.filter((o) => o.status === "delivered").length,
        cancelled: mockOrders.filter((o) => o.status === "cancelled").length,
      };

      res.json({
        success: true,
        orders: filtered,
        statusCounts: counts,
        pagination: { page: 1, limit: Number(limit), total: filtered.length, totalPages: 1 },
      });
      return;
    }

    const filter: any = {};
    if (status && status !== "all") filter.status = status;

    if (search) {
      const searchRegex = new RegExp(String(search), "i");
      filter.$or = [{ customerName: searchRegex }, { phone: searchRegex }, { orderId: searchRegex }];
    }

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * pageSize;

    const [orders, total, statusCounts] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Order.countDocuments(filter),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const counts: Record<string, number> = {
      all: 0,
      pending: 0,
      in_progress: 0,
      in_courier: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach((sc) => {
      if (sc._id) {
        counts[sc._id] = sc.count;
        counts.all += sc.count;
      }
    });

    res.json({
      success: true,
      orders,
      statusCounts: counts,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    res.json({
      success: true,
      orders: mockOrders,
      statusCounts: {
        all: mockOrders.length,
        pending: mockOrders.filter((o) => o.status === "pending").length,
        in_progress: mockOrders.filter((o) => o.status === "in_progress").length,
        in_courier: mockOrders.filter((o) => o.status === "in_courier").length,
        delivered: mockOrders.filter((o) => o.status === "delivered").length,
        cancelled: mockOrders.filter((o) => o.status === "cancelled").length,
      },
      pagination: { page: 1, limit: 50, total: mockOrders.length, totalPages: 1 },
    });
  }
};

// GET /api/orders/:id (Admin Only)
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!isDBConnected()) {
      const order = mockOrders.find((o) => o._id === id || o.orderId === id);
      if (!order) {
        res.status(404).json({ success: false, message: "Order not found" });
        return;
      }
      res.json({ success: true, order });
      return;
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    let order;

    if (isObjectId) {
      order = await Order.findById(id).populate("items.product");
    } else {
      order = await Order.findOne({ orderId: id }).populate("items.product");
    }

    if (!order) {
      const fallback = mockOrders.find((o) => o._id === id || o.orderId === id);
      if (fallback) {
        res.json({ success: true, order: fallback });
        return;
      }
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    const fallback = mockOrders.find((o) => o._id === req.params.id || o.orderId === req.params.id);
    if (fallback) {
      res.json({ success: true, order: fallback });
      return;
    }
    res.status(500).json({ success: false, message: error.message || "Failed to fetch order details" });
  }
};

// PATCH /api/orders/:id/status (Admin Only)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, note = "" } = req.body;

    const validStatuses: OrderStatus[] = ["pending", "in_progress", "in_courier", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status value" });
      return;
    }

    if (!isDBConnected()) {
      const order = mockOrders.find((o) => o._id === id || o.orderId === id);
      if (!order) {
        res.status(404).json({ success: false, message: "Order not found" });
        return;
      }
      order.status = status;
      order.statusHistory.push({
        status,
        changedAt: new Date(),
        note: note || `Status updated to ${status}`,
      });
      res.json({ success: true, message: `Order status updated to ${status}`, order });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status updated to ${status}`,
    });

    await order.save();
    res.json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update order status" });
  }
};

// GET /api/orders/track/:query (Public)
export const trackOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = String(req.params.query);
    const cleanQuery = query.trim().toLowerCase();

    if (!isDBConnected()) {
      const orders = mockOrders.filter(
        (o) =>
          o.phone.toLowerCase().includes(cleanQuery) ||
          o.orderId.toLowerCase().includes(cleanQuery) ||
          cleanQuery.includes(o.orderId.toLowerCase().replace("#", ""))
      );
      if (orders.length === 0) {
        res.status(404).json({ success: false, message: "No orders found for this Phone number or Order ID" });
        return;
      }
      res.json({ success: true, orders });
      return;
    }

    const orders = await Order.find({
      $or: [{ phone: query.trim() }, { orderId: query.trim() }, { orderId: `#${query.trim()}` }],
    }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      const fallback = mockOrders.filter(
        (o) => o.phone.includes(query.trim()) || o.orderId.includes(query.trim())
      );
      if (fallback.length > 0) {
        res.json({ success: true, orders: fallback });
        return;
      }
      res.status(404).json({ success: false, message: "No orders found for this Phone number or Order ID" });
      return;
    }

    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to track order" });
  }
};
