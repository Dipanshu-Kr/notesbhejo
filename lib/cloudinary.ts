import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadToCloudinary(
  file: File,
  pin: string
) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const resourceType = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
    ? "video"
    : "raw";

  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_chunked_stream(
      {
        folder: "notesbhejo",
        public_id: `${pin}-${Date.now()}`,
        resource_type: resourceType,
        chunk_size: 6 * 1024 * 1024,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: string = "image"
) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as "image" | "raw" | "video",
    });

    console.log("Cloudinary delete result:", result);

    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

export default cloudinary;