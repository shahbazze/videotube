import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import { Api_Error } from "./apiError.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload file on cloudinry
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file uploaded succcessfully
    // console.log("file uploaded successfully", response.url);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.log("seeing errorr failed to upload on cloudinar", error);
    // remove locallly saved file as operation got failed
    return null;
  }
};

const deleteFileFromCloudinary = async (fileUrl, resourceType = 'image') => {
  try {
    fileUrl = fileUrl.trim();
    if (fileUrl === "") {
      return null;
    }
    const publicId = fileUrl.split("/").pop().split(".")[0];

    const response = await cloudinary.uploader.destroy(publicId,{resource_type:resourceType});
    return response.result === "ok" ? true : false;
  } catch (error) {
    throw new Api_Error(500, "failed to delete old image from cloudinary");
  }
};

export { uploadOnCloudinary, deleteFileFromCloudinary };
