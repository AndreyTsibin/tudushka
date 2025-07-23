const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/profile', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Get user profile endpoint'
  });
});

router.put('/profile', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Update user profile endpoint'
  });
});

router.get('/usage', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Get usage stats endpoint'
  });
});

module.exports = router;