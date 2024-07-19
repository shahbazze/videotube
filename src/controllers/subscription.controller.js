import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscruption.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Toggles the subscription status for a user on a given channel.
 *
 * - Deletes the subscription if found, indicating successful unsubscription.
 * - Creates a new subscription if none exists, indicating successful subscription.
 * - Handles errors during database operations and returns appropriate responses.
 *
 * @param {Object} req - Express request object containing user and channelId.
 * @param {Object} res - Express response object for sending JSON responses.
 */

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriber = req.user._id;

  // Initialize flag to determine if subscription needs to be created
  let createSubscription = false;

  try {
    // Attempt to find and delete the existing subscription
    const subUnsb = await Subscription.findOneAndDelete({
      subscriber: subscriber,
      channel: channelId,
    });

    if (subUnsb) {
      // Subscription found and deleted, respond with success message
      return res
        .status(200)
        .json(new Api_Response(200, subUnsb, "Successfully unsubscribed"));
    } else {
      // No existing subscription found, set flag to create a new one
      createSubscription = true;
    }
  } catch (err) {
    // Handle errors during the find and delete operation
    throw new Api_Error(500, `Error occurred: ${err.message}`);
  }

  if (createSubscription) {
    try {
      // Create a new subscription
      const newSubscription = await Subscription.create({
        subscriber: subscriber,
        channel: channelId,
      });

      // Respond with success message for the new subscription
      return res
        .status(200)
        .json(
          new Api_Response(200, newSubscription, "Successfully subscribed")
        );
    } catch (err) {
      // Handle errors during the create operation
      throw new Api_Error(500, `Error occurred: ${err.message}`);
    }
  }
});

// controller to return subscriber list of a channel
// Controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params; // Fetch channel ID from request parameters

  // Check if channelId is provided
  if (!channelId) {
    return res.status(404).json(new Api_Error(404, "Provide channel ID"));
  }

  try {
    // Aggregate pipeline to fetch subscribers' details
    const sub = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId), // Match documents with the specified channel ID
        },
      },
      {
        $group: {
          _id: null, // Group all documents into a single group
          subscribers: { $push: "$subscriber" }, // Push each subscriber into an array
        },
      },
      {
        $lookup: {
          from: "users", // Replace with your actual collection name
          localField: "subscribers",
          foreignField: "_id",
          as: "userDetails", // Store matching users' details in userDetails array
        },
      },
      {
        $unwind: "$userDetails", // Deconstruct the userDetails array
      },
      {
        $project: {
          _id: "$userDetails._id", // Include user ID
          username: "$userDetails.username", // Include username
          email: "$userDetails.email", // Include email
          avatar: "$userDetails.avatar", // Include avatar
          coverImage: "$userDetails.coverImage", // Include coverImage
        },
      },
    ]);

    // If no subscribers for the channel
    if (!sub.length) {
      return res
        .status(200)
        .json(new Api_Response(200, [], "No channels subscribed"));
    }

    // Shape the data in JSON format
    const userDetails = sub.map((item) => ({
      _id: item._id,
      username: item.username,
      email: item.email,
      avatar: item.avatar,
      coverImage: item.coverImage,
    }));

    // Return successfully fetched subscriber details
    return res
      .status(200)
      .json(
        new Api_Response(
          200,
          userDetails,
          "Successfully fetched subscriber details"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    // Return error response
    return res
      .status(500)
      .json(new Api_Error(500, error.message, "Invalid channel ID"));
  }
});

// Controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Check if channelId is provided
  if (!channelId) {
    return res.status(404).json(new Api_Error(404, "Provide channel ID"));
  }

  try {
    // Aggregate pipeline to fetch subscribers' details
    const sub = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(channelId), // Match documents with the specified channel ID
        },
      },
      {
        $group: {
          _id: null, // Group all documents into a single group
          channels: { $push: "$channel" }, // Push each subscriber into an array
        },
      },
      {
        $lookup: {
          from: "users", // Replace with your actual collection name
          localField: "channels",
          foreignField: "_id",
          as: "channelsDetails", // Store matching users' details in channelsDetails array
        },
      },
      {
        $unwind: "$channelsDetails", // Deconstruct the channelsDetails array
      },
      {
        $project: {
          _id: "$channelsDetails._id", // Include user ID
          username: "$channelsDetails.username", // Include username
          email: "$channelsDetails.email", // Include email
          avatar: "$channelsDetails.avatar", // Include avatar
          coverImage: "$channelsDetails.coverImage", // Include coverImage
        },
      },
    ]);

    // If no channels are subscribed by the user
    if (!sub.length) {
      return res
        .status(200)
        .json(new Api_Response(200, [], "No channels subscribed"));
    }

    // Shape the data in JSON format
    const channelsDetails = sub.map((item) => ({
      _id: item._id,
      username: item.username,
      email: item.email,
      avatar: item.avatar,
      coverImage: item.coverImage,
    }));

    // Return successfully fetched channels
    return res
      .status(200)
      .json(
        new Api_Response(
          200,
          channelsDetails,
          "Successfully fetched subscribed channels details"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    // Return error response
    return res
      .status(500)
      .json(new Api_Error(500, error.message, "Invalid channel ID"));
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
