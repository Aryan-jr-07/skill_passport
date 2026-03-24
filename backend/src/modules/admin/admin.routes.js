const express = require('express');
const prisma = require('../../config/db');
const config = require('../../config/env');
const { authenticate } = require('../../middleware/auth');
const { authorize, ROLES } = require('../../middleware/rbac');

const router = express.Router();

// ─── SUPER ADMIN ───────────────────────────────────────────────────────────────

// GET /api/admin/dashboard - Platform-wide stats
router.get('/dashboard', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const [totalUsers, totalSkills, verifiedSkills, pendingReviews, institutions] = await Promise.all([
            prisma.user.count(),
            prisma.userSkill.count(),
            prisma.userSkill.count({ where: { status: 'VERIFIED' } }),
            prisma.review.count({ where: { status: 'PENDING' } }),
            prisma.institution.count(),
        ]);

        const roleBreakdown = await prisma.user.groupBy({
            by: ['role'],
            _count: true,
        });

        const recentVerifications = await prisma.userSkill.findMany({
            where: { status: 'VERIFIED' },
            include: {
                user: { select: { name: true, username: true, avatar: true } },
                skill: { select: { name: true, category: true } },
            },
            orderBy: { verifiedAt: 'desc' },
            take: 10,
        });

        res.json({
            success: true,
            data: {
                stats: { totalUsers, totalSkills, verifiedSkills, pendingReviews, institutions },
                roleBreakdown,
                recentVerifications,
                scoringWeights: config.scoring,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/admin/users - List all users
router.get('/users', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (role) where.role = role;
        if (search) where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit),
                select: {
                    id: true, name: true, email: true, role: true, username: true,
                    avatar: true, isVerified: true, createdAt: true,
                    _count: { select: { userSkills: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({ success: true, data: { users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        next(error);
    }
});

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const { role } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, name: true, email: true, role: true },
        });
        res.json({ success: true, data: updated, message: 'User role updated' });
    } catch (error) {
        next(error);
    }
});

// ─── COLLEGE ADMIN ─────────────────────────────────────────────────────────────

// GET /api/admin/institution/analytics - Institution analytics
router.get('/institution/analytics', authenticate, authorize(ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        // Get institution
        const institution = await prisma.institution.findFirst({
            where: { adminUserId: req.user.id },
        });

        // For college admin, we return platform-wide analytics scoped to their domain
        // In production, you'd filter by institution's registered students
        const [totalStudents, verifiedCount, topSkills] = await Promise.all([
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.userSkill.count({ where: { status: 'VERIFIED' } }),
            prisma.userSkill.groupBy({
                by: ['skillId'],
                where: { status: 'VERIFIED' },
                _count: true,
                _avg: { credibilityScore: true },
                orderBy: { _count: { skillId: 'desc' } },
                take: 10,
            }),
        ]);

        const topSkillsWithNames = await Promise.all(
            topSkills.map(async ts => {
                const skill = await prisma.skill.findUnique({ where: { id: ts.skillId }, select: { name: true, category: true } });
                return { ...ts, skill };
            })
        );

        const categoryDistribution = await prisma.userSkill.groupBy({
            by: ['skillId'],
            where: { status: 'VERIFIED' },
            _count: true,
        });

        res.json({
            success: true,
            data: {
                institution,
                stats: { totalStudents, verifiedCount, verificationRate: totalStudents ? (verifiedCount / totalStudents * 100).toFixed(1) : 0 },
                topSkills: topSkillsWithNames,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/admin/institutions - Create institution
router.post('/institutions', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const { name, adminUserId, domain } = req.body;
        const institution = await prisma.institution.create({ data: { name, adminUserId, domain } });

        // Upgrade the admin user's role
        await prisma.user.update({ where: { id: adminUserId }, data: { role: 'COLLEGE_ADMIN' } });

        res.status(201).json({ success: true, data: institution });
    } catch (error) {
        next(error);
    }
});

// GET /api/admin/skills/pending - Skills awaiting moderation
router.get('/skills/pending', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const pending = await prisma.userSkill.findMany({
            where: { status: 'REVIEW_PENDING' },
            include: {
                user: { select: { name: true, username: true } },
                skill: { select: { name: true, category: true } },
                verificationRecord: true,
            },
            orderBy: { updatedAt: 'asc' },
        });
        res.json({ success: true, data: pending });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
