/**
 * Tribe Assessment Service - STUB
 * Original implementation disabled due to db compatibility issues
 */

import { logger } from '../services/logger.service';

export type TribeType = 'degen' | 'regen';

export interface AssessmentQuestion {
    id: string;
    question: string;
    options: { value: string; label: string; degenScore: number; regenScore: number }[];
}

export interface AssessmentAnswer {
    questionId: string;
    answer: string;
}

export interface AssessmentResult {
    tribe: TribeType;
    confidence: number;
    degenScore: number;
    regenScore: number;
    degenPercent?: number;
    regenPercent?: number;
    reassessmentDate?: Date;
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
    {
        id: 'q1',
        question: 'How do you approach new crypto investments?',
        options: [
            { value: 'a', label: 'YOLO into promising memecoins', degenScore: 10, regenScore: 0 },
            { value: 'b', label: 'Research fundamentals carefully', degenScore: 0, regenScore: 10 },
            { value: 'c', label: 'Mix of both approaches', degenScore: 5, regenScore: 5 },
        ],
    },
    {
        id: 'q2',
        question: 'What is your risk tolerance?',
        options: [
            { value: 'a', label: 'High risk, high reward', degenScore: 10, regenScore: 0 },
            { value: 'b', label: 'Steady growth over time', degenScore: 0, regenScore: 10 },
            { value: 'c', label: 'Balanced approach', degenScore: 5, regenScore: 5 },
        ],
    },
];

class TribeAssessmentService {
    async submitAssessment(userId: string, answers: AssessmentAnswer[]): Promise<AssessmentResult> {
        logger.info(`[TribeAssessment] Processing assessment for user ${userId}`);

        let degenScore = 0;
        let regenScore = 0;

        for (const answer of answers) {
            const question = ASSESSMENT_QUESTIONS.find(q => q.id === answer.questionId);
            if (question) {
                const option = question.options.find(o => o.value === answer.answer);
                if (option) {
                    degenScore += option.degenScore;
                    regenScore += option.regenScore;
                }
            }
        }

        const tribe: TribeType = degenScore >= regenScore ? 'degen' : 'regen';
        const total = degenScore + regenScore;
        const confidence = total > 0 ? Math.abs(degenScore - regenScore) / total : 0.5;

        return { tribe, confidence, degenScore, regenScore };
    }

    async processAssessment(userId: string, answers: AssessmentAnswer[]): Promise<AssessmentResult> {
        return this.submitAssessment(userId, answers);
    }

    async getTribeProfile(userId: string): Promise<any> {
        logger.info(`[TribeAssessment] Getting profile for user ${userId}`);
        return {
            tribe: 'degen' as TribeType,
            badges: [],
            degenPercent: 50,
            regenPercent: 50,
            assessmentHistory: [],
            behavioralMetrics: {},
            nextReassessmentAt: null,
            createdAt: new Date(),
        };
    }

    async updateBadge(userId: string, badge: string): Promise<void> {
        logger.info(`[TribeAssessment] Updating badge for user ${userId}: ${badge}`);
    }

    async checkReassessmentDue(userId: string): Promise<boolean> {
        return false;
    }

    async needsReassessment(userId: string): Promise<boolean> {
        return false;
    }

    async getUsersDueForReassessment(limit: number): Promise<string[]> {
        return [];
    }

    async performBehavioralReassessment(userId: string): Promise<AssessmentResult | null> {
        return null;
    }
}

export const tribeAssessmentService = new TribeAssessmentService();
