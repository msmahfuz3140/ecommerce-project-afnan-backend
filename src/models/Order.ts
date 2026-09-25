import mongoose, { Document, Schema } from "mongoose";

export interface IOrderItem {
  product?: mongoose.Types.ObjectId;
  name: string;
  image: string;
  quantity: number;
  buyPrice: number; // Cost price (koto diye kena)
  sellPrice: number; // Selling price (koto diye bikri)
  subtotal: number;
  profit: number; // (sellPrice - buyPrice) * quantity
}

export type OrderStatus = "pending" | "in_progress" | "in_courier" | "delivered" | "cancelled";

export interface IOrder extends Document {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
  items: IOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  totalBuyCost: number;
  totalProfit: number;
  status: OrderStatus;
  paymentMethod: "cash_on_delivery";
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    buyPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    sellPrice: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    profit: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: "Dhaka",
    },
    note: {
      type: String,
      default: "",
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(v: IOrderItem[]) => v.length > 0, "Order must contain at least one item"],
    },
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 70,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    totalBuyCost: {
      type: Number,
      required: true,
      default: 0,
    },
    totalProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "in_courier", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery"],
      default: "cash_on_delivery",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "in_progress", "in_courier", "delivered", "cancelled"],
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
