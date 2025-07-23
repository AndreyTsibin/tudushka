const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented later
router.post('/chat', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'AI chat endpoint'
  });
});

router.get('/chat/history', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Get chat history endpoint'
  });
});

module.exports = router;