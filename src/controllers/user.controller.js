import { asyncHandler } from "../utils/asyncHandler.js";
import { Api_Error } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { Api_Response } from "../utils/apiResponse.js";

const generateAccessAndResfreshToken = async (userId) => 
  {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshtoken = user.generateRefreshToken()

    user.refreshtoken=refreshtoken
    await user.save({validateBeforeSave :false})

    return {
      accessToken,refreshtoken
    }
  } catch (error) {
    throw new Api_Error(
      500,
      "something went wrong while generating refresh and access token "
    );
  }
}
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
    coverImagelocalpath = req.files.coverImage[0].path;
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
    coverImage: coverImage?.url || " ",
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

const {accessToken , refreshtoken} = await generateAccessAndResfreshToken(user._id)

const logInUser=await User.findById(user._id).
select("-password -refreshToken")

const options={
  httpOnly:true,
  secure:true
}

return res.status(200).cookie("accessToken",accessToken,options).
cookie("refreshtoken",refreshtoken,options)
.json(
  
    new Api_Response(200,
      {
        user:logInUser ,accessToken,refreshtoken
      },
      "user loggedin successfully"
    )
)
});

const logoutUser=asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{refreshToken:undefined}
    },
    {
      new:true
    }
  )
  const options={
    httpOnly:true,
    secure:true
  }
  return  res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshtoken",options)
  .json(new Api_Response (200,{},"user loggedout successfully"))
})

export { registerUser, loginUser,logoutUser };
