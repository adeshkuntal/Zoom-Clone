const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Load environment variables
dotenv.config();
connectDB();

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Routes
app.use(authRoutes);

// Redirect root to /register
app.get("/", (req, res) => {
  res.redirect("/register");
});

// Socket.IO logic for WebRTC and room joining
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", ({ roomId, username }) => {
    console.log(`User ${socket.id} (${username}) joined room ${roomId}`);
    socket.join(roomId);
    socket.username = username || `User-${socket.id.substring(0, 5)}`;

    // Notify existing users in room
    socket.to(roomId).emit("user-joined", { 
      id: socket.id,
      username: socket.username
    });

    // Get current participants count
    const room = io.sockets.adapter.rooms.get(roomId);
    const participantCount = room ? room.size : 0;
    console.log(`Room ${roomId} now has ${participantCount} participants`);

    // WebRTC signaling events scoped to this room
    socket.on("offer", (data) => {
      socket.to(data.to).emit("offer", {
        offer: data.offer,
        from: socket.id,
        username: socket.username
      });
    });

    socket.on("answer", (data) => {
      socket.to(data.to).emit("answer", {
        answer: data.answer,
        from: socket.id,
        username: socket.username
      });
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.to).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${socket.id} disconnected`);
      socket.to(roomId).emit("user-left", socket.id);
    });
  });

  // Chat messages (global to all rooms)
  socket.on("chat", ({ roomId, msg }) => {
    socket.to(roomId).emit("chat", { 
      msg,
      from: socket.id,
      username: socket.username
    });
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});