const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController")
const authMiddleware = require("../middlewares/authMiddleware")
// const isAuth = authMiddleware.isAuth;

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.put("/change-password", authController.changePassword);
router.put("/reset-password", authController.resetPassword);
router.delete("/delete-auth", authController.deleteAuth);
module.exports = router; 