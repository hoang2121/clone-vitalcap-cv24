const express = require('express');
const router = express.Router();
const fileController = require("../controllers/fileController")
const authMiddleware = require("../middlewares/authMiddleware")
const upload = require("../middlewares/multer")
const isAuth = authMiddleware.isAuth;

router.post("/upload", upload.single("file"),  fileController.uploadFile);
router.put("/update", upload.single("file"), fileController.updateFile);
router.get("/download", fileController.getFile);
router.get("/file-info", fileController.getFileInfo);
router.get("/files", fileController.getAllFiles);
router.put("/file-privacy", fileController.publicizeFile);
router.delete("/delete", fileController.deleteFile);

module.exports = router;