const express = require('express');
const llmRouter = express.Router();
const llmController = require("../controllers/llmController")
const authMiddleware = require("../middlewares/authMiddleware")
const isAuth = authMiddleware.isAuth;
const upload = require("../middlewares/multer")

// llmRouter.post("/extract-text", isAuth, llmController.extractText);
llmRouter.post("/detect-text", llmController.detectText);
llmRouter.post("/extract-text", upload.single("file"), llmController.extractText);
// llmRouter.post("/detect-text", upload.single("file"), llmController.detectText);
// llmRouter.post("/detect-text-v2", upload.single("file"), llmController.detectTextV2);
// llmRouter.put("/change-text", upload.single("file"), llmController.updateText);
// llmRouter.delete("/delete-text", llmController.deleteText);

module.exports = llmRouter;