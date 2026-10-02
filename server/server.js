const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { supabase } = require('./config/supabase');

// Load env from parent directory in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: require('path').join(__dirname, '../.env') });
} else {
  dotenv.config();
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO for dashboard push events
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Authenticated Socket.IO middleware using Supabase token
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
  if (!token) {
    socket.userId = null;
    return next();
  }

  try {
    const { data: authData, error } = await supabase.auth.getUser(token);
    if (!error && authData?.user) {
      socket.userId = authData.user.id;
    } else {
      socket.userId = null;
    }
    next();
  } catch (err) {
    console.warn(`[LIFORA Socket] Auth verification note: ${err.message}`);
    socket.userId = null;
    next();
  }
});

// Attach Socket.IO to express app
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[LIFORA Socket] Client connected: ${socket.id} (User: ${socket.userId || 'Guest'})`);

  if (socket.userId) {
    socket.join(socket.userId);
    console.log(`[LIFORA Socket] Auto-joined private room for user: ${socket.userId}`);
  }

  socket.on('join_room', (userId) => {
    if (!socket.userId) {
      console.warn(`[LIFORA Socket Security] Rejected unauthenticated join_room attempt for user: ${userId}`);
      socket.emit('socket_error', { message: 'Authentication required to join private notification room' });
      return;
    }

    if (socket.userId !== userId?.toString()) {
      console.warn(`[LIFORA Socket Security] Unauthorized access attempt: Socket user ${socket.userId} tried to join room ${userId}`);
      socket.emit('socket_error', { message: 'Unauthorized room access' });
      return;
    }

    socket.join(socket.userId);
    console.log(`[LIFORA Socket] Verified socket joined room: ${socket.userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[LIFORA Socket] Client disconnected: ${socket.id}`);
  });
});

// Connect Database & Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed ONLY in development when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED === 'true') {
      const seedDatabase = require('./seed/seedData');
      await seedDatabase();
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`
=====================================================
  🩸 LIFORA – Digital Blood Donation Emergency Network
  Server running on: http://0.0.0.0:${PORT}
  Database: Supabase PostgreSQL (${process.env.SUPABASE_URL ? 'Connected' : 'Pending Configuration'})
  Environment: ${process.env.NODE_ENV || 'development'}
  Google OAuth: Supabase Authentication Flow
=====================================================
      `);
    });
  } catch (error) {
    console.error('Failed to start LIFORA server:', error);
    process.exit(1);
  }
};

startServer();
