const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for LAN
        methods: ["GET", "POST"]
    }
});

let waitingPlayer = null; // Simple queue: holds the socket of the waiting player

// Helper to get local IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Matchmaking Logic
    socket.on('join_lobby', () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            // Match found!
            const roomId = `${waitingPlayer.id}#${socket.id}`;
            console.log(`Match found: ${roomId}`);

            // Join both to room
            socket.join(roomId);
            waitingPlayer.join(roomId);

            // Notify players
            io.to(roomId).emit('match_found', { roomId, opponent: 'Player' });

            // Clear queue
            waitingPlayer = null;
        } else {
            // Verify not already waiting
            if (waitingPlayer && waitingPlayer.id === socket.id) return;

            // Queue this player
            waitingPlayer = socket;
            socket.emit('waiting_for_match');
            console.log(`Player queued: ${socket.id}`);
        }
    });

    // Game Events Relay
    socket.on('game_event', (data) => {
        // data should contain { roomId, type, payload }
        const { roomId, type, payload } = data;
        // Broadcast to others in the room (excluding sender if needed, or just broadcast)
        socket.to(roomId).emit('game_update', { type, payload });
    });

    // Specific relay for reliable state
    socket.on('send_move', ({ roomId, move }) => {
        socket.to(roomId).emit('receive_move', move);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null; // Remove from queue if they leave
        }
        // Ideally notify opponent if in game, but for simple MVP we skip complex reconnection
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    // Only log local IP if in dev mode or just always log it, but standard Render logs are fine.
    const ip = getLocalIP();
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
    console.log(`Connect from other devices via: http://${ip}:${PORT}`);
});
