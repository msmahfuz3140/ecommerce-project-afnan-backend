import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

// Initialize Cloudinary with environment variables
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
}

export const isCloudinaryConfigured = (): boolean => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (
    name &&
    name !== "your_cloudinary_cloud_name" &&
    name !== "your_cloud_name" &&
    key &&
    key !== "your_cloudinary_api_key" &&
    key !== "your_api_key" &&
    secret &&
    secret !== "your_cloudinary_api_secret" &&
    secret !== "your_api_secret"
  ) {
    return true;
  }

  if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.includes("your_")) {
    return true;
  }

  return false;
};

/**
 * Pre-compress image buffer using sharp to JPEG with low KB footprint
 * before sending to Cloudinary to save account storage & bandwidth.
 */
export const optimizeBufferToJpeg = async (
  buffer: Buffer,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 80
): Promise<Buffer> => {
  try {
    return await sharp(buffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
      })
      .toBuffer();
  } catch (err) {
    console.warn("Sharp optimization failed, using original buffer:", err);
    return buffer;
  }
};

/**
 * Upload buffer to Cloudinary with Sharp compression & JPEG incoming transformations
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "gaxinmart",
  resourceType: "image" | "raw" | "auto" = "auto"
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise(async (resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      console.warn("Storage credentials not fully configured; falling back to data URI.");
      const mime = resourceType === "raw" ? "application/pdf" : "image/jpeg";
      const base64 = fileBuffer.toString("base64");
      const dataUri = `data:${mime};base64,${base64}`;
      return resolve({
        secure_url: dataUri,
        public_id: `media_${Date.now()}`,
      });
    }

    const isImage = resourceType === "image" || resourceType === "auto";

    let payloadBuffer = fileBuffer;
    const uploadOptions: Record<string, any> = {
      folder,
      resource_type: resourceType,
    };

    if (isImage) {
      // Compress with sharp to small KB JPEG before upload
      payloadBuffer = await optimizeBufferToJpeg(fileBuffer, 1200, 1200, 80);

      // Cloudinary incoming transformation to JPEG and eco/good quality
      uploadOptions.transformation = [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ];
      uploadOptions.format = "jpg";
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          console.error("Stream upload error:", error);
          return reject(error || new Error("Media upload failed"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(payloadBuffer);
  });
};

/**
 * Upload a Base64 string or remote image URL with full Sharp JPEG optimization
 */
export const uploadStringToCloudinary = async (
  imageStr: string,
  folder: string = "gaxinmart"
): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    return imageStr;
  }

  const currentCloud = process.env.CLOUDINARY_CLOUD_NAME;

  // If already hosted on THIS specific Cloudinary account, keep it
  if (currentCloud && imageStr.includes(`res.cloudinary.com/${currentCloud}/`)) {
    return imageStr;
  }

  try {
    // If base64 data URL, decode and compress with sharp first to keep size minimal
    if (imageStr.startsWith("data:image/")) {
      const base64Data = imageStr.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const compressedBuffer = await optimizeBufferToJpeg(buffer, 1200, 1200, 80);
      const res = await uploadToCloudinary(compressedBuffer, folder, "image");
      return res.secure_url;
    }

    // Remote image URL: upload to Cloudinary with incoming transformation to JPEG
    const result = await cloudinary.uploader.upload(imageStr, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ],
      format: "jpg",
    });
    return result.secure_url;
  } catch (err: any) {
    console.warn("Failed to upload string image, keeping original:", err.message || err);
    return imageStr;
  }
};

/**
 * Inject fast WebP/AVIF delivery transformations to any CDN image URL
 * for optimal browser bandwidth reduction & caching
 */
export const getOptimizedDeliveryUrl = (url: string, width?: number): string => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || url.includes("/f_auto,q_auto")) {
    return url;
  }
  const transform = width ? `f_auto,q_auto,w_${width},c_limit` : "f_auto,q_auto";
  return url.replace("/upload/", `/upload/${transform}/`);
};

export default cloudinary;
