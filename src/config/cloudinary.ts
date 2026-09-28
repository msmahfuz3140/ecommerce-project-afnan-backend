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
      console.warn("⚠️ Cloudinary credentials not fully configured in .env; falling back to base64 Data URI.");
      const mime = resourceType === "raw" ? "application/pdf" : "image/jpeg";
      const base64 = fileBuffer.toString("base64");
      const dataUri = `data:${mime};base64,${base64}`;
      return resolve({
        secure_url: dataUri,
        public_id: `mock_${Date.now()}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary stream upload error:", error);
          return reject(error || new Error("Cloudinary upload failed"));
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
 * Upload a Base64 string or remote image URL to Cloudinary
 */
export const uploadStringToCloudinary = async (
  imageStr: string,
  folder: string = "gaxinmart"
): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    return imageStr;
  }

  // If already hosted on Cloudinary, keep it
  if (imageStr.includes("res.cloudinary.com")) {
    return imageStr;
  }

  try {
    const result = await cloudinary.uploader.upload(imageStr, {
      folder,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (err: any) {
    console.warn("Failed to upload string image to Cloudinary, keeping original:", err.message || err);
    return imageStr;
  }
};

export default cloudinary;
