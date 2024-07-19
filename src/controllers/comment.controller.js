import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  try {
    const comments = await Comment.aggregatePaginate(
      Comment.aggregate([
        {
          $match: {
            video: new mongoose.Types.ObjectId(videoId), // Match documents with the specified channel ID
          },
        },
        {
          $project: {
            owner: 1,
            content: 1,
          },
        },
      ]),
      options
    );
    if (comments) {
      return res
        .status(200)
        .json(
          new Api_Response(
            200,
            comments,
            "Successfully fetched comments detail on that video"
          )
        );
    } else {
      return res
        .status(200)
        .json(new Api_Response(200, comments, "No comments on that video"));
    }
  } catch (error) {
    throw new Api_Error(401, "correct Video ID required");
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const commentByUser = req.user._id;
  const { commentContent } = req.body;
  // check video is Valid

  if (commentContent.trim() === "") {
    throw new Api_Error(404, "No comment content: comment text is required");
  }
  try {
    const newComment = await Comment.create({
      content: commentContent,
      video: videoId,
      owner: commentByUser,
    });
    return res
      .status(200)
      .json(
        new Api_Response(200, newComment, `Successfully commented on video`)
      );
  } catch (error) {
    throw new Api_Error(
      401,
      `Error Occur:Enter Valid Video ID, ${error.message}`
    );
  }
});
const updateComment = asyncHandler(async (req, res) => {
    // Extract comment ID from URL parameters and comment content from request body
    const { commentId } = req.params;
    const { content } = req.body;
    const owner = req.user._id; // ID of the user making the request
  
    // Validate that the comment content is not empty
    if (content.trim() === "") {
      throw new Api_Error(404, "No comment content: comment text is required");
    }
  
    try {
      // Find the comment by its ID
      const Update = await Comment.findById(commentId);
  
      // Check if the owner of the comment matches the user making the request
      if (Update.owner.toString() === owner.toString()) {
        // Update the comment content and save it
        Update.content = content;
        await Update.save();
  
        // Send a success response with the updated comment
        return res.status(200).json(
          new Api_Response(
            200,
            Update,
            "Successfully updated comment content"
          )
        );
      } else {
        // Send a 401 Unauthorized response if the user is not the owner of the comment
        return res.status(401).json(
          new Api_Response(
            401,
            [],
            "You are not authorized to update this comment: you are not the owner"
          )
        );
      }
    } catch (error) {
      // error send a 400 Bad Request response
      throw new Api_Error(
        400,
        "Error occurred: Enter a valid comment ID to update the comment"
      );
    }
  });
  

  const deleteComment = asyncHandler(async (req, res) => {
    // Extract comment ID from URL parameters
    const { commentId } = req.params;
    // Extract the ID of the user making the request
    const owner = req.user._id;
  
    try {
      // Find the comment by its ID
      const deleteComment = await Comment.findById(commentId);
  
      // Check if the comment exists
      if (!deleteComment) {
        return res.status(404).json({
          status: 404,
          message: 'Comment not found'
        });
      }
  
      // Check if the owner of the comment matches the user making the request
      if (deleteComment.owner.toString() === owner.toString()) {
        // Perform the delete operation
        await Comment.findByIdAndDelete(commentId);
  
        // Send a success response indicating that the comment has been deleted
        return res.status(200).json(
          new Api_Response(
            200,
            deleteComment,
            "Successfully deleted comment"
          )
        );
      } else {
        // Send a 401 Unauthorized response if the user is not authorized
        return res.status(401).json(
          new Api_Response(
            401,
            [],
            "You are not authorized to delete this comment: you are not the owner"
          )
        );
      }
    } catch (error) {
      // Handle errors and send a 400 Bad Request response
      console.error('Error:', error);
      throw new Api_Error(
        400,
        "Error occurred: Enter a valid comment ID to delete the comment"
      );
    }
  });
  

export { getVideoComments, addComment, updateComment, deleteComment };
