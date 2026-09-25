import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "auramart",
  resourceType: "image" | "raw" | "auto" = "auto"
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary credentials are provided
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name" ||
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY === "your_api_key"
    ) {
      // Fallback: If Cloudinary credentials are not configured yet, return a base64 Data URI so uploading still works without breaking!
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

export default cloudinary;
