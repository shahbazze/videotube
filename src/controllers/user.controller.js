import { asyncHandler } from "../utils/asyncHandler.js";
import { Api_Error } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary , deleteFileFromCloudinar} from "../utils/cloudinary.js";

import { Api_Response } from "../utils/apiResponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const generateAccessAndResfreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshtoken = refreshtoken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshtoken,
    };
  } catch (error) {
    throw new Api_Error(
      500,
      "something went wrong while generating refresh and access token "
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new Api_Error(400, "All fields are required");
  }
  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existeduser) {
    throw new Api_Error(409, "user with emil or username already exists");
  }

  const avatarlocalpath = req.files?.avatar[0]?.path;

  // const coverImagelocalpath = req.files?.coverImage[0]?.path;

  let coverImagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalpath = req.files.coverImage[0]?.path;
  }

  if (!avatarlocalpath) {
    throw new Api_Error(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarlocalpath);

  const coverImage = await uploadOnCloudinary(coverImagelocalpath);
  if (!avatar) {
    throw new Api_Error(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email: email,
    password: password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new Api_Error(500, "something went wrong while regestring user");
  }

  return res
    .status(201)
    .json(new Api_Response(200, createdUser, "User regesitred successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new Api_Error(400, "Username or password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new Api_Error(404, "User not exist");
  }

  const ispasswordvalid = await user.isPasswordCorrect(password);

  if (!ispasswordvalid) {
    throw new Api_Error(401, "incorrect user password");
  }

  const { accessToken, refreshtoken } = await generateAccessAndResfreshToken(
    user._id
  );

  const logInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json(
      new Api_Response(
        200,
        {
          user: logInUser,
          accessToken,
          refreshtoken,
        },
        "user loggedin successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshtoken", options)
    .json(new Api_Response(200, {}, "user loggedout successfully"));
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingrefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingrefreshToken) {
    throw new Api_Error(401, "unAuthorized access");
  }
  try {
    const decodedToken = jwt.verify(
      incomingrefreshToken,
      process.env.REFERSH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new Api_Error(401, "Invalid refresh Token");
    }
    if (incomingrefreshToken !== user.refreshToken) {
      throw new Api_Error(401, "Refresh Token is Expired or Invalid");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshtoken } =
      await generateAccessAndResfreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToke", accessToken, options)
      .cookie("refreshToken", newrefreshtoken, options)
      .json(
        new Api_Response(
          200,
          accessToken,
          newrefreshtoken,
          "Access Token refresh successfully"
        )
      );
  } catch (error) {
    throw new Api_Error(401, error?.message || "Inalid refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new Api_Error(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Api_Response(200, {}, "password chnaged successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const uodateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new Api_Error(400, "All fields are required");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new Api_Response(200, user, "Acoount Details Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new Api_Error(400, "avatar is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar)
    {
      throw new Api_Error(400, "Error while uploading avatar on cloudniry");
    }
    // also delete old avatr from cloudnry
    // self work 
    // get old avatar (url) from database to delete it from cloudnry
    const userAvataroldLink = await User.findById(
      req.user?._id
    )
    userAvataroldLink=userAvataroldLink.avatar;
   
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          avatar:avatar.url
        }
      },
      {
        new:true
      }.select("-password")
    )

    // now delete 
    try {
      await deleteFileFromCloudinar(userAvataroldLink)
     } catch (error) {
      throw new Api_Error(501,"failed to delete image from cloudnry")
     }
    return res
    .status(200)
    .json(
      new Api_Response(200,user,"Avatar updated successfully")
    )
});


// update cover image 
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new Api_Error(400, "cover ImageLocal is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!coverImage)
    {
      throw new Api_Error(400, "Error while uploading coverImage on cloudniry");
    }
    // also delete old coverImage if it was there from cloudnry
    // coverImage was optional so it may not there
    // self work 
    // get old coverImage (url) from database to delete it from cloudnry
    
    const userCoverImageLink = await User.findById(
      req.user?._id
    )
    userCoverImageLink=userCoverImageLink.avatar;
   
    
    
    const user =   await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          coverImage:coverImage.url
        }
      },
      {
        new:true
      }.select("-password")
    )
    // now delete 
    try {
      await deleteFileFromCloudinar(userCoverImageLink)
     } catch (error) {
      throw new Api_Error(501,"failed to delete image from cloudnry")
     }
    return res
    .status(200)
    .json(
      new Api_Response(200,user,"Cover Image updated successfully")
    )
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  changeCurrentUserPassword,
  getCurrentUser,
 uodateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage
};
