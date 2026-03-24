const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const prisma = require('../../config/db');
const config = require('../../config/env');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

// Helper to generate tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
    return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['STUDENT', 'REVIEWER', 'RECRUITER', 'COLLEGE_ADMIN']).withMessage('Invalid role'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, role = 'STUDENT', companyName } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate unique username from name
        const baseUsername = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        let username = baseUsername;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter++}`;
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'STUDENT',
                username,
            },
        });

        // Create role-specific records
        if (user.role === 'REVIEWER') {
            await prisma.reviewerProfile.create({
                data: { userId: user.id, expertiseDomains: [] },
            });
        }
        if (user.role === 'RECRUITER') {
            await prisma.recruiterAccess.create({
                data: { recruiterId: user.id, companyName },
            });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role, username: user.username },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

        res.json({
            success: true,
            data: {
                user: { id: user.id, name: user.name, email: user.email, role: user.role, username: user.username, avatar: user.avatar },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        // Rotate refresh token
        await prisma.refreshToken.delete({ where: { token: refreshToken } });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: decoded.userId, expiresAt } });

        res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId: req.user.id } });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, name: true, email: true, role: true, username: true,
                avatar: true, bio: true, headline: true, location: true,
                linkedinUrl: true, githubUrl: true, websiteUrl: true,
                isVerified: true, createdAt: true,
                reviewerProfile: true,
                recruiterAccess: true,
            },
        });
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
