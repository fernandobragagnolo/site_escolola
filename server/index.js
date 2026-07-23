const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { createTransport } = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_PATH = path.join(__dirname, 'data.json');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, process.env.SERVICE_ACCOUNT_PATH || 'fernando-503004-faf5c3b16a95.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

function safeReadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // ensure shape
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
      authTokens: Array.isArray(parsed.authTokens) ? parsed.authTokens : []
    };
  } catch (error) {
    return { users: [], appointments: [], authTokens: [] };
  }
}

function safeWriteData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getTransport() {
  if (!process.env.EMAIL_SMTP_HOST) return null;
  return createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT || 587),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS
    }
  });
}

app.post('/api/auth/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const data = safeReadData();
  let user = data.users.find((u) => u.email === email);
  if (!user) {
    user = { id: uuidv4(), email, createdAt: Date.now() };
    data.users.push(user);
    safeWriteData(data);
  }

  // Simply acknowledge and return the user; no code generated or sent.
  return res.json({ success: true, user });
});

app.post('/api/auth/verify-token', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  const data = safeReadData();
  let user = data.users.find((item) => item.email === email);
  if (!user) {
    user = { id: uuidv4(), email, createdAt: Date.now() };
    data.users.push(user);
    safeWriteData(data);
  }

  return res.json({ success: true, user });
});

app.post('/api/appointments', (req, res) => {
  const { userId, studentEmail, date, time, subject, professorEmail } = req.body;
  if (!userId || !studentEmail || !date || !time || !subject) {
    return res.status(400).json({ success: false, message: 'Missing required appointment data' });
  }

  const data = safeReadData();
  const appointment = {
    id: uuidv4(),
    userId,
    studentEmail,
    date,
    time,
    subject,
    professorEmail: professorEmail || null,
    status: 'confirmed',
    createdAt: Date.now(),
    meetLink: `https://meet.google.com/${uuidv4().slice(0, 3)}-${uuidv4().slice(0, 4)}-${uuidv4().slice(0, 3)}`
  };

  data.appointments.push(appointment);
  safeWriteData(data);

  return res.json({ success: true, appointment });
});

app.get('/api/appointments', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
  const data = safeReadData();
  const appointments = data.appointments.filter((item) => item.userId === userId);
  return res.json({ success: true, appointments });
});

app.get('/api/horarios-disponiveis', (req, res) => {
  const date = req.query.data;
  const fallback = ['08:00', '09:00', '11:00', '14:00', '16:00'];
  return res.json({ success: true, availableTimes: fallback });
});

app.get('/auth/verify', (req, res) => {
  const { token } = req.query;
  return res.send(`Email verification token received. Use the app to verify token: ${token}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
