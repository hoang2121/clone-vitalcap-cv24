const express = require('express');
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware")
const isAuth = authMiddleware.isAuth;
// Route to get all users
router.get('/users',isAuth, adminController.getUsers);
router.delete('/delete/:email', isAuth, adminController.deleteUser);
router.put('/modify/:email', isAuth, adminController.modifyUser);
router.delete('/users/delete-all-users', adminController.deleteAllUsers);

module.exports = router;
