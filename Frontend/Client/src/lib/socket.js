import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4200";
const socket = io(socketUrl, {
    reconnectionDelayMax: 10000,
    transports: ['websocket', 'polling'],
    autoConnect: true
});

socket.on('connect', () => {
});

socket.on('disconnect', (reason) => {
});

socket.on('connect_error', (error) => {
});

export default socket;

