const express = require('express');
const Meet = require("../models/Meeting")
const Participant = require("../models/Participant")
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Create a new meet
router.post('/create', async (req, res) => {
    try {
      const { display_name, camera_enabled, mic_enabled } = req.body;
      const room_code = `meet-${uuidv4().slice(0, 6)}`;
  
      const meet = await Meet.create({ room_code, created_by: display_name });
      await Participant.create({
        display_name,
        camera_enabled,
        mic_enabled,
        MeetId: meet.id,
      });
  
      res.status(200).json({ room_code });
    } catch (err) {
      console.error('❌ Error creating meet:', err);  // <-- ADD THIS
      res.status(500).json({ error: 'Failed to create meet' });
    }
  });
  

module.exports = router;