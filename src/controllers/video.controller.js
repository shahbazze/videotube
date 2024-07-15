import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
    time:videoFile.duration,
    owner:req.user?._id,
  });

  console.log("duration",videoFile.duration);

  const videoUploaded = await Video.findById(video._id)
     .select("-videoFile -thumbnail");
  if (!videoUploaded) {
    throw new Api_Error(500, "something went wrong while uploading video");
  }

  return res
    .status(201)
    .json(new Api_Response(200, videoUploaded, "video Uploaded  successfully"));

  // Proceed with using `videoFileLocalpath` for further processing
});
// next
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
