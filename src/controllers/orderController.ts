import { Request, Response } from "express";
import { Order, OrderStatus } from "../models/Order";
import { Product } from "../models/Product";

// Helper to generate readable Order ID
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
      const product = await Product.findById(item.productId || item._id);

      if (!product) {
        res.status(404).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
        return;
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

      // Deduct stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -quantity },
      });
    }

    // Delivery charge calculation
    const deliveryCharge = city.toLowerCase().includes("outside") ? 130 : 70;
    const totalAmount = calculatedSubtotal + deliveryCharge;
    const totalProfit = calculatedSubtotal - calculatedBuyCost;

    const orderId = generateOrderId();

    const order = new Order({
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
      status: "pending",
      paymentMethod: "cash_on_delivery",
      statusHistory: [
        {
          status: "pending",
          changedAt: new Date(),
          note: "Order placed by customer via Cash on Delivery",
        },
      ],
    });

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

// GET /api/orders (Admin Only - List orders with status filter & pagination)
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

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
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
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
    res.status(500).json({ success: false, message: error.message || "Failed to fetch orders" });
  }
};

// GET /api/orders/:id (Admin Only - Full details for order modal)
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    let order;

    if (isObjectId) {
      order = await Order.findById(id).populate("items.product");
    } else {
      order = await Order.findOne({ orderId: id }).populate("items.product");
    }

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch order details" });
  }
};

// PATCH /api/orders/:id/status (Admin Only - Update status)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status, note = "" } = req.body;

    const validStatuses: OrderStatus[] = ["pending", "in_progress", "in_courier", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status value" });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status updated from ${previousStatus} to ${status}`,
    });

    // If order is cancelled and was not cancelled before, restore stock
    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update order status" });
  }
};

// GET /api/orders/track/:query (Public - Track order by phone or order ID)
export const trackOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = String(req.params.query);
    const cleanQuery = query.trim();

    const orders = await Order.find({
      $or: [{ phone: cleanQuery }, { orderId: cleanQuery }, { orderId: `#${cleanQuery}` }],
    }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      res.status(404).json({ success: false, message: "No orders found for this Phone number or Order ID" });
      return;
    }

    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to track order" });
  }
};
