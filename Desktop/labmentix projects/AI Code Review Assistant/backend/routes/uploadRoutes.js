const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

router.post('/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = fs.readFileSync(req.file.path, 'utf-8');
    const ext = path.extname(req.file.originalname).toLowerCase();

    const langMap = {
      '.js': 'javascript', '.jsx': 'javascript',
      '.ts': 'typescript', '.tsx': 'typescript',
      '.py': 'python', '.java': 'java',
      '.c': 'c', '.cpp': 'cpp', '.cs': 'csharp',
      '.go': 'go', '.rb': 'ruby', '.php': 'php',
    };

    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        content,
        language: langMap[ext] || 'javascript',
        size: req.file.size,
      },
    });

    fs.unlinkSync(req.file.path);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
