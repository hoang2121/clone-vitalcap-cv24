const scheduleService = require("../services/scheduleService");
const Schedule = require("../models/schedule");


// Function to upload schedule
exports.uploadSchedule = async (req, res) => {
    try {
        // appointment_name, description, tags, owner, time
        const { sendTo, owner, appointmentName, content, timeCreated, timeAppointed} = req.body;
        if (!sendTo || !content || !owner || !appointmentName || !timeAppointed || !timeCreated) {
            return res.status(400).json({ message: "Error: Tags, Appointment name, Description and owner are required" });
        }
        const response = await scheduleService.uploadSchedule(sendTo,owner,appointmentName,content,timeAppointed, timeCreated)
        if (response.message === "Upload Schedule successfully!") {
            return res.status(200).json({ message: response.message })
        } else {
            res.status(403).json(response);
        }

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Function to update schedule
exports.updateScheduleByName = async (req, res) => {
    try {
        const { appointmentName, email, data } = req.body;
        if (!appointmentName || !email || !data) {
            return res.status(400).json({ message: "Error: Appointment name, Email, and Data are required" }); // Check if required fields are provided
        }
        const response = await scheduleService.updateScheduleByName(appointmentName, email, data);
        if (response.message === "Update schedule successfully!") {
            return res.status(200).json(response);
        } else {
            return res.status(403).json(response);
        }
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Function to delete schedule
exports.deleteScheduleByName = async (req, res) => {
    try {
        const { appointmentName, email } = req.body;

        if (!appointmentName || !email) {
            return res.status(400).json({ message: "Error: Email and Appointment name are required" }); // Check if required fields are provided
        }

        const response = await scheduleService.deleteScheduleByName(appointmentName, email);
        if (response.message === "Schedule deleted successfully!") {
            return res.status(200).json(response);
        } else {
            return res.status(403).json(response);
        }

    } catch (error) {
        console.error("Get Error: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Function to get all schedule by email
exports.getSchedules = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Error: Email is required" }); // Check if required fields are provided
        }

        const response = await scheduleService.getSchedules(email);
        if (response.message === "Get schedules successfully!") {
            return res.status(200).json(response);
        } else {
            return res.status(404).json(response);
        }
    } catch (err) {
        console.error("Gets Error: ", err);
        return res.status(500).json({ message: "Internal server error" });
    }

}

