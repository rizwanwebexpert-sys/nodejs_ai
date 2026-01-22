require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require("cors");
const path = require('path');
const fs = require('fs');

const imageController = require('./controllers/imageController');

const app = express();

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS || ['http://localhost:5173', 'http://localhost:3000']; //allowed origins from env

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      callback(error);
    }
  },
  credentials: true
};

  
                                                                                                
app.use(cors(corsOptions)); 
app.use(express.static(path.join(__dirname, 'public')));
// Multer Configuration
const upload = multer({
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed');
      error.status = 400;
      cb(error);
    }
  }
});

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Main route - Dental Image Creation

app.get('/', (req, res) => {
  try {
    // Read the HTML file from views folder
    const htmlPath = path.join(__dirname, 'views', 'index.html');
    
    fs.readFile(htmlPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading HTML file from views folder:', err);
        
        // Fallback: Check if file is in root
        const rootPath = path.join(__dirname, 'index.html');
        fs.readFile(rootPath, 'utf8', (err2, data2) => {
          if (err2) {
            return res.status(500).send(`
              <html>
                <body>
                  <h1>Error Loading Page</h1>
                  <p>Could not find index.html in views folder or root.</p>
                  <p>File paths checked:</p>
                  <ul>
                    <li>${htmlPath}</li>
                    <li>${rootPath}</li>
                  </ul>
                  <p>Current directory: ${__dirname}</p>
                </body>
              </html>
            `);
          }
          
          // Found in root, send it
          res.setHeader('Content-Type', 'text/html');
          res.send(data2);
        });
        return;
      }
      
      // Inject API URL dynamically
      let html = data;
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    });
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).send('Server error');
  }
});


app.post(
  '/create-image', 
  upload.single('image'), 
  asyncHandler((req, res, next) => imageController.createImage(req, res, next))
);

// Error Handler Middleware
app.use((error, req, res, next) => {
  console.log("error",error);
  
  console.error('Error:', error);

  // CORS errors
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      error: 'CORS policy violation', 
      message: 'Origin not allowed',
      code: 'CORS_ERROR'
    });
  }

  // Multer errors
  if (error instanceof multer.MulterError) {
    const multerErrors = {
      'LIMIT_FILE_SIZE': 'File size exceeds 30MB limit',
      'LIMIT_FILE_COUNT': 'Too many files uploaded',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected file field'
    };
    
    return res.status(400).json({ 
      success: false,
      error: 'Upload failed', 
      message: multerErrors[error.code] || error.message,
      code: error.code
    });
  }

  // File filter errors
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid file type', 
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // OpenAI API errors (from imageController)
  if (error.code) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  // Generic errors
  return res.status(error.status || 500).json({ 
    success: false,
    error: 'Internal server error', 
    message: error.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    code: 'NOT_FOUND'
  });
});



module.exports = app