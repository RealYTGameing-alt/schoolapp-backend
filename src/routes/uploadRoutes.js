const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Set folder based on type
const setFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};

// Upload assignment file
router.post('/assignment',
  authenticate,
  setFolder('assignments'),
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      res.json({
        message: 'File uploaded successfully!',
        url: req.file.path,
        filename: req.file.originalname,
        size: req.file.size,
        format: req.file.format,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// Upload study material
router.post('/material',
  authenticate,
  setFolder('materials'),
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      res.json({
        message: 'Material uploaded successfully!',
        url: req.file.path,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

module.exports = router;