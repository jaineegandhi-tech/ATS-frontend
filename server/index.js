import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import employeesRouter from './routes/employees.js';
import candidatesRouter from './routes/candidates.js';
import interviewsRouter from './routes/interviews.js';
import leavesRouter from './routes/leaves.js';
import attendanceRouter from './routes/attendance.js';
import payrollRouter from './routes/payroll.js';
import assetsRouter from './routes/assets.js';
import jobOpeningsRouter from './routes/jobOpenings.js';
import holidaysRouter from './routes/holidays.js';
import notificationsRouter from './routes/notifications.js';

import documentsRouter from './routes/documents.js';
import approvalsRouter from './routes/approvals.js';
import logsRouter from './routes/logs.js';
import telephonyRouter from './routes/telephony.js';
import rolesRouter from './routes/roles.js';

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL.split(',').map(u => u.trim()),
  credentials: true,
}));
app.use(express.json({ limit: `${process.env.MAX_FILE_SIZE_MB || 10}mb` }));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  app: process.env.APP_NAME || 'ATS',
  env: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
}));

// Active routes
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/job-openings', jobOpeningsRouter);
app.use('/api/holidays', holidaysRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/telephony', telephonyRouter);
app.use('/api/roles', rolesRouter);

// 404 handler for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ ATS Backend running on http://localhost:${PORT}`);
  console.log(`   CORS allowed origin: ${CLIENT_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
