const express = require('express');
const router = express.Router();

// Curated Dynamic Warmth Generation Engine (Instant offline & supports cloud API)
const WISH_DICTIONARY = {
  executive: [
    "On behalf of our entire workspace circle, wishing you a remarkable birthday and continued distinction in all your endeavors. Your insight, dedication, and leadership elevate our collective momentum every single day.",
    "Happy Birthday! Thank you for the steady excellence, integrity, and warmth you bring to our team. May this year ahead bring you profound professional milestones, peace of mind, and well-deserved celebration.",
    "Warmest birthday wishes! Your contributions and strategic clarity are invaluable to our team's mission. Wishing you health, happiness, and extraordinary success in this upcoming chapter.",
    "Celebrating you today! Your commitment to quality and quiet strength inspire everyone around you. May this year be filled with fulfilling breakthroughs and peace of mind.",
    "Happy Birthday! It is a true privilege collaborating with someone of your caliber and dedication. Here's to celebrating your achievements and charting new horizons together."
  ],
  playful: [
    "Happy Birthday! 🎂 May your day be packed with cake, zero meeting notifications, and maximum celebration! You make work 100x more fun.",
    "Another year wiser, bolder, and even more legendary! 🚀 Wishing you an epic birthday filled with laughter, great treats, and all the good vibes.",
    "Happy Birthday to the official workplace MVP! 🎉 May your coffee be strong, your bugs be non-existent, and your celebration be legendary!",
    "It's your special day! 🥳 Time to turn off Slack notifications, eat the biggest slice of cake, and celebrate another fantastic lap around the sun!",
    "Cheers to you on your birthday! 🥂 May your day be as bright, energetic, and awesome as you make our workspace every day!"
  ],
  inspiring: [
    "Happy Birthday! Your ambition, vision, and relentless optimism shape the culture of our workplace in extraordinary ways. Keep reaching for the stars and inspiring everyone around you.",
    "Wishing you a milestone year filled with bold leaps, inspiring conquests, and unmatched personal growth. Happy Birthday to someone who constantly redefines what's possible!",
    "On your birthday, we celebrate not just the milestone, but the incredible impact and inspiration you share with our circle. May this year bring your biggest dreams into reality.",
    "Happy Birthday! May your passion continue to illuminate our collective journey, and may every ambition you nurture this year blossom into brilliance.",
    "Happy Birthday to a true visionary. Your positive energy and dedication empower our entire team to achieve greater heights together."
  ],
  zen: [
    "Wishing you peace of mind, gentle joy, and heartfelt warmth on your birthday. May your year ahead be calm, balanced, and rich with meaningful moments.",
    "Happy Birthday. May today bring you space to reflect on your journey, celebrate your uniqueness, and welcome a season of serene happiness and harmony.",
    "In the spirit of Zenitude, wishing you stillness amidst the rush, heartfelt connection with those who matter most, and a deeply fulfilling year ahead. Happy Birthday.",
    "May your special day unfold with tranquility, gratitude, and light. Thank you for bringing calm clarity and kindness into our circle. Happy Birthday.",
    "Sending you peaceful wishes for health, balance, and quiet fulfillment on your birthday. Here's to a year of mindful joy and contentment."
  ]
};

// Work Anniversary Templates
const ANNIVERSARY_DICTIONARY = {
  executive: [
    "Happy Work Anniversary! Thank you for your continued dedication, professional excellence, and commitment to our shared vision. Your contributions are deeply valued.",
    "Congratulations on your milestone anniversary with our circle! Your leadership, reliability, and expertise continue to drive our team forward."
  ],
  playful: [
    "Happy Work Anniversary! 🎉 Thanks for sticking with us, sharing the laughs, and making every project so much better! Time to celebrate!",
    "Another year of making workplace magic happen! Happy Anniversary—we are so lucky to have you in our circle!"
  ],
  inspiring: [
    "Happy Work Anniversary! Your dedication and growth continue to inspire us all. Thank you for elevating our mission every single day.",
    "Celebrating your milestone today! Your journey here has been nothing short of inspiring, and the best is yet to come."
  ],
  zen: [
    "Honoring your journey with us on this work anniversary. Thank you for the steady warmth, wisdom, and peace of mind you bring to our workplace.",
    "Happy Anniversary. Grateful for your presence, mindful dedication, and the harmony you foster in our circle every day."
  ]
};

// POST /api/ai/generate-wish
router.post('/generate-wish', async (req, res) => {
  const { name, tone = 'executive', occasion = 'birthday', role = 'Team Member' } = req.body;

  const targetTone = ['executive', 'playful', 'inspiring', 'zen'].includes(String(tone).toLowerCase())
    ? String(tone).toLowerCase()
    : 'executive';

  const celebrantName = (name || 'Colleague').trim();

  try {
    const dict = String(occasion).toLowerCase().includes('anniversary') ? ANNIVERSARY_DICTIONARY : WISH_DICTIONARY;
    const tonePool = dict[targetTone] || dict.executive;
    const randomIndex = Math.floor(Math.random() * tonePool.length);
    let baseWish = tonePool[randomIndex];

    if (!baseWish.includes(celebrantName) && celebrantName !== 'Colleague') {
      baseWish = baseWish.replace(/Happy Birthday/i, `Happy Birthday, ${celebrantName}`).replace(/Happy Work Anniversary/i, `Happy Work Anniversary, ${celebrantName}`);
    }

    res.json({
      wish: baseWish,
      tone: targetTone,
      occasion,
      source: 'zenitude-engine'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
