const fileServiceV2 = require("../services/fileServiceV2");

// Function to upload a file
exports.uploadFile = async (req, res) => {
    try {
        const file = req.file; // Extract file from request
        const owner = req.body.owner; // Extract owner from request body

        if (!file) {
            return res.status(400).json({ message: "Error: Can't find file" }); // Check if file is provided
        }

        if (!owner) {
            return res.status(400).json({ message: "Error: Owner needs to be provided" }); // Check if owner is provided
        }

        const response = await fileServiceV2.uploadFile(file, owner);
        if (response.message === "File uploaded successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else if (response.message === "File uploaded successfully") {
            res.status(201).json(response); // Send conflict response if file already exists
        } else {
            res.status(403).json({ message: "Error: Can't upload file" }); // Send error response
        }
    } catch (error) {
        console.error("Error uploading file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't upload file" }); // Send error response
    }
}

// Function to get all files for an owner
exports.getAllFiles = async (req, res) => {
    try {
        const { owner } = req.body; // Extract owner from request body

        if (!owner) {
            return res.status(400).json({ message: "Error: Owner is required" }); // Check if owner is provided
        }

        const response = await fileServiceV2.getAllFiles(owner);
        if (response.message === "Files got successfully!") {
            res.status(200).json(response); // Send success response with files
        } else {
            res.status(404).json({ message: "Error: Can't get files" }); // Send error response
        }
    } catch (error) {
        console.error("Error getting all files:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't get files" }); // Send error response
    }
};

// Function to  allowe owner to share files with other users with permission to edit or view
exports.sharingFile = async (req, res) => {
    try {
        const { name: fileName, email, permission } = req.body; // Extract fields from request body

        if (!fileName || !email || !permission) {
            return res.status(400).json({ message: "Error: File name, email, permission are required" }); // Check if required fields are provided
        }
        const response = await fileServiceV2.sharingFile(fileName, email, permission);
        if (response.message === 'File shared successfully!') {
            res.status(200).json({ message: "File shared successfully!" }); // Send success response for publicizing
        } else {
            res.status(403).json({ message: "Error: Can't execute the action of sharing file", detail: response.message }); // Send error response
        }
    } catch (error) {
        console.error("Error sharing file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't execute the action of sharing file" }); // Send error response
    }
};

// Function to allow owner to revoke permissions from all shared users
exports.undoSharingFile = async (req, res) => {
    try {
        const { name: fileName, email } = req.body; // Extract fields from request body

        if (!fileName || !email) {
            return res.status(400).json({ message: "Error: File name, email are required" }); // Check if required fields are provided
        }

        const response = await fileServiceV2.undoSharingFile(fileName, email);
        if (response.message === 'File undid sharing successfully!') {
            res.status(200).json({ message: "File undid sharing successfully!" }); // Send success response for privatizing
        } else {
            res.status(403).json({ message: "Error: Can't execute the action of undoing sharing file", detail: response.message }); // Send error response
        }
    } catch (error) {
        console.error("Error sharing file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't execute the action of undoing sharing file" }); // Send error response
    }
};

// Function to delete a file
exports.deleteFile = async (req, res) => {
    try {
        const fileName = req.body.name; // Extract file name from request body
        const email = req.body.email; // Extract file name from request body

        if (!fileName) {
            return res.status(400).json({ message: "Error: File name is required" }); // Check if required fields are provided
        }

        if (!email) {
            return res.status(400).json({ message: "Error: File email is required" }); // Check if required fields are provided
        }

        // const response = await fileServiceV2.deleteFile(fileName);
        const response = await fileServiceV2.deleteFileWithAuthCheck(fileName,email);
        if (response.message === "File deleted successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(403).json({ message: response.message }); // Send error response
        }
    } catch (error) {
        console.error("Error deleting file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't delete file" }); // Send error response
    }
}

// Function to update a file
exports.updateFile = async (req, res) => {
    try {
        const file = req.file; // Extract file from request
        const updateName = req.body.updateName; // Extract new name from request body
        const editor = req.body.editor;
        if (!file || !updateName || !editor) {
            return res.status(400).json({ message: "Error: File, update name, editor are required" }); // Check if required fields are provided
        }

        const response = await fileServiceV2.updateFile(file, updateName, editor);
        if (response.message === "File updated successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(403).json({ message: response.message }); // Send error response
        }
    } catch (error) {
        console.error("Error updating file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't update file" }); // Send error response
    }
}

// Function to publicize or privatize a file
exports.publicizeFile = async (req, res) => {
    try {
        const { name: fileName, privacy } = req.body; // Extract fields from request body

        if (!fileName || !privacy) {
            return res.status(400).json({ message: "Error: File name, and privacy are required" }); // Check if required fields are provided
        }

        const response = await fileServiceV2.publicizeFile(fileName, privacy);
        if (response.message === 'File publicized successfully!') {
            res.status(200).json({ message: "File publicized successfully!" }); // Send success response for publicizing
        } else if (response.message === 'File privatized successfully!') {
            res.status(200).json({ message: "File privatized successfully!" }); // Send success response for privatizing
        } else {
            res.status(403).json({ message: "Error: Can't publicize file" }); // Send error response
        }
    } catch (error) {
        console.error("Error publicizing file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't publicize file" }); // Send error response
    }
};

// Function to allow owner share a file to every one with permission 
exports.shareFileToAll = async (req, res) => {
    try {
        const { name: fileName, email, permission } = req.body; // Extract fields from request body

        if (!fileName || !email || !permission) {
            return res.status(400).json({ message: "Error: File name, email, permission are required" }); // Check if required fields are provided
        }

        const response = await fileServiceV2.shareFileToAll(fileName, email, permission);
        if (response.message === "File shared to all successfully!") {
            res.status(200).json({ message: "File shared to all successfully!" }); // Send success response for publicizing
        } else {
            res.status(403).json(response); // Send error response
        }
    } catch (error) {
        console.error("Error sharing file to all:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't share file to all" }); // Send error response
    }
};


// Function to update a file
exports.changeTagName = async (req, res) => {
    try {
        const {name: filename, email, tag} = req.body;
        if (!filename || !email || !tag ) {
            return res.status(400).json({ message: "Error: File name, email, tag name are required" }); // Check if required fields are provided
        }
        const response = await fileServiceV2.changeTagName(filename, email, tag);
        if (response.message === "Tag Name changed successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(403).json({ message: response.message }); // Send error response
        }
    } catch (error) {
        console.error("Error updating file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't update file" }); // Send error response
    }
}