const firebaseApp = require("../helper/firebaseApp");
const { getDatabase, ref, push, get, update, remove } = require("firebase/database");
const db = getDatabase(firebaseApp);
const fileService = require("../services/fileService");
const { uploadFile } = require("../services/fileServiceV2");
const { key } = require('../helper/HMACkey');
const crypto = require('crypto');
const fs = require('fs').promises;

// Create a new document inside the chatRooms collection in the database
exports.generateChatRoom = async (owner, members, roomName = "Room") => {
    try {
        const time = Date.now();
        const chatRoomName = `${roomName}-${time}`;
        const users = members.split(",").concat(owner);
        const chatRoomsReference = ref(db, 'chatRooms');

        const chatRoomsSnapshot = await get(chatRoomsReference);
        const roomsData = chatRoomsSnapshot.val();

        if (roomsData) {
            const roomExists = Object.values(roomsData).some(roomData => roomData.chatRoomName === chatRoomName);

            if (roomExists) {
                return { message: "Chat room between these users already exists" };
            }
        }

        const newChatRoomReference = await push(chatRoomsReference, {
            owner,
            chatRoomName,
            users,
            messages: []
        });

        const chatRoomID = newChatRoomReference.key;
        return { message: "Chat room created successfully", chatRoom: { chatRoomID, chatRoomName } };
    } catch (error) {
        console.error("Error generating chat room:", error);
        throw error;
    }
};

exports.fetchChatMembers = async (chatRoomID) => {
    try {
        const chatRoomsReference = ref(db, 'chatRooms');
        const chatRoomsSnapshot = await get(chatRoomsReference);
        const roomsData = chatRoomsSnapshot.val();
        let chatMembers = [];

        if (roomsData) {
            chatMembers = Object.entries(roomsData)
                .filter(([key, roomData]) => key === chatRoomID).users;
        }

        if (chatMembers.length > 0) {
            return { message: "Chat members fetched successfully", chatMembers };
        } else {
            console.log("Error: No chat member found");
            return { message: "Error: No chat rooms found" };
        }
    } catch (error) {
        console.error("Error fetching chat members:", error);
        throw error;
    }
};

exports.fetchChatRooms = async (user) => {
    try {
        const chatRoomsReference = ref(db, 'chatRooms');
        const chatRoomsSnapshot = await get(chatRoomsReference);
        const roomsData = chatRoomsSnapshot.val();
        let chatRooms = [];

        if (roomsData) {
            chatRooms = Object.entries(roomsData)
                .filter(([key, roomData]) => roomData.users.includes(user))
                .map(([key, roomData]) => ({
                    chatRoomID: key,
                    chatRoomName: roomData.chatRoomName
                }));
        }

        if (chatRooms.length > 0) {
            chatRooms.reverse(); // Reverse the array
            chatRooms = chatRooms.slice(0, 10); // Limit to 10 messages
            return { message: "Chat rooms fetched successfully", chatRooms };
        } else {
            console.log("No chat rooms found");
            return { message: "No chat rooms found" };
        }
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        throw error;
    }
};

// Store formatted data in Firebase Realtime Database
exports.postMessage = async (chatRoomID, sender, message, file = null) => {
    try {
        const chatRoomsReference = ref(db, 'chatRooms');
        const chatRoomsSnapshot = await get(chatRoomsReference);
        const roomsData = chatRoomsSnapshot.val();

        const roomExists = roomsData && Object.values(roomsData).some(roomData => roomData.users.includes(sender));

        if (!roomExists) {
            return { message: "No chat room found" };
        }

        const messagesReference = ref(db, `chatRooms/${chatRoomID}/messages`);
        const timestamp = Date.now();
        const messageName = `${sender}-${timestamp}`;
        let filepath = "";

        if (file) {
            const res = await uploadFile(file, sender);
            if (res.file) {
                filepath = res.file.filepath;
            } else {
                const hash = crypto.createHmac('sha256', key).update(file.buffer).digest('hex');
                const duplicateFile = await fileService.findFile({ hash, owners: sender });
                if (duplicateFile) {
                    filepath = duplicateFile.filepath;
                }
            }
        }

        const chatMessageContent = {
            messageName,
            sender,
            message,
            time: timestamp,
            filepath,
        };

        const newMessageReference = await push(messagesReference, chatMessageContent);
        const chatMessageID = newMessageReference.key;

        console.log({ message: "Message sent successfully", chatMessage: { chatMessageContent, chatMessageID } });
        return { message: "Message sent successfully" };
    } catch (error) {
        console.error("Error posting message:", error);
        throw error;
    }
};

// Update message in Firebase Realtime Database
exports.updateMessage = async (chatRoomID, messageName, sender, newMessage) => {
    try {
        const messagesReference = ref(db, `chatRooms/${chatRoomID}/messages`);
        const messagesSnapshot = await get(messagesReference);
        const messagesData = messagesSnapshot.val();

        if (messagesData) {
            const messageKey = Object.keys(messagesData).find(key => messagesData[key].messageName === messageName);

            if (messageKey) {
                const updatedMessage = {
                    ...messagesData[messageKey],
                    message: newMessage
                };
                await update(ref(db, `chatRooms/${chatRoomID}/messages/${messageKey}`), updatedMessage);
            }
        } else {
            console.log('No messages found.');
        }

        console.log({ message: "Message updated successfully" });
        return { message: "Message updated successfully" };
    } catch (error) {
        console.error("Error updating message:", error);
        throw error;
    }
};

// Delete message from Firebase Realtime Database
exports.deleteMessage = async (chatRoomID, messageName, sender) => {
    try {
        const messagesReference = ref(db, `chatRooms/${chatRoomID}/messages`);
        const messagesSnapshot = await get(messagesReference);
        const messagesData = messagesSnapshot.val();

        if (messagesData) {
            const messageKey = Object.keys(messagesData).find(key => messagesData[key].messageName === messageName);

            if (messageKey) {
                await remove(ref(db, `chatRooms/${chatRoomID}/messages/${messageKey}`));
            }
        } else {
            console.log('No messages found.');
        }

        console.log({ message: "Message deleted successfully" });
        return { message: "Message deleted successfully" };
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
};

// Fetch all messages from the chatRoom 
exports.fetchMessages = async (chatRoomID) => {
    try {
        const chatMessagesRef = ref(db, `chatRooms/${chatRoomID}/messages`);
        const messagesSnapshot = await get(chatMessagesRef);
        let chatMessages = [];

        if (messagesSnapshot.exists()) {
            chatMessages = Object.values(messagesSnapshot.val());
        }

        chatMessages.reverse(); // Reverse the array
        chatMessages = chatMessages.slice(0, 10); // Limit to 10 messages

        for (const chatMessage of chatMessages) {
            if (chatMessage.filepath) {
                chatMessage.buffer = await fs.readFile(chatMessage.filepath);
            }
        }

        return { message: "Messages fetched successfully", chatMessages };
    } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
    }
};
