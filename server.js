const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const socketIO = require('socket.io');


dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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

  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
