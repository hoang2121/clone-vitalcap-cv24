const firebaseApp = require("../helper/firebaseApp");
const { getDatabase, ref, set, push, get, update, remove, child, onValue } = require("firebase/database");
const db = getDatabase(firebaseApp);
const fileService = require("../services/fileService");
const { uploadFile } = require("../services/fileServiceV2");
const { key } = require('../helper/HMACkey');
const crypto = require('crypto');
const fs = require('fs').promises;

// Create a new document (room) inside the chatRooms collection in the database
exports.generateChatRoom = async (owner, members, roomName = "Room") => {
    try {
        const time = Date.now();
        const chatRoomName = `${roomName}-${time}`;
        const users = members.split(",").concat(owner);
        let roomExists = false;
        const chatRoomsReference = ref(db, 'chatRooms');

        onValue(chatRoomsReference, (chatRoomsSnapshot) => {
            let roomsData = chatRoomsSnapshot.val();
            if (roomsData) {
                for (const key in roomsData) {
                    const roomData = roomsData[key];
                    if (roomData.chatRoomName === chatRoomName) {
                        roomExists = true;
                    }
                    return;
                }
            } else {
                console.log('No rooms found.');
            }
        });

        if (!roomExists) {
            const newChatRoomReference = await push(chatRoomsReference, {
                owner,
                chatRoomName,
                users,
                messages: []
            });

            const chatRoomID = newChatRoomReference.key;

            return { message: "Chat room created successfully", chatRoom: { chatRoomID, chatRoomName } };
        } else {
            return { message: "Chat room between these users already exists" };
        }
    } catch (error) {
        console.error("Error generating chat room:", error);
        throw error;
    }
};
// Fetch all chat rooms' meta data belonging to user
exports.fetchChatRooms = async (user) => {
    try {
        const chatRoomsReference = ref(db, 'chatRooms');
        let chatRooms = [];

        onValue(chatRoomsReference, (chatRoomsSnapshot) => {
            let roomsData = chatRoomsSnapshot.val();
            if (roomsData) {
                for (const key in roomsData) {
                    const roomData = roomsData[key];
                    if (roomData.users.includes(user)) {
                        const roomInfo = {
                            chatRoomID: key,
                            chatRoomName: roomData.chatRoomName
                        };
                        chatRooms.push(roomInfo);
                    }
                    return;
                }
            } else {
                console.log('No rooms found.');
            }
        });

        if (chatRooms.length > 0) {
            // Reverse the array
            chatRooms.reverse();

            // Limit to 10 messages
            chatRooms = chatRooms.slice(0, 10);
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

// Store formatted data in messages DB, Firebase Realtime Database
exports.postMessage = async (chatRoomID, sender, message, file = null) => {
    try {
        let roomExists = false;
        const chatRoomsReference = ref(db, 'chatRooms');

        onValue(chatRoomsReference, (chatRoomsSnapshot) => {
            let roomsData = chatRoomsSnapshot.val();
            if (roomsData) {
                for (const key in roomsData) {
                    const roomData = roomsData[key];
                    if (roomData.users.includes(sender)) {
                        roomExists = true;
                    }
                    return;
                }
            } else {
                console.log('No rooms found.');
            }
        });

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

// Update message in messages DB, Firebase Realtime Database
exports.updateMessage = async (chatRoomID, messageName, sender, newMessage) => {
    try {
        const messagesReference = ref(db, `chatRooms/${chatRoomID}/messages`);

        onValue(messagesReference, async (messagesSnapshot) => {
            let messagesData = messagesSnapshot.val();
            if (messagesData) {
                for (const key in messagesData) {
                    const messageData = messagesData[key];
                    if (messageData.messageName === messageName) {
                        const updatedMessage = {
                            ...messageData,
                            message: newMessage
                        };
                        await update(ref(db, `chatRooms/${chatRoomID}/messages/${key}`), updatedMessage);
                    }
                    return;
                }
            } else {
                console.log('No messages found.');
            }
        });

        console.log({ message: "Message updated successfully" });
        return { message: "Message updated successfully" };
    } catch (error) {
        console.error("Error updating message:", error);
        throw error;
    }
};

// Delete message from messages DB, Firebase Realtime Database 
exports.deleteMessage = async (chatRoomID, messageName, sender) => {
    try {
        const messagesReference = ref(db, `chatRooms/${chatRoomID}/messages`);

        onValue(messagesReference, async (messagesSnapshot) => {
            let messagesData = messagesSnapshot.val();
            if (messagesData) {
                for (const key in messagesData) {
                    const messageData = messagesData[key];
                    if (messageData.messageName === messageName) {
                        await remove(ref(db, `chatRooms/${chatRoomID}/messages/${key}`));
                    }
                    return;
                }
            } else {
                console.log('No messages found.');
            }
        });

        console.log({ message: "Message deleted successfully" });
        return { message: "Message deleted successfully" };
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
};

// Fetch all messages from the messages DB inside chatRoom object 
// inside the chatRooms collection of Firebase realtime DB
exports.fetchMessages = async (chatRoomID) => {
    try {
        const chatMessagesRef = ref(db, `chatRooms/${chatRoomID}/messages`);
        let chatMessages = [];

        onValue(chatMessagesRef, async (messagesSnapshot) => {
            let chatMessagesData = messagesSnapshot.val();
            if (chatMessagesData) {
                for (const key in chatMessagesData) {
                    let chatMessageData = chatMessagesData[key];
                    chatMessages.push(chatMessageData);
                }
            } else {
                console.log('No rooms found.');
            }
        });

        // Reverse the array
        chatMessages.reverse();

        // Limit to 10 messages
        chatMessages = chatMessages.slice(0, 10);
        for (let chatMessage of chatMessages) {
            let buffer = null;
            if (chatMessage.filepath) {
                buffer = await fs.readFile(chatMessage.filepath);
            }
            chatMessage.buffer = buffer;
        }

        return { message: "Messages fetched successfully", chatMessages };
    } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
    }
};
