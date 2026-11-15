import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
try {
  console.log("ping:", await cloudinary.api.ping());
} catch (e) {
  console.log("ping FAILED", e.http_code, e.error?.message ?? e.message);
}
