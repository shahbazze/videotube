import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const LikedBy = req.user._id;
    // TODO: toggle like on video
    try 
    {
      // Check if the user already liked the video and unlike it if so
      const unlike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: LikedBy,
      });
  
      if (unlike) {
        // If the video was unliked, return success response
        return res.status(200).json(new Api_Response(200, unlike, "Successfully unliked video"));
      } else {
        // If the user has not liked the video, create a new like
        const like = await Like.create({
          video: videoId,
          likedBy: LikedBy,
        });
        
        // Return success response for liking the video
        return res.status(200).json(new Api_Response(200, like, "Successfully liked the video"));
      }
    } catch (error) {
      // Handle errors during the find and delete operation
      throw new Api_Error(500, `Error occurred: ${error.message}`);
    }
  });
  
  const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const LikedBy = req.user._id;
    
    try {
      // Check if the user already liked the comment and unlike it if so
      const unlike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: LikedBy,
      });
  
      if (unlike) {
        // If the comment was unliked, return success response
        return res.status(200).json(new Api_Response(200, unlike, "Successfully unliked comment"));
      } else {
        // If the user has not liked the comment, create a new like
        const like = await Like.create({
          comment: commentId,
          likedBy: LikedBy,
        });
        
        // Return success response for liking the comment
        return res.status(200).json(new Api_Response(200, like, "Successfully liked the comment"));
      }
    } catch (error) {
      // Handle errors during the find and delete operation
      throw new Api_Error(500, `Error occurred: ${error.message}`);
    }
    //TODO: toggle like on comment
  });
  

  const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const LikedBy = req.user._id;
    
    try {
      // Check if the user already liked the tweet and unlike it if so
      const unlike = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: LikedBy,
      });
  
      if (unlike) {
        // If the tweet was unliked, return success response
        return res.status(200).json(new Api_Response(200, unlike, "Successfully unliked tweet"));
      } else {
        // If the user has not liked the tweet, create a new like
        const like = await Like.create({
          tweet: tweetId,
          likedBy: LikedBy,
        });
        
        // Return success response for liking the tweet
        return res.status(200).json(new Api_Response(200, like, "Successfully liked the tweet"));
      }
    } catch (error) {
      // Handle errors during the find and delete operation
      throw new Api_Error(500, `Error occurred: ${error.message}`);
    }
    //TODO: toggle like on tweet
  });
  const getLikedVideos = asyncHandler(async (req, res) => {
    // Extract the ID of the user who liked the videos from request context
    const LikedByuser = req.user._id;
  
    try {
      // Aggregate to find all videos liked by the user
      const userlikedVideos = await Like.aggregate([
        {
          $match: {
            likedBy: new mongoose.Types.ObjectId(LikedByuser), // Match documents with the specified user ID
          },
        },
        {
          $group: {
            _id: null, // Group all documents into a single group
            videos: { $push: "$video" }, // Push each video ID into an array
          },
        },
        {
          $lookup: {
            from: "videos", // Collection name to lookup (replace with actual collection name)
            localField: "videos", // Field from the previous stage (group stage)
            foreignField: "_id", // Field from the videos collection
            as: "likedVideos", // Store matching videos in likedVideos array
          },
        },
        {
          $unwind: "$likedVideos", // Deconstruct the likedVideos array
        },
        {
          $project: {
            _id: "$likedVideos._id", // Include video ID
            title: "$likedVideos.title", // Include video title
            description: "$likedVideos.description", // Include video description
            thumbnail: "$likedVideos.thumbnail", // Include video thumbnail
            videoFile: "$likedVideos.videoFile", // Include video file
          },
        },
      ]);
  
      // If no videos are liked by the user
      if (!userlikedVideos.length) {
        return res
          .status(200)
          .json(new Api_Response(200, [], "No videos liked by user"));
      }
  
      // Shape the data in JSON format
      const likedVideos = userlikedVideos.map((item) => ({
        _id: item._id,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        videoFile: item.videoFile,
      }));
  
      // Return successfully fetched liked video details
      return res.status(200).json(
        new Api_Response(200, likedVideos, "Successfully fetched liked videos")
      );
    } catch (error) {
      // Handle errors during the aggregation operation
      throw new Api_Error(500, `Error occurred: ${error.message}`);
    }
  });
  

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
