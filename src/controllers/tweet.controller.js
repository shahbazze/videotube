import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  console.log(content);
  let tweet;
  try {
    tweet = await Tweet.create({
      content: content,
      owner: req.user?._id,
    });
  } catch (error) {
    throw new Api_Error(500, `failed to reate tweet ${error}`);
  }
  return res
    .status(200)
    .json(new Api_Response(200, tweet, "successfully tweet created"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // Attempt to fetch tweets for the logged-in user
  try {
    const userId = req.user._id; // Assuming req.user._id contains the logged-in user's ID

    // Find all tweets by the user and sort by creation date, latest first
    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    // If no tweets are found, return a 404 error
    if (!tweets || tweets.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tweets found for the user",
      });
    }

    // Return the fetched tweets in a successful response
    return res
      .status(200)
      .json(new Api_Response(200, tweets, "Successfully fetched tweets"));
  } catch (error) {
    // Handle any errors that occur during the process
    return res
      .status(500)
      .json(new Api_Response(500, error.message, "Failed to fetch tweets"));
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { updateContent } = req.body;
  //TODO: update tweet
  let updatetweet;
  if (tweetId && updateContent) {
    try {
      updatetweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content: updateContent } },
        { new: true }
      );
      if (updateTweet) {
        return res
          .status(200)
          .json(
            new Api_Response(
              200,
              updatetweet,
              "Successfully updated tweet content"
            )
          );
      }
    } catch (error) {
      throw new Api_Error(500, "Failed to update content");
    }
  }
});
const deleteTweet = asyncHandler(async (req, res) => {
    // Attempt to delete a tweet based on the provided tweetId
    try {
      const { tweetId } = req.params;
  
      let tweet;
  
      // Find and delete the tweet by its ID
      if (tweetId) {
        tweet = await Tweet.findByIdAndDelete(tweetId);
      }
  
      // Return success message after deleting the tweet
      if (tweet) {
        return res
          .status(200)
          .json(new Api_Response(200, tweet, "Successfully deleted tweet"));
      } else {
        // Return error if tweet ID does not exist
        return res
          .status(404)
          .json(new Api_Response(404, null, "Tweet ID does not exist"));
      }
    } catch (error) {
      // Handle any errors that occur during the deletion process
      throw new Api_Error(500, "Failed to delete tweet");
    }
  });
  

export { createTweet, getUserTweets, updateTweet, deleteTweet };
