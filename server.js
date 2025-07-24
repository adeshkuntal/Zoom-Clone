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


// ✅✅ FIXED Socket.IO handling
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("join-room", (roomId, userId) => {
    console.log(`📥 ${userId} joined room ${roomId}`);
    socket.join(roomId);

    // Notify others in the room
    socket.to(roomId).emit("user-connected", userId);

    // Offer relay
    socket.on("offer", ({ offer, to }) => {
      socket.to(to).emit("offer", { offer, from: socket.id });
    });

    // Answer relay
    socket.on("answer", ({ answer, to }) => {
      socket.to(to).emit("answer", { answer, from: socket.id });
    });

    // ICE candidate relay
    socket.on("ice-candidate", ({ candidate, to }) => {
      socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    // Chat relay
    socket.on("chat", ({ roomId, msg }) => {
      socket.to(roomId).emit("chat", { msg });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ ${userId} left`);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
