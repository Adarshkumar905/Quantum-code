import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from 'react';
import socket from "@/lib/socket.js";
import { getRoomById } from "@/common/services";
import { CodeEditor } from "@/components/shared/code-editor";
import { LanguageSelector } from "@/components/shared/language-selector";
import { Whiteboard } from "@/components/whiteboard";
import { FaCode } from 'react-icons/fa';
import { FaUsers } from 'react-icons/fa';
import { FaLock } from 'react-icons/fa';
import { FaComments } from 'react-icons/fa';
import { FaPalette } from 'react-icons/fa';

export const Route = createFileRoute("/room/$id")({
    component: Room,
});

function Room() {
    const { id: roomId } = Route.useParams();
    const router = useRouter();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const [users, setUsers] = useState([]);
    const prevUserNamesRef = useRef([]); 
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [username, setUsername] = useState("");
    const [notification, setNotification] = useState({ message: "", type: "" });
    const [remoteCursors, setRemoteCursors] = useState({});
    
    // WHITEBOARD & CHAT
    const [activeTool, setActiveTool] = useState('editor');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showLeaveWarning, setShowLeaveWarning] = useState(false);
    const [chatMode, setChatMode] = useState('global');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [privateNotification, setPrivateNotification] = useState({ show: false, from: "", fromId: null });
    
    // Unread counters & private convs
    const [unreadPublic, setUnreadPublic] = useState(0);
    const [privateConversations, setPrivateConversations] = useState({}); 
    const [readPrivateMessages, setReadPrivateMessages] = useState(new Set()); 
    const hasShownInitialNotificationsRef = useRef(false);

    const getUnreadPrivateCount = () => {
        let unread = 0;
        Object.keys(privateConversations).forEach(senderId => {
            const conv = privateConversations[senderId] || [];
            conv.forEach(msg => {
                const isUnread = !readPrivateMessages.has(msg.id);
                const isFromOthers = msg.senderId !== socket.id;
                
                if (isUnread && isFromOthers) {
                    unread++;
                }
            });
        });
        return unread;
    };
    
    // Clear unread when chat is open 
    useEffect(() => {
    if (isChatOpen && chatMode === 'global' && unreadPublic > 0) {
        setUnreadPublic(0);
    }
   }, [isChatOpen, chatMode, unreadPublic]);

    useEffect(() => {
        // Load room data after component mounts
        const loadRoomData = async () => {
            try {
                setLoading(true);
                const roomData = await getRoomById(roomId);
                setRoom(roomData);
                
            } catch (error) {
                console.error('Error loading room:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRoomData();
    }, [roomId]);

// Auto-mark private messages as read when viewing the conversation
useEffect(() => {
    if (isChatOpen && chatMode === 'private' && selectedUser) {
        const conv = privateConversations[selectedUser] || [];
        const unreadMessages = conv.filter(msg => 
            !readPrivateMessages.has(msg.id) && msg.senderId !== socket.id
        );
        
        if (unreadMessages.length > 0) {
            const ids = unreadMessages.map(m => m.id);
            setReadPrivateMessages(prev => {
                const newSet = new Set(prev);
                ids.forEach(id => newSet.add(id));
                return newSet;
            });
        }
    }
}, [isChatOpen, chatMode, selectedUser, privateConversations]);

    useEffect(() => {
        if (!roomId || loading) return;

        if (window.innerWidth < 768) {
            window.scrollTo(0, 0);
        }
        const storedUsername = localStorage.getItem('username') || 'Anonymous';
        setUsername(storedUsername);

        // Ensure socket is connected before emitting
        if (!socket.connected) {
            socket.connect();
        }

        const handleConnect = () => {
            socket.emit("join-room", { 
                roomId, 
                username: storedUsername 
            });
            socket.emit("load-public-messages", { roomId });
        };

        if (socket.connected) {
            handleConnect();
        } else {
            socket.on("connect", handleConnect);
        }

        // Code & language updates
        socket.on("update-code", (newContent) => setContent(newContent));
        socket.on("update-language", (language) => setSelectedLanguage(language));
        socket.on("restore-state", ({ code, language }) => {
            if (code) setContent(code);
            if (language) setSelectedLanguage(language);
        });

        socket.on("tool-state", ({ tool, isForced }) => {
            console.log(`🛠️ Received tool state: ${tool}, forced: ${isForced}`);
            setActiveTool(tool);
            if (isForced) {
                setNotification({ message: `Switched to ${tool}`, type: 'tool-switch' });
                setTimeout(() => setNotification({ message: "", type: "" }), 3000);
            }
        });

        // use diffing to show join/leave notifications only for actual changes
        socket.on("users-update", (list) => {
            const newNames = list.map(u => u.name);
            const prevNames = prevUserNamesRef.current;

            if (hasShownInitialNotificationsRef.current) {
                // detect joins & leaves
                const joined = newNames.filter(n => !prevNames.includes(n));
                const left = prevNames.filter(n => !newNames.includes(n));

                if (joined.length > 0) {
                    const joinedName = joined[0];
                    if (joinedName !== storedUsername) {
                        setNotification({ message: `${joinedName} joined the room`, type: 'join' });
                        setTimeout(() => setNotification({ message: "", type: "" }), 3000);
                    }
                }

                if (left.length > 0) {
                    const leftName = left[0];
                    if (leftName !== storedUsername) {
                        setNotification({ message: `${leftName} left the room`, type: 'leave' });
                        setTimeout(() => setNotification({ message: "", type: "" }), 3000);
                    }
                }
            } else {
                hasShownInitialNotificationsRef.current = true;
            }
            // Update previous names tracker and users list
            prevUserNamesRef.current = newNames;
            setUsers(list);
        });

        // cursor updates
        socket.on("user-cursor-update", ({ cursor, userId, username }) => {
            setRemoteCursors(prev => ({
                ...prev,
                [userId]: { ...cursor, username }
            }));
        });

        // tool switch notifications
        socket.on('tool-switched', (data) => {
            if (data.roomId === roomId) {
                if (data.isForced) {
                    setActiveTool(data.tool);
                    setNotification({ message: `${data.username} switched to ${data.tool}`, type: 'tool-usage' });
                    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
                } else {
                    setNotification({ message: `${data.username} is now using ${data.tool}`, type: 'tool-switch' });
                    setTimeout(() => setNotification({ message: "", type: "" }), 2000);
                }
            }
        });

        // PUBLIC MESSAGE 
     socket.on("public-message", (messageData) => {
    setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === messageData.id);
        if (messageExists) {
            return prev; 
        }
        const newMessages = [...prev, messageData];
        return newMessages;
    });
    if (isChatOpen && chatMode === 'global') {
        setTimeout(() => {
            const chatContainer = document.querySelector('.overflow-y-auto');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    }
    

    if (!isChatOpen || chatMode !== 'global') {
        setUnreadPublic(prev => prev + 1);
    }
});

        // PRIVATE MESSAGE RECEIVED
    socket.on("private-message-received", (messageData) => {
    const senderId = messageData.senderId;

    // Store in local conversation map
    setPrivateConversations(prev => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), messageData]
    }));

    const isActivelyChattingWithThisUser = selectedUser === senderId;
    if ((isChatOpen && chatMode === 'private' && isActivelyChattingWithThisUser) || isActivelyChattingWithThisUser) {
        setMessages(prev => [...prev, messageData]);
        setReadPrivateMessages(prev => new Set(prev).add(messageData.id));
        
        // Auto-scroll for new private messages 
        if (isChatOpen) {
            setTimeout(() => {
                const chatContainer = document.querySelector('.overflow-y-auto');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }, 100);
        }
    } else {
        setPrivateNotification({ 
            show: true, 
            from: messageData.sender, 
            fromId: senderId 
        });
        const timer = setTimeout(() => {
            setPrivateNotification({ show: false, from: "", fromId: null });
        }, 4000);
      }
   });

        socket.on("private-conversation-history", (history) => {
            if (Array.isArray(history)) {
                setMessages(history);
            } else if (history && history.withUserId) {
                const { withUserId, history: conv } = history;
                setPrivateConversations(prev => ({
                    ...prev,
                    [withUserId]: conv
                }));
                if (chatMode === 'private' && selectedUser === withUserId && isChatOpen) {
                    setMessages(conv);
                    const ids = conv.map(m => m.id);
                    setReadPrivateMessages(prev => {
                        const newSet = new Set(prev);
                        ids.forEach(id => newSet.add(id));
                        return newSet;
                    });
                }
            }
        });

        // Public Message history
        socket.on("public-messages-history", (history) => {
           if (chatMode === 'global') {
        setMessages(Array.isArray(history) ? history : []);
        setTimeout(() => {
            const chatContainer = document.querySelector('.overflow-y-auto');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
       }
      });

        // Page visibility / unload handlers
        const handleBeforeUnload = () => {
            socket.emit("leave-room", { roomId, username: storedUsername });
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            
            socket.emit("leave-room", { roomId, username: storedUsername });

            socket.off("connect", handleConnect);
            socket.off("update-code");
            socket.off("update-language");
            socket.off("restore-state");
            socket.off("tool-state");
            socket.off("users-update");
            socket.off("user-cursor-update");
            socket.off("tool-switched");
            socket.off("public-message");
            socket.off("private-message-received");
            socket.off("private-conversation-history");
            socket.off("public-messages-history");

            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            hasShownInitialNotificationsRef.current = false;
        };
    }, [roomId, loading]);

    // When chat opens/closes or mode changes
    useEffect(() => {
        if (isChatOpen) {
            if (chatMode === 'global') {
                
                loadPublicMessages();
                setUnreadPublic(0);
            } else if (chatMode === 'private') {
                if (selectedUser) {
                    loadPrivateConversation(selectedUser);
                } else {
                    setMessages([]);
                }
            }
        } else {
            
        }
    }, [isChatOpen, chatMode, selectedUser, privateConversations]);

    useEffect(() => {
    }, [privateConversations, readPrivateMessages]);

         useEffect(() => {
    if (isChatOpen && messages.length > 0) {
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 50);
        }
    }
}, [messages, isChatOpen]);

    // Emit code changes
    const handleChange = (content) => {
        setContent(content);
        socket.emit("code-change", { roomId, content });
    };

    // Emit language changes
    const handleLanguageSelector = (language) => {
        setSelectedLanguage(language);
        socket.emit("language-change", { roomId, language });
    };

    // Cursor changes
    const handleCursorChange = (cursorData) => {
        socket.emit("cursor-change", {
            roomId,
            cursor: cursorData,
            userId: socket.id,
            username: localStorage.getItem('username') || 'Anonymous'
        });
    };

    // Tool switches
    const handleToolSwitch = (tool) => {
        setActiveTool(tool);
        if (socket) {
            socket.emit('switch-tool', { 
                roomId, 
                tool,
                username: localStorage.getItem('username') || 'Anonymous',
                isForced: false
            });
        }
    };
    const handleForcedToolSwitch = (tool) => {
        setActiveTool(tool);
        if (socket) {
            socket.emit('switch-tool', { 
                roomId, 
                tool,
                username: localStorage.getItem('username') || 'Anonymous',
                isForced: true
            });
        }
    };

    // Send chat message
    const sendMessage = () => {
        if (!newMessage.trim()) return;
    
        const messageData = {
            id: Date.now().toString() + '-' + socket.id, 
            sender: username,
            senderId: socket.id,
            content: newMessage.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: chatMode 
        };
    
        if (chatMode === 'global') {
            socket.emit("send-chat-message", {
                roomId,
                message: messageData
            });
        } else if (chatMode === 'private' && selectedUser) {
            setMessages(prev => [...prev, messageData]);
            setPrivateConversations(prev => ({
                ...prev,
                [selectedUser]: [...(prev[selectedUser] || []), { ...messageData, recipientId: selectedUser }]
            }));
            setReadPrivateMessages(prev => new Set(prev).add(messageData.id));
    
            const payload = {
                roomId,
                message: {
                    ...messageData,
                    recipientId: selectedUser,
                    recipientName: users.find(u => u.id === selectedUser)?.name
                }
            };
            socket.emit("send-private-message", payload);
        }
    
        setNewMessage("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    // Load private conversation 
    const loadPrivateConversation = (userId) => {
        if (!userId) return;
        socket.emit("load-private-conversation", { roomId, otherUserId: userId });
    };

    // Load public messages
    const loadPublicMessages = () => {
        socket.emit("load-public-messages", { roomId });
    };

    // Private user select 
      const handlePrivateUserSelect = (userId) => {
       setSelectedUser(userId || null);
        if (userId) {
        const conversation = privateConversations[userId] || [];
        setMessages(conversation);  
        const ids = conversation.map(m => m.id);
        setReadPrivateMessages(prev => {
            const newSet = new Set(prev);
            ids.forEach(id => newSet.add(id));
            return newSet;
        });
        loadPrivateConversation(userId);  
        // Clear private notification if switching to this user
        if (privateNotification.show && privateNotification.fromId === userId) {
            setPrivateNotification({ show: false, from: "", fromId: null });
        }
      } else {
        setMessages([]);
        }
   };

    const handleCloseChat = () => {
        setIsChatOpen(false);
        setChatMode('global');
        setSelectedUser(null);
    };

    // Leave room function
    const handleLeaveRoom = () => {
          setShowLeaveWarning(true);
         };

    const confirmLeaveRoom = () => {
        socket.emit("leave-room", { 
        roomId, 
        username: localStorage.getItem('username') || 'Anonymous' 
       });
       router.navigate({ to: '/' });
    };

       const cancelLeaveRoom = () => {
       setShowLeaveWarning(false);
      };

    // Copy room id 
    const handleCopy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(roomId);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = roomId;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = roomId;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const displayRoomName = room?.roomName || "Loading...";

    const totalUnreadCount = unreadPublic + getUnreadPrivateCount();

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={`${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } fixed md:static md:translate-x-0 transition-transform duration-200
                w-64 sm:w-64 md:w-48 lg:w-64 h-full bg-gray-900 text-white flex flex-col justify-between z-[9999]`}>
                <div>
                    <div className="flex justify-between items-center p-4 border-b border-gray-700">
                        <h2 className="font-bold text-sm md:text-base">Users ({users.length})</h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden text-white p-1 hover:bg-gray-700 rounded"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <ul className="p-4 space-y-2">
                        {users.length > 0 ? (
                            users.map((u, i) => (
                                <li key={u.id || i} className="text-sm truncate flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    {u.name || `User ${i + 1}`}
                                </li>
                            ))
                        ) : (
                            <li className="text-sm text-gray-400">No users yet</li>
                        )}
                    </ul>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Room ID:</p>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate flex-1">{roomId}</span>
                        <button
                            onClick={handleCopy}
                            className="text-xs bg-purple-600 px-2 py-1 rounded hover:bg-purple-700 whitespace-nowrap flex-shrink-0 transition-colors"
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="flex justify-between items-center py-3.5 p-2 bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <button
                            className="md:hidden p-1 sm:p-2 bg-gray-700 text-white rounded text-xs"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <h1 className="text-sm sm:text-xl font-bold text-white ml-1 sm:ml-2 truncate max-w-[100px] sm:max-w-none">
                            {displayRoomName}
                        </h1>

                        <button 
                            className={`px-2 py-1 rounded-lg text-xs sm:text-sm flex items-center gap-1 ${
                                activeTool === 'editor' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            onClick={() => handleToolSwitch('editor')}
                        >
                            <FaCode className="text-xs sm:text-sm" />
                             <span>Code</span>
                        </button>
                        <button 
                            className={`px-2 py-1 rounded-lg text-xs sm:text-sm flex items-center gap-1 ${
                                activeTool === 'whiteboard' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            onClick={() => handleToolSwitch('whiteboard')}
                        >
                            <FaPalette className="text-xs sm:text-sm" />
                                  <span>WhiteBoard</span>
                        </button>
                    </div>

                    <div className="flex gap-1 sm:gap-2">
                        {/* Chat Toggle with Notification Dot */}
                        
                        <button 
                            className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 relative"
                            onClick={() => {
                                const newState = !isChatOpen;
                                setIsChatOpen(newState);
                            
                                if (newState) {
                                    // When opening chat
                                    if (chatMode === 'global') {
                                        setUnreadPublic(0);
                                        loadPublicMessages();
                                    } else if (chatMode === 'private' && selectedUser) {
                                        // Mark private conversation as read
                                        const conv = privateConversations[selectedUser] || [];
                                        const ids = conv.map(m => m.id);
                                        setReadPrivateMessages(prev => {
                                            const newSet = new Set(prev);
                                            ids.forEach(id => newSet.add(id));
                                            return newSet;
                                        });
                                        
                                        // Clear private notification if it's for the currently selected user
                                        if (privateNotification.show && privateNotification.fromId === selectedUser) {
                                            setPrivateNotification({ show: false, from: "", fromId: null });
                                        }
                                    }
                                    
                                    // Auto-scroll to bottom when opening
                                    setTimeout(() => {
                                        const chatContainer = document.querySelector('.overflow-y-auto');
                                        if (chatContainer) {
                                            chatContainer.scrollTop = chatContainer.scrollHeight;
                                        }
                                    }, 200);
                                }
                            }}
                        >
                            <FaComments className="text-xs sm:text-sm" />
                            <span>{isChatOpen ? 'Hide' : 'Chat'}</span>
                            
                            {/* Notification Dot: combined unread */}
                            {totalUnreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                            )}
                            {totalUnreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 min-w-[18px] h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white px-1">
                                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                                </div>
                            )}
                        </button>
                        <button 
                        className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 hover:bg-red-700 transition-colors"
                        onClick={handleLeaveRoom}
                       >
                       <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                       <span className="hidden sm:inline">Leave</span>
                       </button>
                    </div>
                </div>

                {/* Notification box */}
                {notification.message && (
                    <div className={`fixed bottom-4 right-4 px-4 py-2 text-white rounded-lg shadow-lg z-50 ${
                        notification.type === 'join' ? 'bg-green-600' : 
                        notification.type === 'leave' ? 'bg-red-600' :
                        notification.type === 'tool-switch' ? 'bg-yellow-500' : 'bg-purple-800'
                    }`}>
                        {notification.message}
                    </div>
                )}

                {/* Private message notification */}
                {privateNotification.show && (
                    <div className="fixed bottom-4 right-6 px-4 py-3 bg-gray-400 text-gray-900 rounded-lg shadow-lg z-50 border border-gray-300">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold text-sm">{privateNotification.from}</span>
                        </div>
                        <p className="text-sm font-medium mt-1">sent you a private message!</p>
                        <p className="text-xs text-gray-700 mt-1">Open private chat to reply</p>
                    </div>
                )}

                {/* Language selector */}
                {activeTool === 'editor' && (
                    <div className="p-2">
                        <LanguageSelector
                            value={selectedLanguage}
                            onChange={handleLanguageSelector}
                        />
                    </div>
                )}

                {/* Main workspace */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 relative">
                        {activeTool === 'editor' && (
                            <CodeEditor
                                language={selectedLanguage}
                                value={content}
                                onChange={handleChange}
                                onCursorChange={handleCursorChange}
                                remoteCursors={remoteCursors}
                            />
                        )}
                        {activeTool === 'whiteboard' && <Whiteboard roomId={roomId} />}
                    </div>
                </div>

                {/* Collapsible Chat Overlay */}
                {isChatOpen && (
                    <>
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" onClick={handleCloseChat} />
                    <div className="fixed inset-y-0 right-0 w-60 sm:w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-[9999] shadow-2xl">
                        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-700 bg-gray-900">
                            <div>
                                <h3 className="text-white font-semibold text-base sm:text-lg">
                                    {chatMode === 'global' ? (
                                        <>
                                            <FaUsers />
                                            <span>Public Chat</span>
                                        </>
                                    ) : selectedUser ? (
                                        <>
                                             <FaLock className="text-sm" /> 
                                            <span>Private with {users.find(u => u.id === selectedUser)?.name || privateConversations[selectedUser]?.[0]?.sender || 'User'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaLock className="text-sm" />
                                            <span>Private Chat</span>
                                        </>
                                    )}
                                </h3>
                                {chatMode === 'private' && selectedUser && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Chat with {users.find(u => u.id === selectedUser)?.name || 'User'}
                                    </p>
                                )}
                            </div>
                            <button 
                                className="text-gray-400 hover:text-white text-xl font-bold p-1"
                                onClick={handleCloseChat}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-800">
                            <div className="space-y-3">
                                {messages.length > 0 ? (
                                    messages
                                    .filter(msg => {
                                        if (chatMode === 'global') {
                                            return msg.type === 'global';
                                        }
                                        if (chatMode === 'private' && selectedUser) {
                                            return msg.type === 'private' && 
                                                ((msg.senderId === socket.id && msg.recipientId === selectedUser) ||
                                                 (msg.senderId === selectedUser && msg.recipientId === socket.id));
                                        }
                                        return false;
                                    })
                                        .map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`p-3 rounded-lg max-w-[85%] ${msg.senderId === socket.id ? 'ml-auto' : ''}`}
                                                style={{
                                                    background: msg.senderId === socket.id ? '#93c5fd' : '#d8b4fe',
                                                    color: '#0f172a' 
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-sm">
                                                        {msg.sender}
                                                        {msg.senderId === socket.id && ' (You)'}
                                                    </span>
                                                    <span className="text-xs opacity-75 ml-2">
                                                        {msg.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-sm break-words">{msg.content}</p>
                                                {msg.recipientName && msg.senderId === socket.id && (
                                                    <p className="text-xs opacity-75 mt-1">
                                                        To: {msg.recipientName}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-gray-400 text-center py-6 sm:py-8">
                                        <div className="text-3xl sm:text-4xl mb-3 sm:mb-4"> 
                                            <FaComments className="inline" />
                                        </div>
                                        <p className="text-xs sm:text-sm">
                                            {chatMode === 'global' 
                                                ? "No messages yet. Start a conversation!" 
                                                : selectedUser 
                                                ? `No messages with ${users.find(u => u.id === selectedUser)?.name || 'User'} yet.`
                                                : "Select a user to start a private conversation."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-900">
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={
                                        chatMode === 'global' 
                                            ? "Message everyone..." 
                                            : selectedUser 
                                            ? `Private message to ${users.find(u => u.id === selectedUser)?.name || 'User'}...`
                                            : "Select a user to message..."
                                    }
                                    disabled={chatMode === 'private' && !selectedUser}
                                    className="flex-1 px-2 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 text-xs sm:text-sm disabled:opacity-50"
                                />
                                <button 
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || (chatMode === 'private' && !selectedUser)}
                                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-transform duration-100 transform ${
                                        'bg-purple-600 text-white hover:bg-purple-700'
                                    } disabled:opacity-60 disabled:cursor-not-allowed active:scale-95`}
                                >
                                    Send
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 px-2 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-xs sm:text-sm"
                                    value={chatMode}
                                    onChange={(e) => {
                                        const newMode = e.target.value;
                                        setChatMode(newMode);
                                        
                                        if (newMode === 'global') {
                                            // Load public messages and reset unread
                                            loadPublicMessages();
                                            setUnreadPublic(0);
                                            setSelectedUser(null);
                                        } else {
                                            // Switch to private mode
                                            setMessages([]);
                                            if (selectedUser) {
                                                handlePrivateUserSelect(selectedUser);
                                            }
                                        }
                                    }}
                                >
                                    <option value="global">Public Chat</option>
                                    <option value="private">Private Chat</option>
                                </select>
                                
                                {chatMode === 'private' && (
                                    <select 
                                        className="flex-1 px-2 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm"
                                        value={selectedUser || ''}
                                        onChange={(e) => handlePrivateUserSelect(e.target.value)}
                                    >
                                        <option value="" hidden>
                                            {Object.keys(privateConversations).length > 0 ? 'Recent conversations...' : 'Select user...'}
                                        </option>

                                        {users.filter(user => user.id !== socket.id).map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}

                                        {Object.keys(privateConversations).filter(id => !users.some(u => u.id === id)).map(id => (
                                            <option key={id} value={id}>
                                                {privateConversations[id]?.[0]?.sender || `User ${id}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                    </div>
                    </>
                )}
            </div>
                        {/* LEAVE WARNING MODAL - ADD THIS RIGHT BEFORE THE LAST DIV */}
                        {showLeaveWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-gray-800 p-6 rounded-lg border border-red-500 max-w-sm mx-4">
                        <h3 className="text-white text-lg font-semibold mb-3">Leave Room?</h3>
                        <p className="text-gray-300 mb-4">Are you sure you want to leave this room?</p>
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={cancelLeaveRoom}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLeaveRoom}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Room;
