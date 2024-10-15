const express = require('express');
const router = express.Router();
const notificationController = require("../controllers/notificationController"); 
const authMiddleware = require("../middlewares/authMiddleware")
const isAuth = authMiddleware.isAuth;

router.post("/notification", notificationController.uploadNoti);
router.put("/notification-by-id", notificationController.updateNotiById);
router.get("/notifications", notificationController.getNotis);
router.delete("/notification-by-id", notificationController.deleteNotiById);

module.exports = router;