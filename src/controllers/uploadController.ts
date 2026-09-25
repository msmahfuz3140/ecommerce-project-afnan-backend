import { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary";

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const folder = (req.body.folder as string) || "auramart";
    const resourceType = req.file.mimetype === "application/pdf" ? "raw" : "image";

    const result = await uploadToCloudinary(req.file.buffer, folder, resourceType);

    res.json({
      success: true,
      message: "File uploaded successfully to Cloudinary",
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to upload file" });
  }
};

export const uploadMultipleMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: "No files uploaded" });
      return;
    }

    const folder = (req.body.folder as string) || "auramart";
    const uploadPromises = files.map((file) => {
      const resourceType = file.mimetype === "application/pdf" ? "raw" : "image";
      return uploadToCloudinary(file.buffer, folder, resourceType);
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: "Files uploaded successfully to Cloudinary",
      urls: results.map((r) => r.secure_url),
      results,
    });
  } catch (error: any) {
    console.error("Multiple upload error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to upload files" });
  }
};
