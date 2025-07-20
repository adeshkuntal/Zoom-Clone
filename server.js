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

// ✅ Route to serve meeting room
app.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  res.render("room", { roomId });
});

// ✅ Socket.IO logic for WebRTC and room joining
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (roomId) => {
    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.join(roomId);

    // Notify existing users in room
    socket.to(roomId).emit("user-joined", socket.id);

    // Forward offer
    socket.on("offer", (data) => {
      socket.to(data.to).emit("offer", {
        offer: data.offer,
        from: socket.id,
      });
    });

    // Forward answer
    socket.on("answer", (data) => {
      socket.to(data.to).emit("answer", {
        answer: data.answer,
        from: socket.id,
      });
    });

    // Forward ICE candidates
    socket.on("ice-candidate", (data) => {
      socket.to(data.to).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    });

    //Handle Chat
    socket.on("chat", ({ roomId, msg }) => {
    socket.to(roomId).emit("chat", { msg });
    });


    // Handle disconnection
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-left", socket.id);
    });
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
