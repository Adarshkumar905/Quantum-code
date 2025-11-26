import { Server } from 'socket.io';
import { Room } from "../module/Room/schema.js";

const roomUsers = new Map();
const userSessions = new Map();
const whiteboardStates = new Map();
const roomActiveTools = new Map();
const roomChatMessages = new Map();

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
        },
    });

    io.on("connection", (socket) => {
        
        let currentRoomId = null;
        let currentUsername = null;

        // Join room
        socket.on("join-room", async (data) => {
            const { roomId, username } = data;
            // Check if user is already in room
            if (currentRoomId === roomId && roomUsers.has(roomId) && roomUsers.get(roomId).has(socket.id)) {
                return;
            }
            currentRoomId = roomId;
            currentUsername = username;
            await new Promise(resolve => setTimeout(resolve, 500));
            const room = await Room.findOne({ roomId }).lean().exec();
            if (!room) {
                socket.emit("room-error", { message: "Room not found" });
               
                if (roomUsers.has(roomId)) {
                    roomUsers.delete(roomId);
                }
                return;
            }
            if (socket.rooms.size > 1) {
                const previousRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
                previousRooms.forEach(prevRoom => {
                    socket.leave(prevRoom);
                });
            }          
            socket.join(roomId);
            // Send current state to joining user
            if (roomActiveTools.has(roomId)) {
                const currentTool = roomActiveTools.get(roomId);
                socket.emit("tool-state", { 
                    tool: currentTool,
                    isForced: true 
                });
            }
            // Check if same user refreshing or reconnection 
            const userKey = `${roomId}-${username}`;
            const isReconnect = userSessions.has(userKey);

            // Remove any previous session for the user
            userSessions.forEach((sessionSocketId, key) => {
                if (key === userKey && sessionSocketId !== socket.id) {
                    userSessions.delete(key);                  
                    if (roomUsers.has(roomId) && roomUsers.get(roomId).has(sessionSocketId)) {
                        roomUsers.get(roomId).delete(sessionSocketId);
                    }
                }
            });
            
            // Store current session
            userSessions.set(userKey, socket.id);
 
            if (!roomUsers.has(roomId)) {
                roomUsers.set(roomId, new Map());
            }
            
            const user = {
                id: socket.id,
                name: username || `User ${socket.id.substring(0, 4)}`
            };
            
            const existingUsers = roomUsers.get(roomId);
            let userAlreadyExists = false;
            
            for (const [existingSocketId, existingUser] of existingUsers) {
                if (existingUser.name === username && existingSocketId !== socket.id) {
                    existingUsers.delete(existingSocketId);
                    break;
                }
            }
            
            const isNewUserInRoom = !existingUsers.has(socket.id);
            
            existingUsers.set(socket.id, user);
            
            //  Only emit users-update if user is actually new to the room
            if (isNewUserInRoom) {
                const usersInRoom = Array.from(existingUsers.values());
                io.to(roomId).emit("users-update", usersInRoom);
            }
            // Only send join notification for NEW users, not reconnections
            if (!isReconnect) {
                io.to(roomId).emit("user-joined", username);
            } else {
                console.log(` User ${username} reconnected to room ${roomId}`);
            }

            // Send restore-state only to the connecting user
            socket.emit("restore-state", {
                code: room.code || "",
                language: room.language || "javascript",
            });

            // Send whiteboard state 
            if (whiteboardStates.has(roomId)) {
                socket.emit("whiteboard-state", {
                    paths: whiteboardStates.get(roomId)
                });
            }

            // Send public chat history to joining user
            if (roomChatMessages.has(roomId)) {
                const publicMessages = roomChatMessages.get(roomId).filter(msg => msg.type === 'global');
                socket.emit("public-chat-history", publicMessages);
            }
        });

        // show code changes
        socket.on("code-change", async ({ roomId, content }) => {
            io.to(roomId).emit("update-code", content);
            await Room.findOneAndUpdate({ roomId }, { code: content }, { upsert: true });
        });

        // show language changes
        socket.on("language-change", async ({ roomId, language }) => {
            socket.to(roomId).emit("update-language", language);
            await Room.findOneAndUpdate({ roomId }, { language }, { upsert: true });
        });

        // Handle cursor tracking 
        socket.on("cursor-change", ({ roomId, cursor, userId, username }) => {
            socket.to(roomId).emit("user-cursor-update", { cursor, userId: userId || socket.id, username });
        });

        socket.on("switch-tool", ({ roomId, tool, username, isForced }) => {
            roomActiveTools.set(roomId, tool);
            // show to all other users in the room
            socket.to(roomId).emit("tool-switched", {
                roomId,
                tool,
                username,
                isForced
            });
        });

        // public chat messages
         socket.on("send-chat-message", (data) => {
        const { roomId, message } = data;
    
        if (!roomChatMessages.has(roomId)) {
          roomChatMessages.set(roomId, []);
         }
         const existingMessages = roomChatMessages.get(roomId);
         const messageExists = existingMessages.some(msg => msg.id === message.id);
    
    if (!messageExists) {
        roomChatMessages.get(roomId).push(message);
        
        // Keep only last 100 messages
        if (roomChatMessages.get(roomId).length > 100) {
            roomChatMessages.set(roomId, roomChatMessages.get(roomId).slice(-100));
        }
    }
    
    // show to all users in the room INCLUDING the sender
    io.to(roomId).emit("public-message", message);
  });

        ///  private messages
    socket.on("send-private-message", (data) => {
    const { roomId, message } = data;

    const conversationKey1 = `${roomId}-${message.senderId}-${message.recipientId}`;
    const conversationKey2 = `${roomId}-${message.recipientId}-${message.senderId}`;
    
     if (!roomChatMessages.has(conversationKey1)) {
        roomChatMessages.set(conversationKey1, []);
       }
     if (!roomChatMessages.has(conversationKey2)) {
        roomChatMessages.set(conversationKey2, []);
       }
    
      roomChatMessages.get(conversationKey1).push(message);
      roomChatMessages.get(conversationKey2).push(message);
    
       // Keep only last 100 messages
     if (roomChatMessages.get(conversationKey1).length > 100) {
        roomChatMessages.set(conversationKey1, roomChatMessages.get(conversationKey1).slice(-100));
       }
     if (roomChatMessages.get(conversationKey2).length > 100) {
        roomChatMessages.set(conversationKey2, roomChatMessages.get(conversationKey2).slice(-100));
       }

      socket.to(message.recipientId).emit("private-message-received", message);
    });

        // loading private conversation
        socket.on("load-private-conversation", (data) => {
            const { roomId, otherUserId } = data;
            const conversationKey1 = `${roomId}-${socket.id}-${otherUserId}`;
            const conversationKey2 = `${roomId}-${otherUserId}-${socket.id}`;
            
            let conversation = [];
            if (roomChatMessages.has(conversationKey1)) {
                conversation = roomChatMessages.get(conversationKey1);
            } else if (roomChatMessages.has(conversationKey2)) {
                conversation = roomChatMessages.get(conversationKey2);
            }
            // Sort by timestamp
            conversation.sort((a, b) => parseInt(a.id) - parseInt(b.id));
            
            socket.emit("private-conversation-history", conversation);
        });

        //  loading public messages
        socket.on("load-public-messages", (data) => {
            const { roomId } = data;
            if (roomChatMessages.has(roomId)) {
                const publicMessages = roomChatMessages.get(roomId).filter(msg => msg.type === 'global');
                socket.emit("public-messages-history", publicMessages);
            } else {
                socket.emit("public-messages-history", []);
            }
        });

        // whiteboard drawing with persistence
        socket.on("whiteboard-draw", (data) => {
            const { roomId, data: whiteboardData } = data;

            if (whiteboardData.paths) {
                whiteboardStates.set(roomId, whiteboardData.paths);
            }

            socket.to(roomId).emit("whiteboard-update", whiteboardData);
        });

        // whiteboard clear 
        socket.on("whiteboard-clear", (data) => {
            const { roomId } = data;
            whiteboardStates.delete(roomId);
            socket.to(roomId).emit("whiteboard-cleared");
        });

        // whiteboard join requests
        socket.on("whiteboard-join", (data) => {
            const { roomId } = data;            
            socket.join(roomId);
            
            // Send current whiteboard state to the joining user
            if (whiteboardStates.has(roomId)) {
                socket.emit("whiteboard-state", {
                    paths: whiteboardStates.get(roomId)
                });
            }
        });

        // socket room connections
        socket.on("get-room-info", (roomId) => {
            const room = io.sockets.adapter.rooms.get(roomId);
            const roomSize = room ? room.size : 0;
            const whiteboardState = whiteboardStates.has(roomId) ? whiteboardStates.get(roomId).length : 0;
            const currentTool = roomActiveTools.get(roomId) || 'none';
            
            const users = roomUsers.get(roomId) ? Array.from(roomUsers.get(roomId).values()).map(u => u.name) : [];
    
            socket.emit("room-info", { 
                roomId, 
                userCount: roomSize,
                trackedUsers: users,
                whiteboardPaths: whiteboardState,
                currentTool: currentTool
            });
        });

        // whiteboard states
        socket.on("get-whiteboard-state", (roomId) => {
            const state = whiteboardStates.get(roomId);
            socket.emit("whiteboard-debug", {
                hasState: whiteboardStates.has(roomId),
                pathCount: state ? state.length : 0,
                state: state || null
            });
        });

        socket.on("disconnect", (reason) => {
            userSessions.forEach((sessionSocketId, userKey) => {
                if (sessionSocketId === socket.id) {
                    userSessions.delete(userKey);
                }
            });
            
            // remove user from all rooms and notify others
            roomUsers.forEach((users, roomId) => {
                if (users.has(socket.id)) {
                    const user = users.get(socket.id);
                    users.delete(socket.id);

                    if (users.size === 0) {
                        roomUsers.delete(roomId);
                        roomActiveTools.delete(roomId);
                    } else {
                        // Emit updated users list
                        const usersInRoom = Array.from(users.values());
                        io.to(roomId).emit("users-update", usersInRoom);
                        io.to(roomId).emit("user-left", user.name);
                    }
                }
            });
        });

        // manual leave room
        socket.on("leave-room", (data) => {
            const { roomId, username } = data;
            
            if (roomUsers.has(roomId) && roomUsers.get(roomId).has(socket.id)) {
                const user = roomUsers.get(roomId).get(socket.id);
                roomUsers.get(roomId).delete(socket.id);
                
                const userKey = `${roomId}-${username}`;
                userSessions.delete(userKey);
                
                const usersInRoom = Array.from(roomUsers.get(roomId).values());
                io.to(roomId).emit("users-update", usersInRoom);
                io.to(roomId).emit("user-left", user.name);
            }          
            socket.leave(roomId);
        });
    });

    // room cleanup function
    const cleanupAllRooms = () => {
        roomUsers.clear();
        userSessions.clear();
        whiteboardStates.clear();
        roomActiveTools.clear();
        roomChatMessages.clear();
    };

    global.socketCleanup = cleanupAllRooms;
};