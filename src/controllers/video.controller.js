import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const match = {};
  if (query) {
    match.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId && isValidObjectId(userId)) {
    match.owner = mongoose.Types.ObjectId(userId);
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

  const aggregateQuery = [
    { $match: match },
    { $sort: sortOptions },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        time: 1,
        views: 1,
        isPublished: 1,
        owner: {
          _id: 1,
          username: 1,
          avatar: 1,
        },
      },
    },
  ];

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Video.aggregatePaginate(
    Video.aggregate(aggregateQuery),
    options
  );

  return res
    .status(200)
    .json(new Api_Response(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // TODO: get video, upload to cloudinary, create video

  if ((title && description) === "") {
    throw new Api_Error(400, "All fields are required");
  }

  // video upload
  const videoFileLocalpath = req.files?.videoFile[0]?.path;
  const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path;

  if (!thumbnailFileLocalPath) {
    throw new Api_Error(400, "thumbnail file is required");
  }

  if (
    !videoFileLocalpath ||
    !/\.(mp4|mov|avi|mkv)$/i.test(videoFileLocalpath)
  ) {
    // Throw an error if the file path is missing or doesn't match allowed extensions
    throw new Api_Error(400, "Invalid video file path provided");
  }

  // Proceed with using `videoFileLocalpath` for further processing
  let videoFile;
  try {
    videoFile = await uploadOnCloudinary(videoFileLocalpath);
  } catch (error) {
    Api_Error(500, `failed to upload video file on cloudinary ${error}`);
  }
  const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    time: videoFile.duration,
    owner: req.user?._id,
  });

  // console.log("duration", videoFile.duration);

  const videoUploaded = await Video.findById(video._id);
  if (!videoUploaded) {
    throw new Api_Error(500, "something went wrong while uploading video");
  }

  return res
    .status(201)
    .json(new Api_Response(200, videoUploaded, "video Uploaded  successfully"));

  // Proceed with using `videoFileLocalpath` for further processing
});
// next file
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Step 1: Check if videoId is provided
  if (!videoId) {
    throw new Api_Error(401, "Video ID is required");
  }

  let video;

  try {
    // Step 2: Attempt to retrieve video document by its ID from the database
    video = await Video.findById(videoId);

    // Step 3: Return video document if found
    return res.status(200).json(new Api_Response(200, video, "Video document found"));
  } catch (error) {
    // Step 4: Handle database connection or query error
    return res.status(404).json(new Api_Response(404, videoId, "Video document not found"));
  }
});



const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Step 1: Check if videoId is provided
  if (!videoId) {
    throw new Api_Error(401, "Video ID is required");
  }

  // Step 2: Extract title and description from request body
  const { title, description } = req.body;
  const thumbnailFileLocalPath = req?.file?.path;

  // Step 3: Prepare fields to update
  let updateFields = {};

  // Update title if provided
  if (title !== undefined && title !== "") {
    updateFields.title = title;
  }

  // Update description if provided
  if (description !== undefined && description !== "") {
    updateFields.description = description;
  }

  let thumbnail;

  // Step 4: Handle thumbnail upload to Cloudinary if a new thumbnail is provided
  if (thumbnailFileLocalPath) {
    try {
      thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
      updateFields.thumbnail = thumbnail.url;
    } catch (error) {
      throw new Api_Error(500, `Cloudinary upload error ${error}`);
    }
  }

  // Step 5: If a new thumbnail is uploaded, get the old thumbnail link for deletion
  let oldThumbnailCloudinaryLink = "";
  if (thumbnail && thumbnail.url) {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Api_Error(402, "Invalid video ID");
    }
    oldThumbnailCloudinaryLink = video.thumbnail; // Store the current thumbnail link
  }

  // Step 6: Perform the update operation if there are fields to update
  if (Object.keys(updateFields).length > 0) {
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $set: updateFields },
      { new: true }
    );

    // Step 7: Handle case where video ID is invalid
    if (!updatedVideo) {
      throw new Api_Error(402, "Invalid video ID");
    }

    // Step 8: Delete old thumbnail from Cloudinary if updated
    if (oldThumbnailCloudinaryLink !== "") {
      try {
        await deleteFileFromCloudinary(oldThumbnailCloudinaryLink);
      } catch (error) {
        throw new Api_Error(501, "Failed to delete image from Cloudinary");
      }
    }

    // Step 9: Return success message after updating the video
    return res
      .status(200)
      .json(new Api_Response(200, updatedVideo, "Video updated successfully"));
  }
});


const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Step 1: Find the video by ID
  let video;
  video = await Video.findById(videoId);

  // Step 2: Check if the video exists
  if (video) {
    // Step 3: Try to delete the video
    try {
      video = await Video.findByIdAndDelete(videoId);
    } catch (error) {
      throw new Api_Error(500, "Failed to delete video");
    }
  } else {
    // Return error if video ID does not exist
    return res
      .status(401)
      .json(new Api_Response(401, videoId, "Video ID does not exist"));
  }

  // Step 4: If video deletion was successful, delete associated files
  if (video !== null) {
    const thumbnaildel = video.thumbnail;
    const videodel = video.videoFile;

    // Step 5: Delete thumbnail from Cloudinary
    try {
      await deleteFileFromCloudinary(thumbnaildel);
    } catch (error) {
      throw new Api_Error(501, "Failed to delete thumbnail from Cloudinary");
    }

    // Step 6: Delete video file from Cloudinary
    try {
      await deleteFileFromCloudinary(videodel, "video");
    } catch (error) {
      throw new Api_Error(501, "Failed to delete video from Cloudinary");
    }

    // Step 7: Return success message after deleting video and associated files
    return res
      .status(200)
      .json(new Api_Response(200, video._id, "Successfully deleted video"));
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Step 1: Find the video by ID
  let video;
  video = await Video.findById(videoId);

  // Step 2: Check if the video exists
  if (video) {
    // Step 3: Toggle the publish status
    const isPublished = video.isPublished ? false : true;

    try {
      // Step 4: Update the publish status in the database
      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: isPublished } },
        { new: true }
      );

      // Step 5: Handle case where update is successful
      return res
        .status(200)
        .json(new Api_Response(200, updatedVideo.isPublished, "Successfully updated video status"));
    } catch (error) {
      // Step 6: Handle database update error
      throw new Api_Error(500, "Failed to update video status");
    }
  } else {
    // Step 7: Handle case where video ID does not exist
    return res
      .status(401)
      .json(new Api_Response(401, videoId, "Video ID does not exist"));
  }
});


export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
