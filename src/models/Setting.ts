import mongoose, { Document, Schema } from "mongoose";

export interface IDeliverySettings {
  dhaka: number;
  nearDhaka: number;
  outsideDhaka: number;
}

export interface ISetting extends Document {
  key: string;
  deliverySettings: IDeliverySettings;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "general_settings",
    },
    deliverySettings: {
      dhaka: { type: Number, default: 70 },
      nearDhaka: { type: Number, default: 100 },
      outsideDhaka: { type: Number, default: 130 },
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const Setting = mongoose.model<ISetting>("Setting", SettingSchema);
