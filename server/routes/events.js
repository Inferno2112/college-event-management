const express = require("express");
const Event = require("../models/Event");
const auth = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const Registration = require("../models/Registration");
const User = require("../models/User"); 


const router = express.Router();

/**
 * CREATE EVENT (Organizer)
 * POST /api/events
 */
router.post(
    "/",
    auth,
    authorizeRoles("organizer"),
    async (req, res) => {
        try {
            const {
                title,
                description,
                category,
                date,
                venue,
                capacity,
                organizerId
            } = req.body;

            if (
                !title ||
                !description ||
                !category ||
                !date ||
                !venue ||
                capacity === undefined
            ) {
                return res.status(400).json({ message: "All fields are required" });
            }


            const event = await Event.create({
                title,
                description,
                category,
                date,
                venue,
                capacity,
                organizerId: req.user.id
            });

            res.status(201).json(event);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

/**
 * GET ALL EVENTS
 * GET /api/events
 */
router.get("/", async (req, res) => {
    try {
        const events = await Event.find().populate("organizerId", "name email");
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET AVAILABLE EVENTS (capacity left)
 * GET /api/events/available
 */
router.get("/available", async (req, res) => {
    try {
        const events = await Event.find({
            $expr: { $lt: ["$registeredCount", "$capacity"] }
        });

        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * REGISTER FOR EVENT (Student)
 * POST /api/events/:eventId/register
 */
router.post(
    "/:eventId/register",
    auth,
    authorizeRoles("student"),
    async (req, res) => {
        try {
            const { eventId } = req.params;
            const studentId = req.user.id;

            // 1️⃣ Check if event exists
            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            // 2️⃣ Check capacity
            if (event.registeredCount >= event.capacity) {
                return res.status(400).json({ message: "Event is full" });
            }

            // 3️⃣ Prevent duplicate registration
            const existingRegistration = await Registration.findOne({
                studentId,
                eventId
            });

            if (existingRegistration) {
                return res.status(400).json({
                    message: "You have already registered for this event"
                });
            }

            // 4️⃣ Create registration
            await Registration.create({
                studentId,
                eventId
            });

            // 5️⃣ Increase registered count
            event.registeredCount += 1;
            await event.save();

            res.status(201).json({
                message: "Successfully registered for event"
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * GET MY REGISTERED EVENTS (Student Dashboard)
 * GET /api/events/my-registrations
 */
router.get(
  "/my-registrations",
  auth,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;

      const registrations = await Registration.find({ studentId })
        .populate("eventId");

      const events = registrations.map(reg => reg.eventId);

      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET MY CREATED EVENTS (Organizer Dashboard)
 * GET /api/events/my-events
 */
router.get(
  "/my-events",
  auth,
  authorizeRoles("organizer"),
  async (req, res) => {
    try {
      const organizerId = req.user.id;

      const events = await Event.find({ organizerId }).sort({ createdAt: -1 });

      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET RECOMMENDED EVENTS (AI + FALLBACK)
 * GET /api/events/recommended
 */
router.get(
  "/recommended",
  auth,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;

      // 1️⃣ Get student
      const student = await User.findById(studentId);

      // 2️⃣ Already registered events
      const registrations = await Registration.find({ studentId });
      const registeredEventIds = registrations.map(r => r.eventId);

      // 3️⃣ Personalized recommendations
      let recommendedEvents = [];

      if (student.interests && student.interests.length > 0) {
        recommendedEvents = await Event.find({
          category: { $in: student.interests },
          _id: { $nin: registeredEventIds }
        }).sort({ registeredCount: -1 });
      }

      // 4️⃣ Fallback: Popular events
      if (recommendedEvents.length === 0) {
        recommendedEvents = await Event.find({
          _id: { $nin: registeredEventIds }
        })
          .sort({ registeredCount: -1 })
          .limit(5);
      }

      res.status(200).json(recommendedEvents);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);




module.exports = router;
