const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true // tech, cultural, sports
    },

    date: {
      type: Date,
      required: true
    },

    venue: {
      type: String,
      required: true
    },

    capacity: {
      type: Number,
      required: true
    },

    registeredCount: {
      type: Number,
      default: 0
    },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
