import connectDb from "./db/index.js";

import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

connectDb()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.port}`);
  })
})
.catch((err) => {
  console.log("MONGO db connection failed !!! ", err);
})


/*

import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}
        /${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("ERRR",error);
            throw error;
        })
        app.listen(process.env.port,()=>{
            console.log(`app is listen on ${process.env.port}`);
        })
  } catch (error) {
    console.log("Error occur", error);
    throw error;
  }
})();



*/
