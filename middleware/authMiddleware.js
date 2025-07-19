const jwt = require('jsonwebtoken');
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) return res.redirect('/login');
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      next();
    } catch (err) {
      res.status(401).send("Unauthorized");
    }
  };

exports.adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.send("Access denied: Admins only");
    }
    next();
};