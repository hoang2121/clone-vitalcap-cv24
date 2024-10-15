const firebaseApp = require("../helper/firebaseApp");
const { getDatabase, ref, set, push, onValue, get} = require("firebase/database");
const db = getDatabase(firebaseApp);
const fileService = require("../services/fileService")

// Create a new document inside the chatRooms collection in the database
exports.generateChat = async (user1, user2) => {

    const chatRoomsReference = ref(db, 'chatRooms');
    // Retrieve data from the chat collection
    const chatSnapshot = await get(chatRoomsReference);

    let roomExists = false;
    // Check whether the room has been created or not
    chatSnapshot.forEach((child) => {
        // Check whether the room has been created or not
        const roomData = child.val();
        const users = roomData.users;

        if (users.includes(user2) && users.includes(user1)) {
            roomExists = true;
            return;
        }
    });

    if (!roomExists) {
        // Create a reference for a new child node and generate its unique ID
        const newRoomReference = push(chatRoomsReference);
        // Set values for the new node
        await set(newRoomReference, {
            users: [user1, user2],
            messages: []
        });
        return { message: "Create chat room successfully", chatRoomId: newRoomReference.key };
    } else {
        return { message: "Chat room between these users already exists" };
    }
};


// Store formated data in firebase realtime database
exports.postMessage = async (chatRoomID, sender, message, filename) => {
    const messagesReference = ref(db, `chatRooms/${chatRoomID}/messages`);
    const newMessageRef = push(messagesReference);
    const currentTime = new Date().toISOString(); // Use ISO string for time
    if(!filename){
        await set(newMessageRef, {
            sender,
            message,
            time: currentTime
        });
    }else{
        // Upload to Firestore Storage, get the URL, and pass the URL to set it
        // Initially, allow adding files one by one
        // Rename files with timestamp + sender
        // Allow the feature to reply to messages
        await set(newMessageRef, {
            sender,
            message,
            time: currentTime,
            path: filename
        });
    }

    console.log({ message: "Send message successfully" });
    return { message: "Message sent successfully" };
};

// Fetch all data from the chatRoom 
exports.fetchMessages = async (chatRoomID) => {
    const chatRoomsRef = ref(db, `chatRooms/${chatRoomID}/messages`);
    const snapshot = await get(chatRoomsRef);
    if (snapshot.exists()) {
        const messagesObj = snapshot.val();
        // Extract messages into an array
        const messages = await Promise.all(
            Object.keys(messagesObj).map(async key => {
                if (messagesObj[key].path) {
                    const { file } = await fileService.downloadFile({ name: messagesObj[key].path });
                    // console.log(file);
                    const { sender, time, message, path } = messagesObj[key];
                    const type = path.split(".")[1];
                    return { sender, time, message, file: {data: file, filetype: type} };
                } else {
                    return messagesObj[key];
                }
            })
        );
        console.log(messages);
        return { message: "Messages fetched successfully", messages };
    } else {
        console.log("No messages found");
        return { message: "No messages found" };
    }

};



/// CHAT SERVICES for GRPC or WEB SOCKET Chat
const crypto = require('crypto');
const dotenv = require("dotenv")
dotenv.config()
// Fixed key and IV (these should be securely stored and not hard-coded)
const key = crypto.scryptSync(process.env.ACCESS_TOKEN_SECRET, 'salt', 32); // Derives a 32-byte key from a password
const iv = Buffer.from(process.env.ACCESS_TOKEN_SECRET, 'hex'); // Fixed 16-byte IV in hexadecimal format

// Encryption function
function encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decryption function
function decrypt(encryptedText) {
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const Chat = require("../models/Chat");

// Create a new document inside the chatRooms collection in the database
exports.generateChat = async (user, members) => {
    try {
        const response = await Chat.generateChatRoom(user, members);
        return response;
    } catch (error) {
        return { message: "Error generating chat room!", error: error.message };
    }
};

// Fetch all data from the chatRoom
exports.fetchChatMessages = async (chatRoomID) => {
    try {
        const response = await Chat.fetchMessages(chatRoomID);

        // Decrypt each message in chatMessages if chatMessages is an array
        if (Array.isArray(response.chatMessages)) {
            response.chatMessages = response.chatMessages.map((chatMessage) => {
                return {
                    ...chatMessage,
                    message: decrypt(chatMessage.message)
                };
            });
        } else {
            // If chatMessages is a single object, decrypt its message field
            response.chatMessages.message = decrypt(response.chatMessages.message);
        }

        return response;
    } catch (error) {
        return { message: "Error fetching chat messages!", error: error.message };
    }
};

exports.fetchChatRooms = async (user) => {
    try {
        const response = await Chat.fetchChatRooms(user);
        return response;
    } catch (error) {
        return { message: "Error fetching chat rooms!", error: error.message };
    }
};

// Post a message to the chatRoom
exports.postMessage = async (chatRoomID, sender, message, file) => {
    try {
        const encryptedMessage = encrypt(message);
        const response = await Chat.postMessage(chatRoomID, sender, encryptedMessage, file);
        return response;
    } catch (error) {
        return { message: "Error posting message!", error: error.message };
    }
};

// Update a message in the chatRoom
exports.updateMessage = async (chatRoomID, messageName, sender, newMessage) => {
    try {
        const encryptedMessage = encrypt(newMessage);
        const response = await Chat.updateMessage(chatRoomID, messageName, sender, encryptedMessage);
        return response;
    } catch (error) {
        return { message: "Error updating message!", error: error.message };
    }
};

// Delete a message from the chatRoom
exports.deleteMessage = async (chatRoomID, messageName, sender) => {
    try {
        const response = await Chat.deleteMessage(chatRoomID, messageName, sender);
        return response;
    } catch (error) {
        return { message: "Error deleting message!", error: error.message };
    }
};

// Fetch chat members from the chatRoom
exports.fetchChatMembers = async (chatRoomID) => {
    try {
        const response = await Chat.fetchChatMembers(chatRoomID);
        return response;
    } catch (error) {
        return { message: "Error fetching chat members!", error: error.message };
    }
};
