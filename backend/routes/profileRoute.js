const express = require('express');
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware")
const isAuth = authMiddleware.isAuth;
const upload = require("../middlewares/multer")

router.put("/updateProfile/:email", isAuth,  profileController.updateProfile);
router.get("/getProfile/:email", isAuth, profileController.getProfile);
router.get("/get-file-sharable-profile", profileController.getSharableProfile);
router.delete("/deleteProfile/:email", isAuth, profileController.deleteProfile);
router.post("/upload-avatar", upload.single("file"), profileController.uploadAvatar);
router.get("/get-avatar", profileController.getAvatar);
router.put("/change-avatar", upload.single("file"), profileController.updateAvatar);
router.delete("/delete-avatar", profileController.deleteAvatar);
module.exports = router;