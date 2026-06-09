// server.js - Node/Express backend with MongoDB persistence for TuneUp

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '.env') });

if (dotenvResult.error && !process.env.MONGODB_URI) {
  console.warn('[dotenv] Warning: Failed to load .env file:', dotenvResult.error.message);
} else if (!dotenvResult.error) {
  console.log('[dotenv] .env configuration file loaded successfully.');
}

const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || 'sk_test_mock_key_for_local'
});

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Malformed token.' });
  }
  try {
    const verified = await clerkClient.verifyToken(token, {
      clockSkewInMs: 600000 // Allow up to 10 minutes of clock skew/tolerance for local dev environment
    });
    req.user = {
      id: verified.sub
    };
    next();
  } catch (err) {
    console.error('[Clerk verifyToken Error]:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token: ' + err.message });
  }
};

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuneup';

const maskedUri = MONGODB_URI.includes('@')
  ? MONGODB_URI.replace(/:([^@/:]+)@/, ':****@')
  : MONGODB_URI;
console.log(`[Database] Attempting to connect to URI: ${maskedUri}`);

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Database!'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Backend running in local fallback database mode (In-Memory).');
  });

// In-Memory Database Fallback Storage
const localUsers = [];
const activeOtps = new Map(); // maps email -> { otp, expiresAt }

