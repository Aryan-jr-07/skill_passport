const express = require('express');
const prisma = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { authorize, ROLES } = require('../../middleware/rbac');

const router = express.Router();

// GET /api/recruiter/search - Search verified candidates
router.get('/search', authenticate, authorize(ROLES.RECRUITER, ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const { skill, minScore, maxScore, category, page = 1, limit = 12 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            status: 'VERIFIED',
        };
        if (skill) where.skill = { name: { contains: skill, mode: 'insensitive' } };
        if (category) where.skill = { ...where.skill, category };
        if (minScore) where.credibilityScore = { gte: parseFloat(minScore) };
        if (maxScore) where.credibilityScore = { ...where.credibilityScore, lte: parseFloat(maxScore) };

        const [userSkills, total] = await Promise.all([
            prisma.userSkill.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: {
                    user: {
                        select: {
                            id: true, name: true, username: true, avatar: true,
                            headline: true, location: true, linkedinUrl: true, githubUrl: true,
                        },
                    },
                    skill: { select: { name: true, category: true, icon: true } },
                    verificationRecord: true,
                },
                orderBy: { credibilityScore: 'desc' },
            }),
            prisma.userSkill.count({ where }),
        ]);

        // Group by user and aggregate their verified skills
        const candidateMap = {};
        userSkills.forEach(us => {
            if (!candidateMap[us.userId]) {
                candidateMap[us.userId] = { ...us.user, verifiedSkills: [] };
            }
            candidateMap[us.userId].verifiedSkills.push({
                skill: us.skill,
                credibilityScore: us.credibilityScore,
                verifiedAt: us.verifiedAt,
                verificationRecord: us.verificationRecord,
            });
        });

        const candidates = Object.values(candidateMap);
        res.json({ success: true, data: { candidates, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        next(error);
    }
});

// GET /api/recruiter/candidate/:username - View full candidate passport
router.get('/candidate/:username', authenticate, authorize(ROLES.RECRUITER, ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { username: req.params.username },
            select: {
                id: true, name: true, username: true, avatar: true, bio: true,
                headline: true, location: true, linkedinUrl: true, githubUrl: true, websiteUrl: true,
                createdAt: true,
                userSkills: {
                    where: { status: 'VERIFIED' },
                    include: {
                        skill: true,
                        verificationRecord: true,
                    },
                },
            },
        });
        if (!user) return res.status(404).json({ success: false, message: 'Candidate not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// POST /api/recruiter/compare - Compare multiple candidates
router.post('/compare', authenticate, authorize(ROLES.RECRUITER, ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const { usernames } = req.body;
        if (!Array.isArray(usernames) || usernames.length < 2 || usernames.length > 4) {
            return res.status(400).json({ success: false, message: 'Provide 2-4 usernames to compare' });
        }

        const candidates = await Promise.all(
            usernames.map(username =>
                prisma.user.findUnique({
                    where: { username },
                    select: {
                        id: true, name: true, username: true, avatar: true, headline: true, location: true,
                        userSkills: {
                            where: { status: 'VERIFIED' },
                            include: { skill: { select: { name: true, category: true } }, verificationRecord: true },
                        },
                    },
                })
            )
        );

        res.json({ success: true, data: candidates.filter(Boolean) });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
