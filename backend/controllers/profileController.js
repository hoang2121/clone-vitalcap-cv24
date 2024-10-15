const profileService = require("../services/profileService");

// Function to update a user profile
exports.updateProfile = async (req, res) => {
    const email = req.params.email; // Extract email from request parameters
    const data = req.body; // Extract profile data from request body
    data.email = email; // Ensure email is included in the data

    try {
        const response = await profileService.updateProfile(data);
        if (response.message === "Profile updated!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(403).json({ message: "Error: Unable to update profile!" }); // Send error response with a 400 status code
        }
    } catch (error) {
        console.error('Error updating profile:', error); // Log error for debugging
        res.status(500).json({ message: "Internal Server Error" }); // Send error response with a 500 status code
    }
}

// Function to delete a user profile
exports.deleteProfile = async (req, res) => {
    const email = req.params.email; // Extract email from request parameters
    const data = req.body; // Extract additional data from request body if needed
    data.email = email; // Ensure email is included in the data
    // console.log(data)
    try {
        const response = await profileService.deleteProfile(data);
        res.status(200).json(response); // Send success response with a 200 status code
    } catch (error) {
        console.error('Error deleting profile:', error); // Log error for debugging
        res.status(500).json({ message: "Internal Server Error" }); // Send error response with a 500 status code
    }
}
// 1. Function to get a user profile
// 2. Function to search user profile for sharing file in File service version 2. 
// It searches the profile by the  email of user provided
exports.getProfile = async (req, res) => {
    const email = req.params.email; // Extract email from request parameters
    const data = req.body; // Extract additional data from request body if needed
    data.email = email; // Ensure email is included in the data
    // console.log(data)
    try {
        const response = await profileService.getProfile(data);
        if (response.message === "Profile found!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(404).json({ message: "Error: Unable to find profile!" }); // Send error response with a 404 status code
        }
    } catch (error) {
        console.error('Error fetching profile:', error); // Log error for debugging
        res.status(500).json({ message: "Internal Server Error" }); // Send error response with a 500 status code
    }
}

// Function to search user profile for sharing file in File service version 2. 
// It searches the profile by the name of user provided
exports.getSharableProfile = async (req, res) => {
    const {name} = req.body; // Extract additional data from request body if needed
    try {
        const response = await profileService.getSharableProfile(name);
        if (response.message === "Profile found!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(404).json({ message: "Error: Unable to find profile!" }); // Send error response with a 404 status code
        }
    } catch (error) {
        console.error('Error fetching profiles:', error); // Log error for debugging
        res.status(500).json({ message: "Internal Server Error" }); // Send error response with a 500 status code
    }
}


//// Avatar ////

// Function to upload a avatar
exports.uploadAvatar = async (req, res) => {
    try {
        const file = req.file; // Extract file from request
        const email = req.body.email; // Extract owner from request body

        if (!file) {
            return res.status(400).json({ message: "Error: Can't find file" }); // Check if file is provided
        }

        if (!email) {
            return res.status(400).json({ message: "Error: Email needs to be provided" }); // Check if owner is provided
        }

        const response = await profileService.uploadAvatar(file, email);
        if (response.message === "Avatar uploaded successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else if (response.message === "Avatar uploaded successfully") {
            res.status(201).json(response); // Send conflict response if file already exists
        } else {
            res.status(403).json(response); // Send error response
        }
    } catch (error) {
        console.error("Error uploading file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't upload avatar" }); // Send error response
    }
}

// Function to get avatar for an owner
exports.getAvatar = async (req, res) => {
    try {
        const { email } = req.body; // Extract owner from request body

        if (!email) {
            return res.status(400).json({ message: "Error: Email is required" }); // Check if owner is provided
        }

        const response = await profileService.getAvatar(email);
        if (response.message === "Avatar got successfully!") {
            res.status(200).json(response); // Send success response with files
        } else {
            res.status(404).json(response); // Send error response
        }
    } catch (error) {
        console.error("Error getting avatar:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't get avatar" }); // Send error response
    }
};

// Function to delete an avatar
exports.deleteAvatar = async (req, res) => {
    try {
        const {email} = req.body; // Extract file name from request body

        if (!email) {
            return res.status(400).json({ message: "Error: File email is required" }); // Check if required fields are provided
        }

        const response = await profileService.deleteAvatar(email);
        if (response.message === "Avatar deleted successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(403).json({ message: response.message }); // Send error response
        }
    } catch (error) {
        console.error("Error deleting avatar:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't delete avatar" }); // Send error response
    }
}

// Function to update an avatar
exports.updateAvatar = async (req, res) => {
    try {
        const file = req.file; // Extract file from request
        const email = req.body.email;
        if (!file || !email) {
            return res.status(400).json({ message: "Error: File, email are required" }); // Check if required fields are provided
        }

        const response = await profileService.updateAvatar(file, email);
        if (response.message === "Avatar updated successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(403).json({ message: response.message }); // Send error response
        }
    } catch (error) {
        console.error("Error updating avatar:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't update avatar" }); // Send error response
    }
}
