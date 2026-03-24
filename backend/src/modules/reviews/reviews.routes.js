const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../../config/db');
const config = require('../../config/env');
const { authenticate } = require('../../middleware/auth');
const { authorize, ROLES } = require('../../middleware/rbac');

const router = express.Router();

// GET /api/reviews/assigned - Reviewer sees assigned reviews
router.get('/assigned', authenticate, authorize(ROLES.REVIEWER), async (req, res, next) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { reviewerId: req.user.id },
            include: {
                project: {
                    include: {
                        user: { select: { name: true, username: true, avatar: true } },
                        skill: { select: { name: true, category: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
});

// GET /api/reviews/:id - Get single review details
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const review = await prisma.review.findUnique({
            where: { id: req.params.id },
            include: {
                project: {
                    include: {
                        user: { select: { name: true, username: true, avatar: true } },
                        skill: true,
                    },
                },
                reviewer: { select: { name: true, avatar: true } },
            },
        });
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

        // Access control: reviewer, project owner, or admin
        const isOwner = review.project.userId === req.user.id;
        const isReviewer = review.reviewerId === req.user.id;
        const isAdmin = req.user.role === 'SUPER_ADMIN';
        if (!isOwner && !isReviewer && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({ success: true, data: review });
    } catch (error) {
        next(error);
    }
});

// POST /api/reviews/:id/submit - Reviewer submits evaluation
router.post('/:id/submit', authenticate, authorize(ROLES.REVIEWER), [
    body('qualityScore').isFloat({ min: 0, max: 100 }),
    body('complexityScore').isFloat({ min: 0, max: 100 }),
    body('originalityScore').isFloat({ min: 0, max: 100 }),
    body('implementationScore').isFloat({ min: 0, max: 100 }),
    body('status').isIn(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const review = await prisma.review.findUnique({
            where: { id: req.params.id },
            include: { project: { include: { skill: true } } },
        });

        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        if (review.reviewerId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your review' });

        const { qualityScore, complexityScore, originalityScore, implementationScore, feedback, status } = req.body;

        // Calculate overall reviewer score (weighted average)
        const overallScore = (
            qualityScore * 0.30 +
            complexityScore * 0.25 +
            originalityScore * 0.20 +
            implementationScore * 0.25
        );

        const updatedReview = await prisma.review.update({
            where: { id: req.params.id },
            data: {
                qualityScore,
                complexityScore,
                originalityScore,
                implementationScore,
                overallScore,
                feedback,
                status,
                reviewedAt: new Date(),
            },
        });

        // Update verification record with reviewer score
        const userSkill = await prisma.userSkill.findUnique({
            where: { userId_skillId: { userId: review.project.userId, skillId: review.project.skillId } },
        });

        if (userSkill) {
            const verRecord = await prisma.verificationRecord.update({
                where: { userSkillId: userSkill.id },
                data: { reviewerScore: overallScore, projectScore: review.project.complexityScore || overallScore },
            });

            // Trigger verification engine
            const { weightTest, weightProject, weightReviewer } = config.scoring;
            const finalScore =
                verRecord.testScore * (verRecord.weightTest || weightTest) +
                verRecord.projectScore * (verRecord.weightProject || weightProject) +
                verRecord.reviewerScore * (verRecord.weightReviewer || weightReviewer);

            const verifiedFlag = finalScore >= config.scoring.verificationThreshold && status === 'APPROVED';

            await prisma.verificationRecord.update({
                where: { userSkillId: userSkill.id },
                data: { finalScore, verifiedFlag },
            });

            if (verifiedFlag) {
                await prisma.userSkill.update({
                    where: { id: userSkill.id },
                    data: {
                        status: 'VERIFIED',
                        credibilityScore: Math.round(finalScore * 10) / 10,
                        verifiedAt: new Date(),
                    },
                });
            } else if (status === 'REJECTED') {
                await prisma.userSkill.update({
                    where: { id: userSkill.id },
                    data: { status: 'REJECTED' },
                });
            }
        }

        // Update reviewer stats
        await prisma.reviewerProfile.update({
            where: { userId: req.user.id },
            data: {
                totalReviews: { increment: 1 },
                ...(status === 'APPROVED' ? { approvedReviews: { increment: 1 } } : {}),
            },
        });

        res.json({ success: true, data: updatedReview, message: 'Review submitted successfully' });
    } catch (error) {
        next(error);
    }
});

// GET /api/reviews/reviewer/stats - Reviewer stats
router.get('/reviewer/stats', authenticate, authorize(ROLES.REVIEWER), async (req, res, next) => {
    try {
        const profile = await prisma.reviewerProfile.findUnique({
            where: { userId: req.user.id },
        });
        const pendingCount = await prisma.review.count({
            where: { reviewerId: req.user.id, status: 'PENDING' },
        });
        res.json({ success: true, data: { ...profile, pendingCount } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
