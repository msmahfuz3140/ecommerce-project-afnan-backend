import { Request, Response } from "express";
import { uploadToCloudinary, uploadStringToCloudinary } from "../config/cloudinary";

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const folder = (req.body.folder as string) || "gaxinmart";

    if (req.file) {
      const resourceType = req.file.mimetype === "application/pdf" ? "raw" : "image";
      const result = await uploadToCloudinary(req.file.buffer, folder, resourceType);

      res.json({
        success: true,
        message: "File uploaded successfully to Cloudinary",
        url: result.secure_url,
        publicId: result.public_id,
      });
      return;
    }

    if (req.body.image || req.body.file) {
      const imgStr = req.body.image || req.body.file;
      const url = await uploadStringToCloudinary(imgStr, folder);
      res.json({
        success: true,
        message: "Image uploaded successfully to Cloudinary",
        url,
        publicId: `cloud_${Date.now()}`,
      });
      return;
    }

    res.status(400).json({ success: false, message: "No file or image provided" });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to upload file" });
  }
};

export const uploadMultipleMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const folder = (req.body.folder as string) || "gaxinmart";

    if (files && files.length > 0) {
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
      return;
    }

    if (req.body.images && Array.isArray(req.body.images)) {
      const urls = await Promise.all(
        req.body.images.map((img: string) => uploadStringToCloudinary(img, folder))
      );
      res.json({
        success: true,
        message: "Images uploaded successfully to Cloudinary",
        urls,
      });
      return;
    }

    res.status(400).json({ success: false, message: "No files or images uploaded" });
  } catch (error: any) {
    console.error("Multiple upload error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to upload files" });
  }
};
