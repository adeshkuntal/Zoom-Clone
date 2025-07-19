const express = require("express");
const router = express.Router();
const {
  renderLogin,
  renderRegister,
  register,
  login,
  adminPage,
  userPage,
  renderMeeting,
  renderJoin,
  joinMeeting
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/login", renderLogin);
router.get("/register", renderRegister);
router.post("/register", register);
router.post("/login", login);
router.get("/admin", protect, adminOnly, adminPage);
router.get("/user", protect, userPage);
router.get("/startMeeting/:roomId", protect, renderMeeting);
router.get('/join', renderJoin);
router.post('/joinMeeting', joinMeeting)

module.exports = router;

