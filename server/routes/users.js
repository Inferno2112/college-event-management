const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * GET MY PROFILE (Student)
 * GET /api/users/me
 */
router.get(
  "/me",
  auth,
  authorizeRoles("student"),
  async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
    ...user.toObject(),
    completionYear: user.enrollYear ? user.enrollYear + 4 : null
  });
  }
);

/**
 * UPDATE INTERESTS (Student)
 * PUT /api/users/interests
 */
router.put(
  "/interests",
  auth,
  authorizeRoles("student"),
  async (req, res) => {
    const { interests } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { interests },
      { new: true }
    ).select("-password");

    res.json(user);
  }
);

router.put("/me", auth, async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    req.body,
    { new: true }
  ).select("-password");

  res.json(updatedUser);
});

module.exports = router;
