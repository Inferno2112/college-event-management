const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    profilePic: {
      type: String, // image URL
      default: ""
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["student", "organizer", "admin"],
      default: "student"
    },

    rollNo: {
      type: String,
      unique: true
    },

    collegeName: {
      type: String
    },

    branch: {
      type: String
    },

    course: {
      type: String
    },

    interests: {
      type: [String],
      default: []
    },

    enrollYear: {
      type: Number
    },

    address: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
