import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

interface PlayerInfo {
  id: string;
  name: string;
  position: { x: number; y: number };
  direction: number;
  vocation: string;
  level: number;
  health: number;
  maxHealth: number;
}

const players = new Map<string, PlayerInfo>();

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Join game
  socket.on('join-game', (data: PlayerInfo) => {
    players.set(socket.id, { ...data, id: socket.id });

    // Send current player list
    const playersList = Array.from(players.values()).filter(p => p.id !== socket.id);
    socket.emit('players-list', playersList);

    // Broadcast new player to others
    socket.broadcast.emit('player-joined', { ...data, id: socket.id });
    console.log(`${data.name} joined. Online: ${players.size}`);
  });

  // Player movement
  socket.on('player-move', (data: { position: { x: number; y: number }; direction: number }) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.direction = data.direction;
      socket.broadcast.emit('player-moved', {
        id: socket.id,
        position: data.position,
        direction: data.direction,
      });
    }
  });

  // Player stats update
  socket.on('player-stats', (data: { health: number; maxHealth: number; level: number }) => {
    const player = players.get(socket.id);
    if (player) {
      player.health = data.health;
      player.maxHealth = data.maxHealth;
      player.level = data.level;
      socket.broadcast.emit('player-stats-update', {
        id: socket.id,
        ...data,
      });
    }
  });

  // Chat message
  socket.on('chat-message', (data: { sender: string; content: string; color?: string }) => {
    io.emit('chat-message', {
      id: `msg_${Date.now()}`,
      type: 'player',
      sender: data.sender,
      content: data.content,
      timestamp: Date.now(),
      color: data.color || '#ffffff',
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      players.delete(socket.id);
      socket.broadcast.emit('player-left', { id: socket.id });
      console.log(`${player.name} left. Online: ${players.size}`);
    }
  });

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error);
  });
});

const PORT = 3004;
httpServer.listen(PORT, () => {
  console.log(`Tibia Game Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down game server...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Shutting down game server...');
  httpServer.close(() => process.exit(0));
});