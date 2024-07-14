import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  uodateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-Token").post(refreshAcessToken);

router.route("/chnagepassword").post(verifyJWT, changeCurrentUserPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-Account-Detail").patch(verifyJWT, uodateAccountDetail);

router
  .route("/Avatar-update")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/cover-img-update")
  .patch(verifyJWT, upload.single("updateUserAvatar"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
