const express = require('express');
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const authMiddleware = require("../middlewares/authMiddleware")
const isAuth = authMiddleware.isAuth;

router.post("/schedule", scheduleController.uploadSchedule);
router.put("/update-by-name", scheduleController.updateScheduleByName);
router.get("/schedules", scheduleController.getSchedules);
router.delete("/delete-by-name", scheduleController.deleteScheduleByName);

module.exports = router;