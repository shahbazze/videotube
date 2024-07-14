import mongoose, { Schema } from "mongoose";

const tweetschema = new Schema({
    constent:{
        type:String,
        required:true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

},{timestamps:true})

export const tweet=mongoose.model("tweet",tweetschema)