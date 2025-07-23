const express = require('express');
const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Get tasks endpoint'
  });
});

router.post('/', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Create task endpoint'
  });
});

router.put('/:id', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Update task endpoint'
  });
});

router.delete('/:id', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Delete task endpoint'
  });
});

router.put('/:id/complete', (req, res) => {
  res.status(501).json({ 
    error: 'Not implemented',
    message: 'Complete task endpoint'
  });
});

module.exports = router;