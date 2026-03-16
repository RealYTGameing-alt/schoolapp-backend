const progressRoutes = require('./src/routes/progressRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const lessonPlanRoutes = require('./src/routes/lessonPlanRoutes');
const timetableRoutes = require('./src/routes/timetableRoutes');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const reportsRoutes = require('./src/routes/reportsRoutes');
const examRoutes = require('./src/routes/examRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const materialsRoutes = require('./src/routes/materialsRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
require('dotenv').config();

const initializeDatabase = require('./src/config/initDB');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const submissionRoutes = require('./src/routes/submissionRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const plagiarismRoutes = require('./src/routes/plagiarismRoutes');
const userRoutes = require('./src/routes/userRoutes');


const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://schoolapp-frontend-mu.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/users', userRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/lesson-plans', lessonPlanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🏫 SchoolApp API is running!' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

module.exports = app;