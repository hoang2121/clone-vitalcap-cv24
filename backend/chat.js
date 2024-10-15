// socket.js
const socketIO = require("socket.io");
const Match = require("./models/Match");

const initSocketServer = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: ["http://localhost:3000"],
            credentials: true,
        },
    });

    const queueMatch = [];

    let users = [];

    const addUser = (userId, socketId) => {
        users.push({ userId, socketId });
    };

    const removeUser = (socketId) => {
        users = users.filter((user) => user.socketId !== socketId);
    };

    const getUsers = (userId) => {
        return users.filter((user) => user.userId === userId);
    };

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("addUser", (userId) => {
            console.log("This is user id " + userId);
            addUser(userId, socket.id);
        });

        socket.on("sendMessage", async (data) => {
            try {
                const matchId = data.matchId;
                const match = await Match.findById(matchId);

                if (match) {
                    const { sender, message } = data;
                    match.conversation.push({ sender, message });
                    await match.save();
                    const receiver = match.participants.find((user) => user !== sender);
                    console.log(users);
                    getUsers(receiver).map((user) => {
                        io.to(user?.socketId).emit("messageReceived", {
                            sender,
                            message,
                            matchId,
                        });
                    });

                    getUsers(sender).map((user) => {
                        io.to(user?.socketId).emit("messageReceived", {
                            sender,
                            message,
                            matchId,
                        });
                    });
                }
            } catch (error) {
                console.error("Error sending message:", error.message);
            }
        });

        socket.on("globalChatMessage", (data) => {
            console.log(data)
            io.emit("globalChatMessage", {
                message: data.message,
                user: data.user,
                id: data.id,
            });
        });

        socket.on("connectToQueue", (userData) => {
            const { userid, preferences } = userData;
            console.log(userData);

            // Add user to the queue with preferences
            queueMatch.push({ socket, userid, preferences });

            // Check for potential matches
            checkForMatches();
        });

        const checkForMatches = () => {
            // Iterate through the queue to find potential matches
            for (let i = 0; i < queueMatch.length - 1; i++) {
                const user1 = queueMatch[i];

                for (let j = i + 1; j < queueMatch.length; j++) {
                    const user2 = queueMatch[j];

                    // Check if preferences match
                    if (
                        preferencesMatch(user1.preferences, user2.preferences) &&
                        user1.userid !== user2.userid
                    ) {
                        const match = new Match({
                            participants: [user1.userid, user2.userid],
                            status: "available",
                            conversation: [],
                            // preferences: {
                            //   user1: user1.preferences,
                            //   user2: user2.preferences,
                            // },
                        });

                        match.save((err) => {
                            if (err) {
                                console.error("Error creating match:", err);
                            } else {
                                // Emit match found events to respective users
                                io.to(user1.socket.id).emit("matchFound", {
                                    matchId: match._id,
                                });
                                io.to(user2.socket.id).emit("matchFound", {
                                    matchId: match._id,
                                });

                                // Join private chat room
                                io.in(match._id).socketsJoin(match._id);
                            }
                        });

                        queueMatch.splice(j, 1);
                        queueMatch.splice(i, 1);

                        return;
                    }
                }
            }
        };

        const preferencesMatch = (prefs1, prefs2) => {
            let genderMatch = false;
            let levelMatch = prefs1.level == prefs2.level;

            genderMatch =
                prefs1.ownGender === prefs2.gender &&
                prefs2.ownGender === prefs1.gender;

            return genderMatch && levelMatch;
        };

        socket.on("disconnectFromQueue", () => {
            console.log("disconnectFromQueue");
            const index = queueMatch.findIndex((entry) => entry.socket === socket);
            if (index !== -1) {
                queueMatch.splice(index, 1);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            removeUser(socket.id);
            const index = queueMatch.findIndex((entry) => entry.socket === socket);
            if (index !== -1) {
                queueMatch.splice(index, 1);
            }

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
