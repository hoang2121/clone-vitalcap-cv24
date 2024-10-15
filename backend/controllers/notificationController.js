const notificationService = require("../services/notificationService");
const Notification = require("../models/notification");


// Function to upload noti 
exports.uploadNoti = async (req, res) => {
    try {
        const {title, content, owner} = req.body;
        if (!title || !content || !owner) {
            return res.status(400).json({ message: "Error: Title, content, and owner is required" }); 
        }
        const response = await notificationService.uploadNoti(title, content, owner);
        if (response.message === "Upload notification successfully!") {
            return res.status(200).json({ message: response.message })
        } else {
            res.status(403).json(response);
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Function to update noti 
exports.updateNotiById = async (req, res) => {
    try {
        const { id, data } = req.body;
        if (!id || !data) {
            return res.status(400).json({ message: "Error: Id, and Data are required" }); // Check if required fields are provided
        }
        const response = await notificationService.updateNotiById(id, data);
        if (response.message === "Notification updated successfully!") {
            return res.status(200).json(response);
        } else {
            return res.status(403).json(response );
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Function to delete noti
exports.deleteNotiById = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Error: Id is required" }); // Check if required fields are provided
        }

        const response = await notificationService.deleteNotiById(id);
        if (response.message === "Delete notification successfully!") {
            return res.status(200).json(response );
        } else {
            return res.status(403).json(response);
        }

    } catch (error) {
        console.error("Error generating refresh token:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Function to get all notis
exports.getNotis = async (req, res) => {
    try {
        const { owner } = req.body;

        if (!owner) {
            return res.status(400).json({ message: "Error: Owner is required" }); // Check if required fields are provided
        }

        const response = await notificationService.getNotis(owner);
        if (response.message === "Get notifications successfully!") {
            return res.status(200).json( response );
        } else {
            return res.status(404).json( response );
        }
    } catch (err) {
        console.error("Error generating refresh token:", err);
        return res.status(500).json({ message: "Internal server error" });
    }

}

