const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { authorize, ROLES } = require('../../middleware/rbac');
const { optionalAuth } = require('../../middleware/auth');

const router = express.Router();

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                userSkills: {
                    include: { skill: true, verificationRecord: true },
                    orderBy: { updatedAt: 'desc' },
                },
                reviewerProfile: true,
                recruiterAccess: true,
            },
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const { password, ...safeUser } = user;
        res.json({ success: true, data: safeUser });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/profile - Update profile
router.put('/profile', authenticate, [
    body('name').optional().trim().notEmpty(),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('headline').optional().trim().isLength({ max: 150 }),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { name, bio, headline, location, linkedinUrl, githubUrl, websiteUrl, avatar } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(bio !== undefined && { bio }),
                ...(headline !== undefined && { headline }),
                ...(location !== undefined && { location }),
                ...(linkedinUrl !== undefined && { linkedinUrl }),
                ...(githubUrl !== undefined && { githubUrl }),
                ...(websiteUrl !== undefined && { websiteUrl }),
                ...(avatar !== undefined && { avatar }),
            },
            select: {
                id: true, name: true, email: true, role: true, username: true,
                avatar: true, bio: true, headline: true, location: true,
                linkedinUrl: true, githubUrl: true, websiteUrl: true,
            },
        });
        res.json({ success: true, data: updated, message: 'Profile updated' });
    } catch (error) {
        next(error);
    }
});

// GET /api/users/passport/:username - Public skill passport
router.get('/passport/:username', optionalAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.params.username },
            select: {
                id: true, name: true, username: true, avatar: true, bio: true,
                headline: true, location: true, linkedinUrl: true, githubUrl: true,
                websiteUrl: true, createdAt: true,
                userSkills: {
                    where: { status: 'VERIFIED' },
                    include: {
                        skill: true,
                        verificationRecord: true,
                    },
                    orderBy: { credibilityScore: 'desc' },
                },
            },
        });
        if (!user) return res.status(404).json({ success: false, message: 'Profile not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// GET /api/users/:id/skill-timeline - Skill growth timeline
router.get('/:id/skill-timeline', authenticate, async (req, res, next) => {
    try {
        if (req.params.id !== req.user.id && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const skills = await prisma.userSkill.findMany({
            where: { userId: req.params.id },
            include: { skill: { select: { name: true, category: true } } },
            orderBy: { claimedAt: 'asc' },
        });
        res.json({ success: true, data: skills });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
