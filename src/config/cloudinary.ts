import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary with environment variables
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const isCloudinaryConfigured = (): boolean => {
  if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.includes("your_")) {
    return true;
  }
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(
    name &&
      name !== "your_cloudinary_cloud_name" &&
      name !== "your_cloud_name" &&
      key &&
      key !== "your_cloudinary_api_key" &&
      key !== "your_api_key" &&
      secret &&
      secret !== "your_cloudinary_api_secret" &&
      secret !== "your_api_secret"
  );
};

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "gaxinmart",
  resourceType: "image" | "raw" | "auto" = "auto"
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
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

    const uploadOptions: Record<string, any> = {
      folder,
      resource_type: resourceType,
    };

    // Extreme image optimization: Max 1200px, WebP format, eco quality
    if (isImage) {
      uploadOptions.transformation = [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:eco", fetch_format: "webp" },
      ];
      uploadOptions.format = "webp";
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

    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload a Base64 string or remote image URL with full WebP and eco-quality compression
 */
export const uploadStringToCloudinary = async (
  imageStr: string,
  folder: string = "gaxinmart"
): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    return imageStr;
  }

  // If already hosted on CDN, keep it
  if (imageStr.includes("res.cloudinary.com")) {
    return imageStr;
  }

  try {
    const result = await cloudinary.uploader.upload(imageStr, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:eco", fetch_format: "webp" },
      ],
      format: "webp",
    });
    return result.secure_url;
  } catch (err: any) {
    console.warn("Failed to upload string image, keeping original:", err.message || err);
    return imageStr;
  }
};

/**
 * Inject fast WebP/AVIF delivery transformations to any CDN image URL
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

