const chatService = require("../services/chatService");
const fileService = require("../services/fileService");

// Function to generate a chat between two users
exports.generateChat = async (req, res) => {
    const user1 = req.body.user1;
    const user2 = req.body.user2;
    console.log('Generating chat for users:', user1, user2); // Log user details for debugging

    try {
        const response = await chatService.generateChat(user1, user2);
        res.status(200).json(response); // Send response with a 200 status code
    } catch (error) {
        console.error('Error generating chat:', error); // Log error for debugging
        res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
};


// Function to post a message in a chat room
exports.postMessage = async (req, res) => {
    const chatRoomID = req.body.chatRoomID;
    const sender = req.body.sender;
    const message = req.body.message;
    const file = req.file;

    try {
        let filename = null;
        if (file) {
            const uploadResult = await fileService.uploadFile(file);
            filename = uploadResult.filename; // Extract filename from the upload result
        }

        const response = await chatService.postMessage(chatRoomID, sender, message, filename);
        res.status(200).json(response); // Send response with a 200 status code
    } catch (error) {
        console.error('Error posting message:', error); // Log error for debugging
        res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
};

// Function to fetch messages from a chat room
exports.fetchMessages = async (req, res) => {
    const chatRoomID = req.body.chatRoomID;

    try {
        const response = await chatService.fetchMessages(chatRoomID);
        res.status(200).json(response); // Send response with a 200 status code
    } catch (error) {
        console.error('Error fetching messages:', error); // Log error for debugging
        res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
};

// CHAT HTTP FOR GRPC or WEB SOCKET SERVER
// Function to generate a chat room between users
exports.generateChat = async (req, res) => {
    const user = req.body.user;
    const members = req.body.members;
    if(!members || !user){
        return res.status(400).json({ message: "Error: Can't generate chat room, no user data provided" });
    }

    try {
        const response = await chatService.generateRoom(user1, user2);
        res.status(200).json(response); // Send response with a 200 status code
    } catch (error) {
        console.error('Error generating chat:', error); // Log error for debugging
        res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
};

exports.fetchChatMessages = async (req, res) => {
    const user = req.body.user;
    const chatRoomID = req.body.chatRoomID;
    if (!chatRoomID || !user) {
        return res.status(400).json({ message: "Error: Can't generate chat room, no user data provided" });
    }

    try {
        const response = await chatService.fetchChatMessages(user, chatRoomID);
        res.status(200).json(response); // Send response with a 200 status code
    } catch (error) {
        console.error('Error generating chat:', error); // Log error for debugging
        res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
};