const llmService = require("../services/llmService");

//function to detect image that stored already in backend system 
exports.detectText = async (req, res) => {
    try {
        // const {name: filename, prompt} = req.body; // Extract file from request
        // const { filepath, prompt } = req.body; // Extract file from request
        // if (!filepath || !prompt) {
        //     return res.status(400).json({ message: "Error: File name, and prompt are required" }); // Check if file is provided
        // }

        const {name: filename} = req.body; // Extract file from request

        if (!filename) {
            return res.status(400).json({ message: "Error: File name is required" }); // Check if file is provided
        }
        const response = await llmService.detectText(filename);

        // console.log(response)
        if (response.message === "Text detected successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(500).json(response); // Send error response
        }
    } catch (error) {
        console.error("Error detecting text:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't detect text" }); // Send error response
    }
};

// Function to upload new file then extract vital data from that file
exports.extractText = async (req, res) => {
    try {
        const file = req.file; // Extract file from request
        const owner = req.body.owner; // Extract owner from request body

        if (!file || !owner) {
            return res.status(400).json({ message: "Error: file and owner are required!" }); // Check if file is provided
        }

        const response = await llmService.extractText(file, owner);
        if (response.message === "Text extracted successfully!") {
            res.status(200).json(response); // Send success response with a 200 status code
        } else {
            res.status(500).json(response); // Send error response
        }
    } catch (error) {
        console.error("Error extracting text:", error); // Log error for debugging
        res.status(500).json({ message: "Error: Can't extract text" }); // Send error response
    }
}


// Function to extract text from a file by its name
// exports.extractText = async (req, res) => {
//     const fileName = req.body.name;
//     if (!fileName) {
//         return res.status(400).send("Image name is required"); // Check if file name is provided
//     }
//     try {
//         const response = await llmService.extractText(fileName);
//         res.status(200).json(response); // Send success response with a 200 status code
//     } catch (error) {
//         console.error("Error extracting text:", error); // Log error for debugging
//         res.status(500).json({ message: "Error: Can't extract text" }); // Send error response
//     }
// };

// // Function to detect text from an uploaded file
// exports.detectText = async (req, res) => {
//     try {
//         const file = req.file; // Extract file from request
//         if (!file) {
//             return res.status(400).json({ message: "Error: No file uploaded" }); // Check if file is provided
//         }
//         const fileBuffer = file.buffer;
//         const response = await llmService.detectText(fileBuffer);
//         if (response.message === "Text detected successfully!") {
//             res.status(200).json(response); // Send success response with a 200 status code
//         } else {
//             res.status(500).json(response); // Send error response
//         }
//     } catch (error) {
//         console.error("Error detecting text:", error); // Log error for debugging
//         res.status(500).json({ message: "Error: Can't detect text" }); // Send error response
//     }
// };

// // Function to detect text from an uploaded file (version 2)
// exports.detectTextV2 = async (req, res) => {
//     try {
//         const file = req.file; // Extract file from request
//         if (!file) {
//             return res.status(400).json({ message: "Error: No file uploaded" }); // Check if file is provided
//         }
//         const response = await llmService.detectTextV2(file);
//         console.log(response)
//         if (response.message === "Text detected successfully!") {
//             res.status(200).json(response); // Send success response with a 200 status code
//         } else {
//             res.status(500).json(response); // Send error response
//         }
//     } catch (error) {
//         console.error("Error detecting text:", error); // Log error for debugging
//         res.status(500).json({ message: "Error: Can't detect text" }); // Send error response
//     }
// };


// The following commented-out functions can be used for future extensions and debugging:

// Function to update text data (commented out for now)
// exports.updateText = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const file = req.file;
//         const body = req.body;
//         if (!id || !file || !body) {
//             return res.status(400).json({ message: "Error: Missing parameters" });
//         }
//         const response = await llmService.updateText(file, id, body);
//         if (response.message === "Text updated successfully!") {
//             res.status(200).json(response);
//         } else {
//             res.status(500).json({ message: "Error: Can't update text" });
//         }
//     } catch (error) {
//         console.error("Error updating text:", error);
//         res.status(500).json({ message: "Error: Can't update text" });
//     }
// }

// Function to delete text data (commented out for now)
// exports.deleteText = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const body = req.body;
//         if (!id || !body) {
//             return res.status(400).json({ message: "Error: Missing parameters" });
//         }
//         const response = await llmService.deleteText(id, body);
//         if (response.message === "Text deleted successfully!") {
//             res.status(200).json(response);
//         } else {
//             res.status(500).json({ message: "Error: Can't delete text" });
//         }
//     } catch (error) {
//         console.error("Error deleting text:", error);
//         res.status(500).json({ message: "Error: Can't delete text" });
//     }
// }

// Function to detect file data (commented out for now)
// exports.detectFile = async (req, res) => {
//     try {
//         const file = req.file;
//         if (!file) {
//             return res.status(400).json({ message: "Error: No file uploaded" });
//         }
//         const response = await llmService.detectFile(file);
//         if (response.message === "File detected successfully!") {
//             res.status(200).json(response);
//         } else {
//             res.status(500).json({ message: "Error: Can't detect file" });
//         }
//     } catch (error) {
//         console.error("Error detecting file:", error);
//         res.status(500).json({ message: "Error: Can't detect file" });
//     }
// }
