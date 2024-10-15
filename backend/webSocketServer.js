// socket.js
const socketIO = require("socket.io");
const Chat = require("./models/Chat");
const { postMessage, generateChatRoom, updateMessage, deleteMessage, fetchChatMessages, fetchChatMembers, fetchChatRooms } = require("./services/chatService");

const initSocketServer = (server) => {
    const io = socketIO(server);

    const queueMatch = [];

    let users = [];
    const addUser = (email, socketId) => {
        users.push({ email, socketId });
    };

    const removeUser = (socketId) => {
        users = users.filter((user) => user.socketId !== socketId);
    };

    const getUsers = (email) => {
        return users.filter((user) => user.email === email);
    };

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("addUser", (data) => {
            try {
            let email = data;
            console.log("This is user email " + email);
            let socketID = socket.id
            addUser(email, socketID);
            } catch (error) {
                console.error("Error add user while not focusing:", error.message);
            }
        });

        socket.on("generateChatRoom", async (data) => {
            try {
                let { email, members, roomName } = data;
                const response = await generateChatRoom(email, members, roomName);
                io.to(socket.id).emit("roomConnect", {
                    ...response
                }
                )
            } catch (error) {
                console.error("Error sending message:", error.message);
            }
        });

        socket.on("sendMessage", async (data) => {
            try {
                let { chatRoomID, sender, message, file } = data;
                const response = await postMessage(chatRoomID, sender, message, file);
                await fetchChatMembers(chatRoomID).filter(user => user !== sender).forEach(
                    async u => {
                        let user = await getUsers(u)
                        io.to(user.socketID).emit("messageSent", { response })
                    }
                )

                await getUsers(sender).forEach(user => {
                    io.to(user.socketID).emit("messageReceived", { response })
                });
            } catch (error) {
                console.error("Error sending message:", error.message);
            }
        });

        socket.on("updateMessage", async (data) => {
            try {
                let { chatRoomID, messageName, sender, newMessage } = data;
                const response = await updateMessage(chatRoomID, messageName, sender, newMessage);
                await fetchChatMembers(chatRoomID).forEach(
                    async u => {
                        let user = await getUsers(u)
                        io.to(user.socketID).emit("messageUpdated", { response })
                    }
                )
            } catch (error) {
                console.error("Error updating message:", error.message);
            }
        });

        socket.on("deleteMessage", async (data) => {
            try {
                let { chatRoomID, messageName, sender } = data;
                const response = await deleteMessage(chatRoomID, messageName, sender);
                await fetchChatMembers(chatRoomID).forEach(
                    async u => {
                        let user = await getUsers(u)
                        io.to(user.socketID).emit("messageDeleted", { response })
                    }
                )
            } catch (error) {
                console.error("Error deleting message:", error.message);
            }
        });


        socket.on("fetchMessages", async (data) => {
            try {
                let { chatRoomID } = data;
                const response = await fetchChatMessages(chatRoomID);
                await fetchChatMembers(chatRoomID).forEach(
                    async u => {
                        let user = await getUsers(u)
                        io.to(user.socketID).emit("messageDeleted", { response })
                    }
                )
            } catch (error) {
                console.error("Error fetching messages:", error.message);
            }
        });

        socket.on("fetchChatRooms", async (data) => {
            try {
                let { chatRoomID } = data;
                const response = await fetchChatRooms(chatRoomID);
                await fetchChatMembers(chatRoomID).forEach(
                    async u => {
                        let user = await getUsers(u)
                        io.to(user.socketID).emit("messageDeleted", { response })
                    }
                )
            } catch (error) {
                console.error("Error fetching messages:", error.message);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            removeUser(socket.id);

            // Leave private chat room on disconnect
            const rooms = io.sockets.adapter.rooms;
            for (const roomId in rooms) {
                if (rooms[roomId].sockets[socket.id]) {
                    socket.leave(roomId);
                }
            }
        });


    });
};

module.exports = { initSocketServer };
