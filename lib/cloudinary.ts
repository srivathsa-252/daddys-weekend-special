import { v2 as cloudinary } from "cloudinary";

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export async function destroyImage(publicId: string) {
  return getCloudinary().uploader.destroy(publicId);
}

export async function uploadImage(file: Buffer, folder = "daddys-weekend-special") {
  const client = getCloudinary();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    client.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(file);
  });
}
