require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const skillsRoutes = require('./modules/skills/skills.routes');
const testsRoutes = require('./modules/tests/tests.routes');
const projectsRoutes = require('./modules/projects/projects.routes');
const reviewsRoutes = require('./modules/reviews/reviews.routes');
const recruiterRoutes = require('./modules/recruiter/recruiter.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// ─── Security & Performance ─────
app.use(helmet());
app.use(compression());

app.use(cors({
    origin: [config.clientUrl, 'https://skill-passport-4hy1.vercel.app', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3010'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased from 20 to allow local testing without hitting limits quickly
    message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api/', limiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Skill Passport API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
    });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/admin', adminRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`\n🚀 Skill Passport API running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${config.nodeEnv}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
