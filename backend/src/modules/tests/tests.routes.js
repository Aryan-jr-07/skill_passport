const express = require('express');
const prisma = require('../../config/db');
const { authenticate } = require('../../middleware/auth');
const { authorize, ROLES } = require('../../middleware/rbac');

const router = express.Router();

// GET /api/tests/skill/:skillId - Get test for a skill
router.get('/skill/:skillId', authenticate, async (req, res, next) => {
    try {
        const test = await prisma.skillTest.findFirst({
            where: { skillId: req.params.skillId },
            select: {
                id: true, skillId: true, title: true, description: true,
                difficultyLevel: true, timeLimit: true, passingScore: true,
                questions: true,
            },
        });
        if (!test) return res.status(404).json({ success: false, message: 'No test available for this skill yet' });

        // Parse questions from JSON string (SQLite stores arrays as text)
        const questions = typeof test.questions === 'string' ? JSON.parse(test.questions) : (test.questions || []);
        const shuffled = Array.isArray(questions)
            ? [...questions].sort(() => Math.random() - 0.5).slice(0, 15)
            : questions;

        res.json({ success: true, data: { ...test, questions: shuffled } });
    } catch (error) {
        next(error);
    }
});

// POST /api/tests/:testId/submit - Submit test answers
router.post('/:testId/submit', authenticate, authorize(ROLES.STUDENT), async (req, res, next) => {
    try {
        const { answers, timeTaken, skillId } = req.body;

        const test = await prisma.skillTest.findUnique({ where: { id: req.params.testId } });
        if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

        // Parse questions from JSON string
        const questions = typeof test.questions === 'string' ? JSON.parse(test.questions) : (test.questions || []);
        let correct = 0;
        const results = [];

        if (Array.isArray(questions) && Array.isArray(answers)) {
            questions.forEach((q, idx) => {
                const userAnswer = answers.find(a => a.questionId === (q.id || idx));
                const isCorrect = userAnswer && userAnswer.answer === q.correctAnswer;
                if (isCorrect) correct++;
                results.push({ questionId: q.id || idx, correct: isCorrect });
            });
        }

        const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;

        // Save attempt (answers stored as JSON string for SQLite)
        const attempt = await prisma.testAttempt.create({
            data: {
                userId: req.user.id,
                skillId: test.skillId,
                testId: test.id,
                score,
                answers: JSON.stringify(answers || []),
                timeTaken: timeTaken || 0,
            },
        });

        // Update verification record
        const userSkill = await prisma.userSkill.findUnique({
            where: { userId_skillId: { userId: req.user.id, skillId: test.skillId } },
        });

        if (userSkill) {
            await prisma.verificationRecord.update({
                where: { userSkillId: userSkill.id },
                data: { testScore: score },
            });

            if (score >= test.passingScore) {
                await prisma.userSkill.update({
                    where: { id: userSkill.id },
                    data: { status: 'TEST_PASSED' },
                });
            }
        }

        res.json({
            success: true,
            data: {
                attempt,
                score: Math.round(score),
                passed: score >= test.passingScore,
                passingScore: test.passingScore,
                results,
                message: score >= test.passingScore
                    ? `Great job! You scored ${Math.round(score)}%. Now submit a project to continue verification.`
                    : `You scored ${Math.round(score)}%. You need ${test.passingScore}% to pass. Try again!`,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/tests/user/attempts - Get user's test history
router.get('/user/attempts', authenticate, async (req, res, next) => {
    try {
        const attempts = await prisma.testAttempt.findMany({
            where: { userId: req.user.id },
            include: {
                skill: { select: { name: true, category: true } },
                test: { select: { title: true, passingScore: true } }
            },
            orderBy: { attemptDate: 'desc' },
        });
        res.json({ success: true, data: attempts });
    } catch (error) {
        next(error);
    }
});

// POST /api/tests - Create test (Super Admin)
router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res, next) => {
    try {
        const { skillId, title, description, questions, difficultyLevel, timeLimit, passingScore } = req.body;
        const test = await prisma.skillTest.create({
            data: {
                skillId, title, description,
                questions: typeof questions === 'string' ? questions : JSON.stringify(questions),
                difficultyLevel,
                timeLimit: timeLimit || 30,
                passingScore: passingScore || 70
            },
        });
        res.status(201).json({ success: true, data: test });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
