import { User } from "../models/user.model.js";
import { Api_Error } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) =>
{
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
  
      if(!token)
          {
              throw new Api_Error(401,"Unauthorized request ")
          }
  
       const decodedTokeInfo =   jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decodedTokeInfo?._id).select("-password -refreshToken")
  
      if(!user)
          {
              throw new Api_Error(401,"inavlid access")
          }
  
          req.user=user;
          next()
  } catch (error) {
    throw new Api_Error (401, error?.message || "invalid access token ")
  }
});
