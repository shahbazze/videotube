import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscruption.model.js";
import { Like } from "../models/like.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  // Get the channel ID from the authenticated user's details
  const channelId = req.user._id;
  let stats = {};

  try {
    // Aggregate to get the number of subscribers for the channel
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId), // Match documents with the specified channel ID
        },
      },
    ]);

    // Aggregate to get the number of videos owned by the channel
    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelId), // Match documents with the specified channel ID
        },
      },
    ]);

    // Aggregate to get the likes information for each video
    const videoLikeAndInfo = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelId), // Match documents with the specified channel ID
        },
      },
      {
        $lookup: {
          from: "likes", // Name of the collection to join with
          localField: "_id", // Field from the Video collection
          foreignField: "video", // Field from the likes collection
          as: "likes", // Alias for the joined data
        },
      },
      {
        $addFields: {
          videoLikes: { $size: "$likes" }, // Add a field for the total number of likes on each video
        },
      },
      {
        $project: {
          _id: 1,
          owner: 1,
          title: 1, // Include other fields you want to project
          videoLikes: 1, // Include the totalLikes field
          description:1,
          thumbnail:1,
          videoFile:1,
          views:1,
        },
      },
    ]);

    // Calculate the total number of likes across all videos
    let totalLikesOnChannelVideos = 0;
    for (let i = 0; i < videoLikeAndInfo.length; i++) {
      totalLikesOnChannelVideos += parseInt(videoLikeAndInfo[i].videoLikes);
    }

    // Prepare the stats object with the aggregated data
    stats.subscribers = subscribers.length;
    stats.totalLikesOnChannelVideos = totalLikesOnChannelVideos;
    stats.videos = videos.length;
    stats.videoLikeAndInfo = videoLikeAndInfo;

    // Respond with the stats
    return res
      .status(200)
      .json(new Api_Response(200, stats, "Stats fetched successfully"));
  } catch (error) {
    // Handle any errors that occurred during the process
    throw new Api_Error(500, `Internal server error: ${error}`);
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelId = req.user._id;
  try {
    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelId), // Match documents with the specified channel ID
        },
      },{
        $project: {
          _id: 1,
          owner: 1,
          title: 1, // Include other fields you want to project
          description:1,
          thumbnail:1,
          videoFile:1,
          views:1,
        },
    }
    ]);
    // Respond with the stats
    return res
      .status(200)
      .json(new Api_Response(200, videos, "videos fetched successfully"));
  } catch (error) {
    // Handle any errors that occurred during the process
    throw new Api_Error(500, `Internal server error: ${error}`);
  }
});

export { getChannelStats, getChannelVideos };
