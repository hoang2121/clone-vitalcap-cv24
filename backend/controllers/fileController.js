const fileService = require("../services/fileService");

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

        const response = await fileService.uploadFile(file, owner);
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

// Function to delete a file
exports.deleteFile = async (req, res) => {
    try {
        const fileName = req.body.name; // Extract file name from request body
        const version = req.body.version; // Extract version from request body
        const owner = req.body.owner; // Extract owner from request body

        if (!fileName || !version || !owner) {
            return res.status(400).json({ message: "Error: File name, version, and owner are required" }); // Check if required fields are provided
        }

        const response = await fileService.deleteFile(fileName, version, owner);
        if (response.message === "File deleted successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(403).json({ message: "Error: Can't delete file" }); // Send error response
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
        const owner = req.body.owner; // Extract owner from request body

        if (!file || !updateName || !owner) {
            return res.status(400).json({ message: "Error: File, update name, and owner are required" }); // Check if required fields are provided
        }

        const response = await fileService.updateFile(file, updateName, owner);
        if (response.message === "File updated successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else if (response.message === "Error updating file: the file is not public") {
            res.status(403).json({ message: "Error updating file: the file is not public" }); // Send specific error response
        } else {
            res.status(403).json({ message: "Error: Can't update file" }); // Send error response
        }
    } catch (error) {
        console.error("Error updating file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't update file" }); // Send error response
    }
}

// Function to get a file
exports.getFile = async (req, res) => {
    try {
        const { name: fileName, version, owner } = req.body; // Extract fields from request body

        if (!fileName || !version || !owner) {
            return res.status(400).json({ message: "Error: File name, version, and owner are required" }); // Check if required fields are provided
        }

        const response = await fileService.getFile(fileName, version, owner);
        if (response.message === "File got successfully!") {
            if (response.file.buffer) {
                const fileExtension = fileName.split(".").pop(); // Extract file extension

                let contentType = "application/octet-stream";
                switch (fileExtension) {
                    case "mp4":
                        contentType = "video/mp4";
                        break;
                    case "png":
                        contentType = "image/png";
                        break;
                    case "jpeg":
                    case "jpg":
                        contentType = "image/jpeg";
                        break;
                }

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(response.file.buffer); // Send file buffer as response
            } else {
                res.status(404).json({ message: "Error: File not found" }); // Send error response if file not found
            }
        } else {
            res.status(404).json({ message: "Error: Can't get file" }); // Send error response
        }
    } catch (error) {
        console.error("Error getting file:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't get file" }); // Send error response
    }
};

// Function to get file information
exports.getFileInfo = async (req, res) => {
    try {
        const { name: fileName, version, owner } = req.body; // Extract fields from request body

        if (!fileName || !version || !owner) {
            return res.status(400).json({ message: "Error: File name, version, and owner are required" }); // Check if required fields are provided
        }

        const response = await fileService.getFileInfo(fileName, version, owner);
        if (response.message === "File info got successfully!") {
            res.status(200).json({ message: response.message, file: response.file }); // Send success response with file info
        } else {
            res.status(404).json({ message: "Error: File not found" }); // Send error response if file not found
        }
    } catch (error) {
        console.error("Error getting file info:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't get file info" }); // Send error response
    }
};

// Function to get all files for an owner
exports.getAllFiles = async (req, res) => {
    try {
        const { owner } = req.body; // Extract owner from request body

        if (!owner) {
            return res.status(400).json({ message: "Error: Owner is required" }); // Check if owner is provided
        }

        const response = await fileService.getAllFiles(owner);
        if (response.message === "Files got successfully!") {
            res.status(200).json({ files: response.files }); // Send success response with files
        } else {
            res.status(404).json({ message: "Error: Can't get files" }); // Send error response
        }
    } catch (error) {
        console.error("Error getting all files:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't get files" }); // Send error response
    }
};

// Function to publicize or privatize a file
exports.publicizeFile = async (req, res) => {
    try {
        const { name: fileName, version, owner, privacy } = req.body; // Extract fields from request body

        if (!fileName || !version || !owner || !privacy) {
            return res.status(400).json({ message: "Error: File name, version, owner, and privacy are required" }); // Check if required fields are provided
        }

        const response = await fileService.publicizeFile(fileName, version, owner, privacy);
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
