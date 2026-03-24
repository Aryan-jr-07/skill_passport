const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { authorize, ROLES } = require('../../middleware/rbac');

const router = express.Router();

// POST /api/projects - Submit a project for a skill
router.post('/', authenticate, authorize(ROLES.STUDENT), [
    body('skillId').notEmpty().withMessage('Skill ID required'),
    body('title').trim().notEmpty().withMessage('Project title required'),
    body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { skillId, title, description, projectLink, repoLink, demoUrl, tags } = req.body;

        // Verify skill is claimed and test passed
        const userSkill = await prisma.userSkill.findUnique({
            where: { userId_skillId: { userId: req.user.id, skillId } },
        });
        if (!userSkill) return res.status(400).json({ success: false, message: 'You must claim this skill first' });
        if (!['TEST_PASSED', 'PROJECT_SUBMITTED', 'REVIEW_PENDING'].includes(userSkill.status)) {
            return res.status(400).json({ success: false, message: 'You must pass the skill test before submitting a project' });
        }

        // Check for existing project (allow re-submission)
        const existingProject = await prisma.project.findFirst({
            where: { userId: req.user.id, skillId },
        });

        let project;
        if (existingProject) {
            project = await prisma.project.update({
                where: { id: existingProject.id },
                data: { title, description, projectLink, repoLink, demoUrl, tags: tags || [] },
            });
        } else {
            project = await prisma.project.create({
                data: { userId: req.user.id, skillId, title, description, projectLink, repoLink, demoUrl, tags: tags || [] },
            });
        }

        // Update skill status
        await prisma.userSkill.update({
            where: { id: userSkill.id },
            data: { status: 'PROJECT_SUBMITTED' },
        });

        // Auto-assign to a reviewer (in production, use smart assignment logic)
        const reviewer = await prisma.user.findFirst({
            where: { role: 'REVIEWER' },
            include: { reviewerProfile: true },
        });

        if (reviewer) {
            await prisma.review.create({
                data: { projectId: project.id, reviewerId: reviewer.id, status: 'PENDING' },
            });
            await prisma.userSkill.update({
                where: { id: userSkill.id },
                data: { status: 'REVIEW_PENDING' },
            });
        }

        res.status(201).json({
            success: true,
            data: project,
            message: reviewer
                ? 'Project submitted and assigned to a reviewer!'
                : 'Project submitted! A reviewer will be assigned soon.',
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/projects/user/my-projects
router.get('/user/my-projects', authenticate, async (req, res, next) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId: req.user.id },
            include: {
                skill: { select: { name: true, category: true } },
                reviews: { include: { reviewer: { select: { name: true, avatar: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        next(error);
    }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                skill: true,
                user: { select: { name: true, username: true, avatar: true } },
                reviews: { include: { reviewer: { select: { name: true, avatar: true } } } },
            },
        });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Only owner or reviewer can see
        if (project.userId !== req.user.id && req.user.role !== 'REVIEWER' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
