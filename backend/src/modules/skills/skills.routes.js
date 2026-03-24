const express = require('express');
const { body, query, validationResult } = require('express-validator');
const prisma = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { authorize, ROLES } = require('../../middleware/rbac');

const router = express.Router();

// SQLite stores arrays as JSON strings — parse before sending to client
const parseSkill = (skill) => skill ? { ...skill, tags: typeof skill.tags === 'string' ? JSON.parse(skill.tags) : (skill.tags || []) } : skill;

// GET /api/skills - List all skills (with optional search/filter)
router.get('/', async (req, res, next) => {
    try {
        const { search, category, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (search) where.name = { contains: search, mode: 'insensitive' };
        if (category) where.category = category;

        const [skills, total] = await Promise.all([
            prisma.skill.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
            prisma.skill.count({ where }),
        ]);

        res.json({ success: true, data: { skills: skills.map(parseSkill), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        next(error);
    }
});

// GET /api/skills/categories - Get all categories
router.get('/categories', async (req, res, next) => {
    try {
        const categories = await prisma.skill.groupBy({ by: ['category'], _count: true, orderBy: { category: 'asc' } });
        res.json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
});

// GET /api/skills/:id
router.get('/:id', async (req, res, next) => {
    try {
        const skill = await prisma.skill.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { userSkills: true, skillTests: true } } },
        });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
        res.json({ success: true, data: parseSkill(skill) });
    } catch (error) {
        next(error);
    }
});

// POST /api/skills - Create skill (Super Admin only)
router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN), [
    body('name').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('description').trim().notEmpty(),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { name, category, description, icon, tags } = req.body;
        const skill = await prisma.skill.create({ data: { name, category, description, icon, tags: JSON.stringify(tags || []) } });
        res.status(201).json({ success: true, data: skill });
    } catch (error) {
        next(error);
    }
});

// POST /api/skills/:id/claim - Student claims a skill
router.post('/:id/claim', authenticate, authorize(ROLES.STUDENT), async (req, res, next) => {
    try {
        const skill = await prisma.skill.findUnique({ where: { id: req.params.id } });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

        const existing = await prisma.userSkill.findUnique({
            where: { userId_skillId: { userId: req.user.id, skillId: req.params.id } },
        });
        if (existing) return res.status(409).json({ success: false, message: 'Skill already claimed' });

        const userSkill = await prisma.userSkill.create({
            data: { userId: req.user.id, skillId: req.params.id, status: 'CLAIMED' },
            include: { skill: true },
        });

        // Create initial verification record
        await prisma.verificationRecord.create({ data: { userSkillId: userSkill.id } });

        res.status(201).json({ success: true, data: userSkill, message: 'Skill claimed! Start with the assessment test.' });
    } catch (error) {
        next(error);
    }
});

// GET /api/skills/user/my-skills - Get current user's skills
router.get('/user/my-skills', authenticate, async (req, res, next) => {
    try {
        const userSkills = await prisma.userSkill.findMany({
            where: { userId: req.user.id },
            include: {
                skill: true,
                verificationRecord: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json({ success: true, data: userSkills });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