let transporterFallback = null;

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const isGmail = process.env.SMTP_HOST.toLowerCase().includes('gmail');
    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (!transporterFallback) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporterFallback = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: true,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[SMTP] Ethereal mailer initialized. Test Account: ${testAccount.user}`);
    } catch (err) {
      console.log(`[SMTP] Ethereal generation failed. Using console logger fallback.`);
      transporterFallback = {
        sendMail: async (options) => {
          console.log(`\n========================================`);
          console.log(`MOCK SMTP EMAIL SENT TO: ${options.to}`);
          console.log(`SUBJECT: ${options.subject}`);
          console.log(`BODY: ${options.text}`);
          console.log(`========================================\n`);
          return { messageId: 'mock-id' };
        }
      };
    }
  }
  return transporterFallback;
};

const isDbConnected = () => mongoose.connection.readyState === 1;

// Schema definition
const UserSchema = new mongoose.Schema({
  clerkUserId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' }, // kept for schema backward compatibility
  xp: { type: Number, default: 0 },
  break: { type: Number, default: 0 }, // database compatibility
  streak: { type: Number, default: 0 },
  masteredChords: { type: [String], default: [] },
  unlockedBadges: { type: [String], default: [] }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// ROUTES

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins expiration
    activeOtps.set(email.toLowerCase(), { otp: code, expiresAt });

    try {
      if (process.env.RESEND_API_KEY) {
        // Send via Resend HTTP API (Secure, reliable, never blocked by cloud hosts)
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'TuneUp Lab <onboarding@resend.dev>',
            to: email,
            subject: 'TuneUp Lab Verification OTP Code',
            text: `Your TuneUp Lab verification code is: ${code}\n\nIt is valid for 5 minutes. If you did not request this, please ignore this email.`
          })
        });

        if (!resendResponse.ok) {
          const resendError = await resendResponse.json();
          throw new Error(resendError.message || 'Resend API returned an error status.');
        }
        console.log(`[OTP] Sent email containing code ${code} to ${email} via Resend HTTP API`);
      } else {
        // Fallback to Nodemailer SMTP
        const transporter = await getTransporter();
        const mailOptions = {
          from: '"TuneUp Lab" <no-reply@tuneup.music>',
          to: email,
          subject: 'TuneUp Lab Verification OTP Code',
          text: `Your TuneUp Lab verification code is: ${code}\n\nIt is valid for 5 minutes. If you did not request this, please ignore this email.`
        };

        const info = await transporter.sendMail(mailOptions);
        if (nodemailer.getTestMessageUrl && info.messageId !== 'mock-id') {
          console.log(`[SMTP Preview Link] View sent email at: ${nodemailer.getTestMessageUrl(info)}`);
        }
        console.log(`[OTP] Sent email containing code ${code} to ${email} via SMTP`);
      }
    } catch (mailErr) {
      console.error(`[SMTP Warning] Failed to send email to ${email}:`, mailErr.message);
      console.log(`\n==================================================`);
      console.log(`[OTP FALLBACK] VERIFICATION CODE FOR ${email}: ${code}`);
      console.log(`==================================================\n`);
    }

    console.log(`[OTP] Generated verification code ${code} for ${email}`);
    return res.json({ message: 'OTP code generated successfully. Check your inbox (or server logs).' });
  } catch (err) {
    console.error('Failed to generate OTP:', err);
    return res.status(500).json({ error: 'Failed to generate verification code: ' + err.message });
  }
});

// 1. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, otp, avatarId } = req.body;
  
  if (!username || !email || !otp) {
    return res.status(400).json({ error: 'Username, email, and verification OTP are required' });
  }

  // Verify OTP
  const record = activeOtps.get(email.toLowerCase());
  if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired verification code!' });
  }
  activeOtps.delete(email.toLowerCase());

  if (isDbConnected()) {
    try {
      const existingUser = await User.findOne({ 
        $or: [
          { username: { $regex: new RegExp(`^${username}$`, 'i') } },
          { email: email.toLowerCase() }
        ]
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already registered' });
      }

      const newUser = new User({
        username,
        email: email.toLowerCase(),
        password: '', // passwordless
        xp: 0,
        streak: 0,
        masteredChords: [],
        unlockedBadges: [avatarId || 'mic']
      });

      await newUser.save();
      console.log(`[DB] New user registered via OTP: ${username}`);
      
      const responseUser = newUser.toObject();
      delete responseUser.password;
      
      const token = jwt.sign(
        { id: newUser._id, email: newUser.email, username: newUser.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(201).json({ user: responseUser, token });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to register user: ' + err.message });
    }
  } else {
    // In-memory fallback
    const exists = localUsers.some(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: 'Username or email already registered' });
    }

    const newUser = {
      username,
      email: email.toLowerCase(),
      password: '',
      xp: 0,
      streak: 0,
      masteredChords: [],
      unlockedBadges: [avatarId || 'mic'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    localUsers.push(newUser);
    console.log(`[In-Memory Fallback] New user registered via OTP: ${username}`);
    
    const responseUser = { ...newUser };
    delete responseUser.password;
    
    const token = jwt.sign(
      { id: newUser.email, email: newUser.email, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(201).json({ user: responseUser, token });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification OTP are required' });
  }

  // Verify OTP
  const record = activeOtps.get(email.toLowerCase());
  if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired verification code!' });
  }
  activeOtps.delete(email.toLowerCase());

  if (isDbConnected()) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ error: 'No account registered with this email. Please register first!' });
      }

      console.log(`[DB] User logged in via OTP: ${user.username}`);
      const responseUser = user.toObject();
      delete responseUser.password;
      
      const token = jwt.sign(
        { id: user._id, email: user.email, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.json({ user: responseUser, token });
    } catch (err) {
      return res.status(500).json({ error: 'Database search failed: ' + err.message });
    }
  } else {
    // In-memory fallback
    const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(400).json({ error: 'No account registered with this email. Please register first!' });
    }

    console.log(`[In-Memory Fallback] User logged in via OTP: ${user.username}`);
    const responseUser = { ...user };
    delete responseUser.password;
    
    const token = jwt.sign(
      { id: user.email, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.json({ user: responseUser, token });
  }
});

// 3. User Stats: Update / Sync Stats (with JIT Clerk Account Sync)
app.post('/api/users/stats', verifyToken, async (req, res) => {
  const { streak, xp, masteredChords, unlockedBadges, avatarId } = req.body;
  const clerkUserId = req.user.id;

  if (isDbConnected()) {
    try {
      let user = await User.findOne({ clerkUserId });
      
      if (!user) {
        // Just-in-Time (JIT) profile sync from Clerk
        try {
          console.log(`[Clerk JIT] Creating new database user for clerkUserId: ${clerkUserId}`);
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const username = clerkUser.username || email.split('@')[0] || `user_${clerkUserId.substring(5, 10)}`;

          // Check if there is an existing user with this email but no clerkUserId (legacy match)
          user = await User.findOne({ email: email.toLowerCase() });
          
          if (user) {
            user.clerkUserId = clerkUserId;
            console.log(`[Clerk JIT] Linked legacy user ${username} to clerkUserId: ${clerkUserId}`);
          } else {
            user = new User({
              clerkUserId,
              username,
              email: email.toLowerCase(),
              xp: xp || 0,
              streak: streak || 0,
              masteredChords: masteredChords || [],
              unlockedBadges: unlockedBadges || [avatarId || 'mic']
            });
            console.log(`[Clerk JIT] Created new database profile for user: ${username}`);
          }
          await user.save();
        } catch (clerkErr) {
          console.error('[Clerk API Error]: Failed to fetch user profile:', clerkErr.message);
          return res.status(500).json({ error: 'Failed to create user profile: ' + clerkErr.message });
        }
      } else {
        // Sync metrics for existing user
        user.streak = streak !== undefined ? streak : user.streak;
        user.xp = xp !== undefined ? xp : user.xp;
        user.masteredChords = masteredChords !== undefined ? masteredChords : user.masteredChords;
        user.unlockedBadges = unlockedBadges !== undefined ? unlockedBadges : user.unlockedBadges;
        await user.save();
      }

      console.log(`[DB] Stats synchronized for Clerk User: ${user.username} (XP: ${user.xp}, Streak: ${user.streak})`);
      const responseUser = user.toObject();
      delete responseUser.password;
      return res.json({ user: responseUser });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update stats: ' + err.message });
    }
  } else {
    // In-memory fallback
    let userIndex = localUsers.findIndex(u => u.clerkUserId === clerkUserId);
    
    if (userIndex === -1) {
      console.log(`[In-Memory JIT] Creating new user fallback for clerkUserId: ${clerkUserId}`);
      // Try to fetch details
      let email = `clerk_${clerkUserId.substring(5, 10)}@mock.com`;
      let username = `user_${clerkUserId.substring(5, 10)}`;
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        email = clerkUser.emailAddresses[0]?.emailAddress;
        username = clerkUser.username || email.split('@')[0];
      } catch (e) {
        // fallback to mock if clerk Client fails
      }

      const newUser = {
        clerkUserId,
        username,
        email: email.toLowerCase(),
        password: '',
        xp: xp || 0,
        streak: streak || 0,
        masteredChords: masteredChords || [],
        unlockedBadges: unlockedBadges || [avatarId || 'mic'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      localUsers.push(newUser);
      userIndex = localUsers.length - 1;
    } else {
      const user = localUsers[userIndex];
      user.streak = streak !== undefined ? streak : user.streak;
      user.xp = xp !== undefined ? xp : user.xp;
      user.masteredChords = masteredChords !== undefined ? masteredChords : user.masteredChords;
      user.unlockedBadges = unlockedBadges !== undefined ? unlockedBadges : user.unlockedBadges;
      user.updatedAt = new Date();
    }

    const user = localUsers[userIndex];
    console.log(`[In-Memory Fallback] Stats synchronized for: ${user.username} (XP: ${user.xp}, Streak: ${user.streak})`);
    const responseUser = { ...user };
    delete responseUser.password;
    return res.json({ user: responseUser });
  }
});

// 4. Leaderboard: Get Top 10 players
app.get('/api/users/leaderboard', async (req, res) => {
  if (isDbConnected()) {
    try {
      const topPlayers = await User.find({})
        .sort({ xp: -1 })
        .limit(10)
        .select('username unlockedBadges xp streak');
        
      return res.json(topPlayers);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load leaderboard: ' + err.message });
    }
  } else {
    // In-memory fallback: return sorted memory users, or load mock bots if empty
    const sorted = [...localUsers]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10)
      .map(u => ({
        username: u.username,
        unlockedBadges: u.unlockedBadges,
        xp: u.xp,
        streak: u.streak
      }));

    if (sorted.length === 0) {
      const mockBots = [
        { username: 'Synth Cat 🐱', unlockedBadges: ['vinyl_record'], xp: 1200, streak: 12 },
        { username: 'Dr. Saxophone 🎷', unlockedBadges: ['sax'], xp: 850, streak: 7 },
        { username: 'Duolingo Rockstar Owl 🦉', unlockedBadges: ['electric_guitar'], xp: 1550, streak: 21 },
        { username: 'Folk Maestro 🤠', unlockedBadges: ['acoustic_guitar'], xp: 450, streak: 3 }
      ].sort((a, b) => b.xp - a.xp);
      return res.json(mockBots);
    }

    return res.json(sorted);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Real-Time Matchmaking Helpers
const CHORD_FORMULAS_MIN = [
  { name: 'maj', displayName: 'Major', intervals: [0, 4, 7] },
  { name: 'min', displayName: 'Minor', intervals: [0, 3, 7] },
  { name: 'dim', displayName: 'Diminished', intervals: [0, 3, 6] },
  { name: 'aug', displayName: 'Augmented', intervals: [0, 4, 8] },
  { name: 'maj7', displayName: 'Major 7th', intervals: [0, 4, 7, 11] },
  { name: 'dom7', displayName: 'Dominant 7th', intervals: [0, 4, 7, 10] }
];

const ROOT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_SCALE_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNotesForFormula(root, intervals) {
  const isFlat = root.includes('b') || root === 'F';
  const scale = isFlat ? CHROMATIC_SCALE_FLATS : CHROMATIC_SCALE;
  let rootIdx = scale.indexOf(root);
  if (rootIdx === -1) rootIdx = CHROMATIC_SCALE_FLATS.indexOf(root);
  if (rootIdx === -1) rootIdx = 0;

  return intervals.map(interval => scale[(rootIdx + interval) % 12]);
}

function generateQuestionsList(count = 10) {
  const list = [];
  const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  for (let i = 0; i < count; i++) {
    const isChord = Math.random() > 0.5;
    const root = roots[Math.floor(Math.random() * roots.length)];
    
    if (isChord) {
      const formula = CHORD_FORMULAS_MIN[Math.floor(Math.random() * CHORD_FORMULAS_MIN.length)];
      const notes = getNotesForFormula(root, formula.intervals);
      const correctAnswer = notes.join(' - ');
      
      const options = [correctAnswer];
      while (options.length < 4) {
        const rRoot = roots[Math.floor(Math.random() * roots.length)];
        const rFormula = CHORD_FORMULAS_MIN[Math.floor(Math.random() * CHORD_FORMULAS_MIN.length)];
        const rNotes = getNotesForFormula(rRoot, rFormula.intervals).join(' - ');
        if (!options.includes(rNotes)) {
          options.push(rNotes);
        }
      }
      options.sort(() => Math.random() - 0.5);

      list.push({
        prompt: `Spell the root notes of: ${root} ${formula.displayName}`,
        correctAnswer,
        options
      });
    } else {
      const degrees = [
        { d: 1, name: '2nd' },
        { d: 2, name: '3rd' },
        { d: 4, name: '5th' }
      ];
      const selectedDegree = degrees[Math.floor(Math.random() * degrees.length)];
      const intervals = [0, 2, 4, 5, 7, 9, 11]; // Major scale
      const notes = getNotesForFormula(root, intervals);
      const correctAnswer = notes[selectedDegree.d];
      
      const options = [correctAnswer];
      while (options.length < 4) {
        const rNote = ROOT_NOTES[Math.floor(Math.random() * ROOT_NOTES.length)];
        if (!options.includes(rNote)) {
          options.push(rNote);
        }
      }
      options.sort(() => Math.random() - 0.5);

      list.push({
        prompt: `Identify note degree ${selectedDegree.name} of scale: ${root} Major Scale`,
        correctAnswer,
        options
      });
    }
  }
  return list;
}

// Socket.io matchmaking states
let matchmakingQueue = [];
const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] New connection established: ${socket.id}`);

  socket.on('join_queue', ({ username, avatarId }) => {
    // Prevent duplicate entries
    matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
    
    matchmakingQueue.push({
      socketId: socket.id,
      username,
      avatarId: avatarId || 'mic'
    });
    
    console.log(`[Queue] Player ${username} joined PvP queue. Queue Size: ${matchmakingQueue.length}`);
    
    if (matchmakingQueue.length >= 2) {
      const player1 = matchmakingQueue.shift();
      const player2 = matchmakingQueue.shift();
      
      const roomId = `room_${player1.socketId}_${player2.socketId}`;
      const questions = generateQuestionsList(12); // Generate 12 rounds
      
      const roomState = {
        roomId,
        players: [
          { socketId: player1.socketId, username: player1.username, avatarId: player1.avatarId, hp: 100 },
          { socketId: player2.socketId, username: player2.username, avatarId: player2.avatarId, hp: 100 }
        ],
        questions,
        currentQuestionIndex: 0
      };
      
      activeRooms.set(roomId, roomState);
      
      const s1 = io.sockets.sockets.get(player1.socketId);
      const s2 = io.sockets.sockets.get(player2.socketId);
      
      if (s1) s1.join(roomId);
      if (s2) s2.join(roomId);
      
      io.to(roomId).emit('match_found', {
        roomId,
        players: roomState.players,
        question: questions[0],
        totalQuestions: questions.length
      });
      
      console.log(`[Matchmaking] Room ${roomId} created for ${player1.username} vs ${player2.username}`);
    }
  });

  socket.on('submit_answer', ({ roomId, option }) => {
    const roomState = activeRooms.get(roomId);
    if (!roomState) return;

    const currentQuestion = roomState.questions[roomState.currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = option === currentQuestion.correctAnswer;
    const player = roomState.players.find(p => p.socketId === socket.id);
    const opponent = roomState.players.find(p => p.socketId !== socket.id);
    
    if (!player || !opponent) return;

    if (isCorrect) {
      const damage = 20;
      opponent.hp = Math.max(0, opponent.hp - damage);
      
      if (opponent.hp <= 0) {
        io.to(roomId).emit('battle_update', {
          players: roomState.players,
          actionLog: `⚔️ Correct! ${player.username} strike ${opponent.username} for ${damage} DMG and won!`,
          isOver: true,
          winnerSocketId: player.socketId
        });
        activeRooms.delete(roomId);
      } else {
        roomState.currentQuestionIndex += 1;
        const nextQuestion = roomState.questions[roomState.currentQuestionIndex];
        
        io.to(roomId).emit('battle_update', {
          players: roomState.players,
          actionLog: `⚔️ Correct! ${player.username} strike ${opponent.username} for ${damage} DMG!`,
          question: nextQuestion || null,
          currentQuestionIndex: roomState.currentQuestionIndex,
          isOver: !nextQuestion
        });
      }
    } else {
      const counterDmg = 15;
      player.hp = Math.max(0, player.hp - counterDmg);

      if (player.hp <= 0) {
        io.to(roomId).emit('battle_update', {
          players: roomState.players,
          actionLog: `💥 Wrong! ${player.username} took counter ${counterDmg} DMG and lost!`,
          isOver: true,
          winnerSocketId: opponent.socketId
        });
        activeRooms.delete(roomId);
      } else {
        roomState.currentQuestionIndex += 1;
        const nextQuestion = roomState.questions[roomState.currentQuestionIndex];

        io.to(roomId).emit('battle_update', {
          players: roomState.players,
          actionLog: `💥 Wrong! ${player.username} took counter ${counterDmg} DMG!`,
          question: nextQuestion || null,
          currentQuestionIndex: roomState.currentQuestionIndex,
          isOver: !nextQuestion
        });
      }
    }
  });

  socket.on('leave_lobby', () => {
    matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
    console.log(`[Queue] Player left. Queue size: ${matchmakingQueue.length}`);
  });

  socket.on('disconnect', () => {
    matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
    
    for (const [roomId, roomState] of activeRooms.entries()) {
      const isPlayerInRoom = roomState.players.some(p => p.socketId === socket.id);
      if (isPlayerInRoom) {
        const winner = roomState.players.find(p => p.socketId !== socket.id);
        
        io.to(roomId).emit('opponent_disconnected', {
          roomId,
          message: 'Your opponent disconnected from the duel. You win by forfeit! 🏆',
          winnerSocketId: winner ? winner.socketId : null
        });
        
        activeRooms.delete(roomId);
        console.log(`[Game] Room ${roomId} terminated due to player disconnect.`);
      }
    }
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  TuneUp Backend Server running on Port ${PORT}  `);
  console.log(`  Health Check: http://localhost:${PORT}/health  `);
  console.log(`===============================================`);
});
