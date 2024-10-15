const express = require('express');
const router = express.Router();
const fileControllerV2 = require("../controllers/fileControllerV2")
const authMiddleware = require("../middlewares/authMiddleware")
const upload = require("../middlewares/multer")
const isAuth = authMiddleware.isAuth;

router.post("/upload", upload.single("file"), fileControllerV2.uploadFile);
router.get("/files", fileControllerV2.getAllFiles);
router.post("/share-view-edit-one", fileControllerV2.sharingFile);
router.delete("/delete-share-all", fileControllerV2.undoSharingFile);
router.delete("/delete", fileControllerV2.deleteFile);
router.put("/update", upload.single("file"), fileControllerV2.updateFile);
router.put("/share-view-all", fileControllerV2.publicizeFile);
router.put("/share-edit-view-all", fileControllerV2.shareFileToAll);
router.put("/change-tag-name", fileControllerV2.changeTagName);

module.exports = router;