require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
const rateLimiter = require('./backend/middleware/rateLimiter');
const { authenticateUser } = require('./backend/middleware/authMiddleware');
const { logError, getErrorLogs } = require('./backend/services/errorLogger');
const { initSeedData } = require('./backend/services/seedService');

// Express Settings
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);
app.use(authenticateUser);

// Ensure directories
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Initialize Seed Data
initSeedData();

// Automated Scheduler Service
const SchedulerService = require('./backend/SchedulerService');
const schedulerService = new SchedulerService(DATA_DIR);
schedulerService.start();

// Routes
const projectRoutes = require('./backend/routes/projectRoutes');
const scheduleRoutes = require('./backend/routes/scheduleRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const authRoutes = require('./backend/routes/authRoutes');
const roleRoutes = require('./backend/routes/roleRoutes');
const contactRoutes = require('./backend/routes/contactRoutes');
const holidayRoutes = require('./backend/routes/holidayRoutes');
const notificationRoutes = require('./backend/routes/notificationRoutes');
const documentRoutes = require('./backend/routes/documentRoutes');
const createSchedulerRouter = require('./backend/routes/schedulerRoutes');

app.use('/api/projects', projectRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/scheduler', createSchedulerRouter(schedulerService));

// Additional error log API endpoint
app.get('/api/logs/errors', (req, res) => {
  res.json({ logs: getErrorLogs() });
});

// API 404 Handler
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve Frontend Static Bundle if Built
const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST, {
    maxAge: '1y',
    setHeaders: (res, staticPath) => {
      if (staticPath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Global error handler
const errorHandler = require('./backend/middleware/errorHandler');
app.use(errorHandler);

process.on('uncaughtException', (err) => {
  logError('UNCAUGHT_EXCEPTION', err);
});
process.on('unhandledRejection', (reason) => {
  logError('UNHANDLED_REJECTION', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Report Reminder System Express Server running at http://localhost:${PORT}`);
});
