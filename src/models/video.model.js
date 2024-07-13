import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoschema=new Schema({
    videoFile:{
        type:String,//cloudnry
        required:true
    },
    thumbnail:{
        type:String,//cloudnry
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    discription:{
        type:String,
        required:true,
    },
    time:{
        type:Number,//cloudnry
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
},{timestamps:true})

videoschema.plugin(mongooseAggregatePaginate)

export const Video=mongoose.model("Video",videoschema)