const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const socketIO = require('socket.io');
const { OpenAI } = require("openai");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Attach io to app for routes
app.set('io', io);

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);

// Serve HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'dashboard.html')));
app.get('/book.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'book.html')));
app.get('/profile.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'profile.html')));

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('User connected');

  // Appointment events
  socket.on('appointment:booked', () => io.emit('appointment:booked'));
  socket.on('appointment:cancelled', () => io.emit('appointment:cancelled'));
  socket.on('appointment:rescheduled', () => io.emit('appointment:rescheduled'));

  // AI Chat logic
  socket.on('chatMessage', async (msg) => {
    io.emit('chatMessage', { sender: 'patient', text: msg.text });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful and polite hospital receptionist. Respond briefly and professionally." },
          { role: "user", content: msg.text }
        ]
      });

      const reply = completion.choices[0].message.content;
      io.emit('chatMessage', { sender: 'admin', text: reply });
    } catch (err) {
      console.error("OpenAI error:", err.message);
      io.emit('chatMessage', {
        sender: 'admin',
        text: "Sorry, I'm currently unable to respond. Please try again later."
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
