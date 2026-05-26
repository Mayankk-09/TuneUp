// server.js - Node/Express backend with MongoDB persistence for TuneUp

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuneup';

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
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
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
        secure: false,
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
    console.log(`[OTP] Generated verification code ${code} for ${email}`);
    
    return res.json({ message: 'OTP code sent successfully' });
  } catch (err) {
    console.error('Failed to generate or send OTP:', err);
    return res.status(500).json({ error: 'Failed to send verification code: ' + err.message });
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
      return res.status(201).json({ user: responseUser });
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
    return res.status(201).json({ user: responseUser });
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
      return res.json({ user: responseUser });
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
    return res.json({ user: responseUser });
  }
});

// 3. User Stats: Update Stats
app.post('/api/users/stats', async (req, res) => {
  const { username, streak, xp, masteredChords, unlockedBadges } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required to update stats' });
  }

  if (isDbConnected()) {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Sync metrics
      user.streak = streak !== undefined ? streak : user.streak;
      user.xp = xp !== undefined ? xp : user.xp;
      user.masteredChords = masteredChords !== undefined ? masteredChords : user.masteredChords;
      user.unlockedBadges = unlockedBadges !== undefined ? unlockedBadges : user.unlockedBadges;

      await user.save();
      console.log(`[DB] Stats synchronized for: ${username} (XP: ${user.xp}, Streak: ${user.streak})`);
      
      const responseUser = user.toObject();
      delete responseUser.password;
      return res.json({ user: responseUser });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update stats: ' + err.message });
    }
  } else {
    // In-memory fallback
    const userIndex = localUsers.findIndex(u => u.username === username);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const user = localUsers[userIndex];
    user.streak = streak !== undefined ? streak : user.streak;
    user.xp = xp !== undefined ? xp : user.xp;
    user.masteredChords = masteredChords !== undefined ? masteredChords : user.masteredChords;
    user.unlockedBadges = unlockedBadges !== undefined ? unlockedBadges : user.unlockedBadges;
    user.updatedAt = new Date();

    console.log(`[In-Memory Fallback] Stats synchronized for: ${username} (XP: ${user.xp}, Streak: ${user.streak})`);
    
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

// Start listening
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  TuneUp Backend Server running on Port ${PORT}  `);
  console.log(`  Health Check: http://localhost:${PORT}/health  `);
  console.log(`===============================================`);
});
