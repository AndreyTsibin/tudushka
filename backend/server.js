require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const filesRoutes = require('./routes/files');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
    process.env.FRONTEND_URL || `http://localhost:${FRONTEND_PORT}`
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Tudushka API Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/users', usersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: {
      message: isDevelopment ? err.message : 'Internal Server Error',
      ...(isDevelopment && { stack: err.stack })
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'API endpoint not found',
      path: req.path
    }
  });
});

// Start backend server
app.listen(PORT, () => {
  console.log('=� Tudushka Backend Server started successfully!');
  console.log(`=� API Server running on http://localhost:${PORT}`);
  console.log(`< Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=� Health check: http://localhost:${PORT}/api/health`);
  console.log('� Started at:', new Date().toISOString());
});

// Simple static file server for frontend
function startFrontendServer() {
  const frontendPath = path.join(__dirname, '..', 'frontend');
  
  // Check if frontend directory exists
  if (!fs.existsSync(frontendPath)) {
    console.warn(`�  Frontend directory not found at ${frontendPath}`);
    return;
  }

  const frontendServer = http.createServer((req, res) => {
    let url = req.url;
    
    // Default to index.html for root path
    if (url === '/') {
      url = '/index.html';
    }
    
    // Remove query parameters
    url = url.split('?')[0];
    
    const filePath = path.join(frontendPath, url);
    const extname = path.extname(filePath).toLowerCase();
    
    // MIME types
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Security: Prevent directory traversal
    if (!filePath.startsWith(frontendPath)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    // Security: Block access to sensitive files
    if (url.includes('.env') || url.startsWith('/.') || url.includes('/config/')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          // For SPA routing, serve index.html for non-existent routes
          if (extname === '' || extname === '.html') {
            fs.readFile(path.join(frontendPath, 'index.html'), (err, indexContent) => {
              if (err) {
                res.writeHead(404);
                res.end('Page not found');
              } else {
                res.writeHead(200, { 
                  'Content-Type': 'text/html',
                  'Cache-Control': 'no-cache'
                });
                res.end(indexContent, 'utf-8');
              }
            });
          } else {
            res.writeHead(404);
            res.end('File not found');
          }
        } else {
          res.writeHead(500);
          res.end('Server Error: ' + error.code);
        }
      } else {
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Cache-Control': extname === '.html' ? 'no-cache' : 'public, max-age=86400'
        });
        res.end(content, 'utf-8');
      }
    });
  });

  frontendServer.listen(FRONTEND_PORT, () => {
    console.log('< Frontend Server started successfully!');
    console.log(`=� Static files serving from: ${frontendPath}`);
    console.log(`= Frontend available at: http://localhost:${FRONTEND_PORT}`);
  });

  frontendServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`L Port ${FRONTEND_PORT} is already in use for frontend server`);
    } else {
      console.error('L Frontend server error:', err.message);
    }
  });
}

// Start frontend server
startFrontendServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('=� SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('=� SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('=� Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=� Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});