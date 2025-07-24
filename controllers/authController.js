const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.renderLogin = (req, res) => res.render("login");
exports.renderRegister = (req, res) => res.render("register");

exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hash, role });
  await user.save();
  res.redirect("/login");
};

 
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) alert("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Invalid credentials");

  const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET);
  res.cookie("token", token);
  res.redirect(user.role === "admin" ? "/admin" : "/user");
};


exports.adminPage = (req, res) => res.render("admin", { username: req.user.username });
exports.userPage = (req, res) => {
  res.render("user", {
    username: req.user.username
  });
};


exports.renderMeeting = (req, res) => {
  let username = "Guest";
  if (req.user && req.user.username) {
    username = req.user.username;
  } else if (req.cookies.username) {
    username = req.cookies.username;
  }
  const roomId = req.params.roomId;
  if (!roomId) {
    return res.redirect("/joinMeeting"); // Safe fallback if roomId is missing
  }
  if (!username || username.trim() === "") {
    return res.redirect("/joinMeeting"); // Force re-enter username
  }
  res.render("meeting", { username, roomId });
};



exports.renderJoin = (req,res) => {
  res.render('join');
}

exports.joinMeeting = (req,res) => {
  const { username, roomId } = req.body;
  res.cookie("username", username);
  res.redirect(`/startMeeting/${roomId}`);
}








