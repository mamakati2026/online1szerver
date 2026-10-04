const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));

// ============================================
// GAME STATE
// ============================================
const gameState = {
  players: {},      // { playerId: { id, name, position, rotation, speed, lap, checkpoint, isAI, isAutoPilot } }
  aiCars: {},       // { aiId: { id, name, position, rotation, speed, lap, checkpoint } }
  gameRooms: {},    // { roomId: { players: [], checkpoints: [...] } }
  chatMessages: []
};

// Checkpoints (pálya)
const CHECKPOINTS = [
  [0, 0, 300],
  [0, 0, 150],
  [0, 0, 0],
  [0, 0, -150],
  [0, 0, -300]
];

const MAX_SPEED = 200;
const FRICTION = 0.96;

// ============================================
// AI AUTÓK
// ============================================
class AIDriver {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.position = [Math.random() * 20 - 10, 1, -100 - Math.random() * 50];
    this.rotation = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.maxSpeed = 160;
    this.lap = 0;
    this.checkpoint = 0;
    this.targetSpeed = 100;
    this.isAI = true;
  }

  update() {
    // Target checkpoint
    const nextCp = CHECKPOINTS[this.checkpoint % CHECKPOINTS.length];
    
    // Distance to checkpoint
    const dx = nextCp[0] - this.position[0];
    const dz = nextCp[2] - this.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Speed control
    if (dist < 60) {
      this.targetSpeed = this.maxSpeed * 0.6; // Slow for turn
    } else if (dist < 100) {
      this.targetSpeed = this.maxSpeed * 0.8;
    } else {
      this.targetSpeed = this.maxSpeed;
    }

    // Smooth acceleration
    if (this.speed < this.targetSpeed) {
      this.speed += 1.5;
    } else if (this.speed > this.targetSpeed) {
      this.speed -= 0.3;
    }

    this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
    this.speed *= FRICTION;

    // Steering
    const targetAngle = Math.atan2(dx, dz);
    const angleDiff = targetAngle - this.rotation;
    
    if (Math.abs(angleDiff) > 0.1) {
      this.rotation += Math.sign(angleDiff) * 0.05;
    }

    // Movement
    this.position[0] += Math.sin(this.rotation) * this.speed * 0.016;
    this.position[2] += Math.cos(this.rotation) * this.speed * 0.016;

    // Checkpoint detection
    if (dist < 50) {
      if (this.checkpoint % CHECKPOINTS.length === (this.checkpoint % CHECKPOINTS.length)) {
        this.checkpoint++;
        if (this.checkpoint % CHECKPOINTS.length === 0) {
          this.lap++;
        }
      }
    }

    // Boundaries
    if (this.position[2] > 350) this.position[2] = -350;
    if (this.position[2] < -350) this.position[2] = 350;
    if (this.position[0] > 60) this.position[0] = 60;
    if (this.position[0] < -60) this.position[0] = -60;
  }
}

// ============================================
// SOCKET.IO EVENTS
// ============================================
io.on('connection', (socket) => {
  console.log('✅ Játékos csatlakozva:', socket.id);

  // JOIN GAME
  socket.on('join_game', (data) => {
    const playerId = socket.id;
    const playerName = data.playerName || 'Játékos_' + Math.random().toString(36).substring(7);

    // Create player
    gameState.players[playerId] = {
      id: playerId,
      name: playerName,
      position: [Math.random() * 20 - 10, 1, -100],
      rotation: 0,
      speed: 0,
      lap: 0,
      checkpoint: 0,
      isAI: false,
      isAutoPilot: false,
      socket: socket
    };

    // Send game joined
    socket.emit('game_joined', {
      playerId: playerId,
      playerName: playerName,
      checkpoints: CHECKPOINTS,
      playersCount: Object.keys(gameState.players).length
    });

    // Broadcast player joined
    io.emit('player_joined', {
      playerId: playerId,
      playerName: playerName
    });

    // Send leaderboard
    broadcastLeaderboard();

    // Send chat message
    addChatMessage('SYSTEM', `${playerName} csatlakozott a játékhoz!`);
    io.emit('chat_message', {
      playerName: 'SYSTEM',
      message: `${playerName} csatlakozott a játékhoz!`
    });

    console.log(`👤 ${playerName} csatlakozott (ID: ${playerId})`);
  });

  // PLAYER UPDATE (position, speed, lap, checkpoint)
  socket.on('player_update', (data) => {
    if (gameState.players[socket.id]) {
      const player = gameState.players[socket.id];
      
      if (data.position) player.position = data.position;
      if (data.rotation !== undefined) player.rotation = data.rotation;
      if (data.speed !== undefined) player.speed = data.speed;
      if (data.lap !== undefined) player.lap = data.lap;
      if (data.checkpoint !== undefined) player.checkpoint = data.checkpoint;

      // Broadcast update to other players
      io.emit('player_position', {
        playerId: socket.id,
        position: player.position,
        rotation: player.rotation,
        speed: player.speed,
        lap: player.lap,
        checkpoint: player.checkpoint
      });
    }
  });

  // AUTOPILOT TOGGLE
  socket.on('autopilot_toggle', (data) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].isAutoPilot = data.enabled;
      console.log(`🤖 ${gameState.players[socket.id].name} autopilot: ${data.enabled}`);
    }
  });

  // CHAT MESSAGE
  socket.on('chat_message', (data) => {
    if (gameState.players[socket.id]) {
      const playerName = gameState.players[socket.id].name;
      addChatMessage(playerName, data.message);
      
      io.emit('chat_message', {
        playerName: playerName,
        message: data.message
      });
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      const playerName = gameState.players[socket.id].name;
      delete gameState.players[socket.id];
      
      io.emit('player_left', {
        playerId: socket.id,
        playerName: playerName
      });

      addChatMessage('SYSTEM', `${playerName} kilépett a játékból!`);
      io.emit('chat_message', {
        playerName: 'SYSTEM',
        message: `${playerName} kilépett a játékból!`
      });

      broadcastLeaderboard();
      console.log(`❌ ${playerName} kilépett (ID: ${socket.id})`);
    }
  });
});

