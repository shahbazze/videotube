import mongoose, { Schema, Types } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userschema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudnry
      required: true,
    },
    coverImage: {
      type: String, //cloudnry
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userschema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password =await bcrypt.hash(this.password, 10);
  next();
});

userschema.methods.isPasswordCorrect=async function(password)
{
  return await bcrypt.compare(password,this.password)
}

userschema.methods.generateAccessToken=function(){
   return jwt.sign(
        {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName,
    }, 
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userschema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
        _id:this._id,
    }, 
    process.env.REFERSH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFERSH_TOKEN_EXPIRY
    }
)
}
export const User = mongoose.model("User", userschema);
 