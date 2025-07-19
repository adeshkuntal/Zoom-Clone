const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");


dotenv.config();
connectDB();

// Express app
const app = express();
const server = http.createServer(app); 
const io = new Server(server); // initialize socket.io


// Middleware and settings
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // serve static files like /socket.io/socket.io.js
app.use(cookieParser());
app.use(authRoutes);

app.get('/', (req, res) => {
    res.redirect('/register');
});


// Socket.io handlers
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);

    socket.on("offer", (data) => {
      socket.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
    });

    socket.on("answer", (data) => {
      socket.to(data.to).emit("answer", { answer: data.answer });
    });

    socket.on("ice-candidate", (data) => {
      socket.to(data.to).emit("ice-candidate", { candidate: data.candidate });
    });
  });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