// ============================================
// AI UPDATES (every frame)
// ============================================
setInterval(() => {
  // Update AI cars
  Object.values(gameState.aiCars).forEach(ai => {
    ai.update();
  });

  // Broadcast AI positions
  io.emit('game_state', {
    playersCount: Object.keys(gameState.players).length + Object.keys(gameState.aiCars).length,
    leaderboard: getLeaderboard(),
    aiPositions: Object.values(gameState.aiCars).map(ai => ({
      id: ai.id,
      name: ai.name,
      position: ai.position,
      rotation: ai.rotation,
      speed: ai.speed,
      lap: ai.lap,
      checkpoint: ai.checkpoint,
      isAI: true
    }))
  });
}, 50); // 50ms = 20 updates/sec

// ============================================
// HELPER FUNCTIONS
// ============================================
function broadcastLeaderboard() {
  io.emit('game_state', {
    playersCount: Object.keys(gameState.players).length + Object.keys(gameState.aiCars).length,
    leaderboard: getLeaderboard()
  });
}

function getLeaderboard() {
  const leaderboard = [];

  // Add players
  Object.values(gameState.players).forEach(player => {
    leaderboard.push({
      playerId: player.id,
      name: player.name,
      lap: player.lap,
      checkpoint: player.checkpoint,
      isAI: false
    });
  });

  // Add AI
  Object.values(gameState.aiCars).forEach(ai => {
    leaderboard.push({
      playerId: ai.id,
      name: ai.name,
      lap: ai.lap,
      checkpoint: ai.checkpoint,
      isAI: true
    });
  });

  // Sort by lap DESC, then checkpoint DESC
  leaderboard.sort((a, b) => {
    if (b.lap !== a.lap) return b.lap - a.lap;
    return b.checkpoint - a.checkpoint;
  });

  return leaderboard;
}

function addChatMessage(playerName, message) {
  gameState.chatMessages.push({
    playerName: playerName,
    message: message,
    timestamp: Date.now()
  });

  // Keep last 100 messages
  if (gameState.chatMessages.length > 100) {
    gameState.chatMessages.shift();
  }
}

// ============================================
// INITIALIZE AI CARS
// ============================================
function initializeAICars() {
  const aiNames = ['🤖 AI_Racer_1', '🤖 AI_Racer_2', '🤖 AI_Racer_3'];
  
  aiNames.forEach((name, index) => {
    const ai = new AIDriver(`ai_${index}`, name);
    gameState.aiCars[ai.id] = ai;
    console.log(`🤖 AI inicializálva: ${name}`);
  });
}

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;

initializeAICars();

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🏎️  CLOUD RACING SZERVER AKTÍV  🏎️   ║
╠════════════════════════════════════════╣
║  📍 Port: ${PORT}
║  🌐 URL: http://localhost:${PORT}
║  👥 Játékosok: ${Object.keys(gameState.players).length}
║  🤖 AI Autók: 3
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✋ Szerver leállítása...');
  server.close(() => {
    console.log('🛑 Szerver leállt.');
    process.exit(0);
  });
});

module.exports = server;
