/**
 * Tribe Assessment API Routes
 * Endpoints for assessment, badge assignment, and profile management
 */

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import {
    tribeAssessmentService,
    ASSESSMENT_QUESTIONS,
    AssessmentAnswer,
    TribeType,
} from '../services/tribe-assessment.service';

const router = Router();

// ============================================================================
// GET /api/tribe/questions - Get assessment questions
// ============================================================================
router.get('/questions', async (_req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            data: {
                questions: ASSESSMENT_QUESTIONS,
                totalQuestions: ASSESSMENT_QUESTIONS.length,
                estimatedTime: '3-5 minutes',
            },
        });
    } catch (error) {
        logger.error('Error fetching questions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch questions' });
    }
});

// ============================================================================
// POST /api/tribe/assess - Submit assessment and get badge
// ============================================================================
router.post('/assess', async (req: Request, res: Response) => {
    try {
        const { answers } = req.body as { answers: AssessmentAnswer[] };
        const userId = (req as any).userId || req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid answers' });
        }

        // Validate all questions are answered
        const answeredQuestionIds = new Set(answers.map(a => a.questionId));
        const allQuestionIds = new Set(ASSESSMENT_QUESTIONS.map(q => q.id));

        if (answeredQuestionIds.size !== allQuestionIds.size) {
            return res.status(400).json({
                success: false,
                error: 'Please answer all questions',
                required: ASSESSMENT_QUESTIONS.length,
                provided: answers.length,
            });
        }

        const result = await tribeAssessmentService.processAssessment(userId, answers);

        res.json({
            success: true,
            data: {
                tribe: result.tribe,
                degenPercent: result.degenPercent,
                regenPercent: result.regenPercent,
                confidence: result.confidence,
                message: result.tribe === 'degen'
                    ? '🔥 Welcome to the Degen Tribe! Hunt. Strike. Dominate.'
                    : '💎 Welcome to the Regen Tribe! Build. Grow. Sustain.',
                nextReassessment: result.reassessmentDate,
                badge: {
                    type: result.tribe,
                    earnedAt: (result as any).assessmentDate || new Date(),
                    source: 'initial_assessment',
                },
            },
        });
    } catch (error) {
        logger.error('Error processing assessment:', error);
        res.status(500).json({ success: false, error: 'Failed to process assessment' });
    }
});

// ============================================================================
// GET /api/tribe/profile - Get user's tribe profile
// ============================================================================
router.get('/profile', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId || req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const profile = await tribeAssessmentService.getTribeProfile(userId);

        if (!profile) {
            return res.json({
                success: true,
                data: null,
                needsAssessment: true,
            });
        }

        const needsReassessment = await tribeAssessmentService.needsReassessment(userId);

        res.json({
            success: true,
            data: {
                tribe: profile.tribe,
                degenPercent: profile.degenPercent,
                regenPercent: profile.regenPercent,
                assessmentHistory: profile.assessmentHistory,
                behavioralMetrics: profile.behavioralMetrics,
                nextReassessmentAt: profile.nextReassessmentAt,
                needsReassessment,
                badge: {
                    type: profile.tribe,
                    earnedAt: profile.createdAt,
                },
            },
        });
    } catch (error) {
        logger.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
});

// ============================================================================
// POST /api/tribe/reassess - Trigger behavioral reassessment
// ============================================================================
router.post('/reassess', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId || req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const result = await tribeAssessmentService.performBehavioralReassessment(userId);

        res.json({
            success: true,
            data: {
                tribe: result.tribe,
                degenPercent: result.degenPercent,
                regenPercent: result.regenPercent,
                confidence: result.confidence,
                source: 'behavioral_reassessment',
                message: `Your tribe has been updated based on your trading behavior over the last 30 days.`,
                nextReassessment: result.reassessmentDate,
            },
        });
    } catch (error) {
        logger.error('Error performing reassessment:', error);
        res.status(500).json({ success: false, error: 'Failed to perform reassessment' });
    }
});

// ============================================================================
// GET /api/tribe/check-reassessment - Check if user needs reassessment
// ============================================================================
router.get('/check-reassessment', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId || req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const needsReassessment = await tribeAssessmentService.needsReassessment(userId);

        res.json({
            success: true,
            data: { needsReassessment },
        });
    } catch (error) {
        logger.error('Error checking reassessment:', error);
        res.status(500).json({ success: false, error: 'Failed to check reassessment status' });
    }
});

// ============================================================================
// POST /api/tribe/confirm - Confirm badge after viewing results
// ============================================================================
router.post('/confirm', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId || req.headers['x-user-id'] as string;
        const { tribe } = req.body as { tribe: TribeType };

        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        // Mark badge as confirmed (could update a confirmed_at field)
        const profile = await tribeAssessmentService.getTribeProfile(userId);

        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        res.json({
            success: true,
            data: {
                confirmed: true,
                tribe: profile.tribe,
                message: profile.tribe === 'degen'
                    ? '🔥 You are now officially a Degen! Your dashboard has been customized.'
                    : '💎 You are now officially a Regen! Your dashboard has been customized.',
            },
        });
    } catch (error) {
        logger.error('Error confirming badge:', error);
        res.status(500).json({ success: false, error: 'Failed to confirm badge' });
    }
});

export default router;
