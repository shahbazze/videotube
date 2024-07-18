import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Api_Error } from "../utils/apiError.js";
import { Api_Response } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userCreatingPlaylist = req.user._id;

  // Log the name and user creating the playlist for debugging purposes
  console.log("name", name);
  console.log("user", userCreatingPlaylist);

  // Validate the name and description fields
  if (name.trim() === "" || description.trim() === "") {
    return res
      .status(404)
      .json(
        new Api_Response(
          404,
          "Failed to create playlist. Enter valid name and description"
        )
      );
  }

  try {
    // Create a new playlist with the provided name, description, and owner
    const playlist = await Playlist.create({
      name,
      description,
      videos: [], // Initialize with an empty array
      owner: userCreatingPlaylist,
    });

    // Return a successful response with the created playlist
    return res
      .status(200)
      .json(
        new Api_Response(
          200,
          playlist,
          `Successfully created playlist named ${name}`
        )
      );
  } catch (err) {
    // Handle errors during the create operation
    throw new Api_Error(500, `Error occurred: ${err.message}`);
  }
});
const getUserPlaylists = asyncHandler(async (req, res) => {
  // Extract userId from request parameters
  const { userId } = req.params;

  try {
    // Fetch playlists belonging to the specified user ID
    const playlistsData = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId), // Match documents with the specified user ID
        },
      },
    ]);

    // Check if no playlists are found
    if (playlistsData.length === 0) {
      return res
        .status(200)
        .json(new Api_Response(200, [], "No Playlist exists"));
    } else if (!playlistsData) {
      // Check if playlistsData is null or undefined
      throw new Api_Error(401, `Error occurred: Wrong user ID`);
    }

    // Map retrieved data to a more concise format
    const data = playlistsData.map((item) => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      videos: item.videos,
    }));

    // If data is successfully formatted, send it as a JSON response
    if (data) {
      return res
        .status(200)
        .json(
          new Api_Response(200, data, "Successfully fetched Playlists details")
        );
    }
  } catch (err) {
    // Handle errors during the aggregation operation
    throw new Api_Error(
      500,
      `Error occurred: No playlists found - ${err.message}`
    );
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  // Extract playlistId from request parameters
  const { playlistId } = req.params;

  try {
    const playlist = await Playlist.findById(playlistId);

    // Check if playlist exists; if yes, return it
    if (playlist) {
      return res
        .status(200)
        .json(
          new Api_Response(
            200,
            playlist,
            "Successfully fetched Playlist details"
          )
        );
    } else {
      // In case playlist is not found, throw an error
      throw new Api_Error(404, "Wrong playlist id");
    }
  } catch (err) {
    // Handle errors during the database operation
    throw new Api_Error(500, `Error occurred: ${err.message}`);
  }
});
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  try {
    // Check if the video exists in the database
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
      throw new Api_Error(404, "Wrong Video id");
    }

    // Check if the video is already in the playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res
        .status(404)
        .json(new Api_Response(404, [], "Playlist not found"));
    }

    if (playlist.videos.includes(videoId)) {
      return res
        .status(200)
        .json(
          new Api_Response(
            200,
            playlist,
            "Video already exists in the playlist"
          )
        );
    }

    // If not already in the playlist, add the video to the playlist
    playlist.videos.push(videoId);
    await playlist.save();

    // Return success response with updated playlist
    return res
      .status(200)
      .json(
        new Api_Response(200, playlist, "Successfully added video to playlist")
      );
  } catch (err) {
    // Handle errors
    throw new Api_Error(500, `Error occurred: ${err.message}`);
  }
});
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  try {
    // Find the playlist with the given ID and ensure it exists
    const playlist = await Playlist.findOne({ _id: playlistId });

    // Check if the video is already in the playlist
    if (playlist.videos.includes(videoId)) {
      // Remove the video from the playlist
      playlist.videos.pull(videoId);
      await playlist.save();

      // Return success response with updated playlist
      return res
        .status(200)
        .json(
          new Api_Response(
            200,
            playlist,
            "Successfully removed video from playlist"
          )
        );
    } else {
      // If the video is not in the playlist, return a message
      return res
        .status(200)
        .json(new Api_Response(200, playlist, "Video was not in the playlist"));
    }
  } catch (err) {
    // Handle errors
    throw new Api_Error(
      500,
      `Error occurred:wrong  Playlist ID: ${err.message}`
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  try {
    // Attempt to delete the playlist by its ID
    const delPlaylist = await Playlist.findByIdAndDelete(playlistId);

    // Check if playlist was successfully deleted
    if (delPlaylist) {
      return res
        .status(200)
        .json(
          new Api_Response(200, delPlaylist, "Successfully deleted playlist")
        );
    } else {
      return res
        .status(200)
        .json(new Api_Response(200, null, "No playlist with that id exists"));
    }
  } catch (err) {
    // Handle errors during the delete operation
    throw new Api_Error(
      500,
      `Error occurred: wrong Playlist ID - ${err.message}`
    );
  }
});
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    // TODO: update playlist
  
    // Check if playlistId exists
    if (playlistId) {
      try {
        // Initialize an empty object to store fields to update
        let updateFields = {};
  
        // Check if 'name' field is provided and not empty
        if (name.trim() !== "") {
          updateFields.name = name;
        }
  
        // Check if 'description' field is provided and not empty
        if (description.trim() !== "") {
          updateFields.description = description;
        }
  
        // Check if there are any fields to update
        if (Object.keys(updateFields).length > 0) {
          // Perform the update operation on the playlist
          const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { $set: updateFields },
            { new: true } // Return the updated document
          );
  
          // Return success response with the updated playlist
          return res.status(200).json(new Api_Response(200, updatedPlaylist, "Playlist updated successfully"));
        } else {
          // If no valid fields were provided for update, return a 401 status with a message
          return res.status(401).json(new Api_Response(401, [], "Provide name or description to update"));
        }
      } catch (err) {
        // Handle errors during the update operation
        throw new Api_Error(500, `Error occurred: wrong Playlist ID - ${err.message}`);
      }
    }
  });
  

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
