// Express Route Handlers
const adminService = require("../services/adminService");

// Function to get all users
exports.getUsers = async (req, res) => {
    try {
        // Call adminService to fetch all users
        const users = await adminService.getUsers();
        // Send the list of users with a 200 status code
        res.status(200).json(users);
    } catch (error) {
        // Send an error message with a 403 status code in case of failure
        res.status(500).json({ error: error.message });
    }
};

// Function to delete a user by email
exports.deleteUser = async (req, res) => {
    try {
        const userEmail = req.params.email; // Extract user email from request parameters
        const response = await adminService.deleteUser({ email: userEmail }); // Call adminService to delete the user
        // Send success message with a 200 status code
        res.status(200).json(response);
    } catch (error) {
        // Send an error message with a 403 status code in case of failure
        res.status(500).json({ error: error.message });
    }
};

// Function to delete a user by email
exports.deleteAllUsers = async (req, res) => {
    try {
        const response = await adminService.deleteAllUsers(); // Call adminService to delete the user
        if (response.message === "Users deleted successfully!"){
            res.status(200).json(response);
        }else{
            // Send an error message with a 403 status code in case of failure
            res.status(403).json("Error while deleting all users as the admin role!");
        }
    } catch (error) {
        // Send an error message with a 403 status code in case of failure
        res.status(500).json({ error: error.message });
    }
};

// Function to modify a user by email
exports.modifyUser = async (req, res) => {
    try {
        const userEmail = req.params.email; // Extract user email from request parameters
        const modifiedUserData = req.body; // Extract modified user data from request body
        // Call adminService to modify the user data
        const response = await adminService.modifyUser({ email: userEmail, ...modifiedUserData });
        // Send success message with a 200 status code
        res.status(200).json(response);
    } catch (error) {
        // Send an error message with a 403 status code in case of failure
        res.status(500).json({ error: error.message });
    }
};
