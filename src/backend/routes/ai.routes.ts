// AI Routes - Scarlett AI Integration
import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { scarlettAI } from '../services/scarlett-ai.service';

const router = Router();

// GET /api/ai/health - Public health check (no auth required)
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await scarlettAI.healthCheck();
    res.json({ healthy: isHealthy, service: 'Scarlett AI' });
  } catch (error: any) {
    res.json({ healthy: false, service: 'Scarlett AI', error: error.message });
  }
});

// All routes require authentication
router.use(authenticateToken);

// POST /api/ai/chat - Chat with Scarlett AI
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, blockchainFocus, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await scarlettAI.chat({
      message,
      conversation_history: conversationHistory,
      blockchain_focus: blockchainFocus,
      context: {
        wallet_address: context?.walletAddress,
        chain_id: context?.chainId,
        transaction_hash: context?.transactionHash,
      },
    });

    res.json({
      response: response.response,
      conversationId: response.intent?.type,
      intent: response.intent,
    });
  } catch (error: any) {
    logger.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat' });
  }
});

// POST /api/ai/analyze-transaction - Analyze transaction with AI
router.post('/analyze-transaction', async (req: Request, res: Response) => {
  try {
    const { transactionHash, chainId, walletAddress } = req.body;

    if (!transactionHash || !chainId) {
      return res.status(400).json({ error: 'Transaction hash and chain ID required' });
    }

    const analysis = await scarlettAI.analyzeTransaction({
      transaction_hash: transactionHash,
      chain_id: chainId,
      wallet_address: walletAddress,
    });

    res.json({
      analysis: analysis.analysis,
      riskLevel: analysis.risk_level,
      recommendations: analysis.recommendations,
      insights: analysis.insights,
    });
  } catch (error: any) {
    logger.error('AI transaction analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze transaction' });
  }
});

// POST /api/ai/defi-recommendations - Get DeFi recommendations
router.post('/defi-recommendations', async (req: Request, res: Response) => {
  try {
    const { riskTolerance, portfolioValue, experience, interests } = req.body;

    if (!riskTolerance || !portfolioValue || !experience) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const recommendations = await scarlettAI.getDeFiRecommendations({
      risk_tolerance: riskTolerance,
      portfolio_value: portfolioValue,
      experience: experience,
      interests: interests,
    });

    res.json({ recommendations });
  } catch (error: any) {
    logger.error('AI DeFi recommendations error:', error);
    res.status(500).json({ error: error.message || 'Failed to get recommendations' });
  }
});

// POST /api/ai/explain - Explain a concept
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { concept, complexity } = req.body;

    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    const explanation = await scarlettAI.explainConcept(concept, complexity || 'simple');

    res.json({ explanation });
  } catch (error: any) {
    logger.error('AI explain error:', error);
    res.status(500).json({ error: error.message || 'Failed to explain concept' });
  }
});

// POST /api/ai/sessions - Create a new conversation session
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'anonymous';
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store session (in production, use database)
    // For now, just return session ID
    
    res.json({
      sessionId,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('AI session creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create session' });
  }
});

// GET /api/ai/sessions/:sessionId - Get session details
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user?.id || 'anonymous';
    
    // In production, fetch from database
    res.json({
      sessionId,
      userId,
      messageCount: 0, // Would be fetched from database
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('AI session fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch session' });
  }
});

// GET /api/ai/sessions - List all sessions for user
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'anonymous';
    
    // In production, fetch from database
    res.json({
      sessions: [],
      userId,
    });
  } catch (error: any) {
    logger.error('AI sessions list error:', error);
    res.status(500).json({ error: error.message || 'Failed to list sessions' });
  }
});

// DELETE /api/ai/sessions/:sessionId - Delete a session
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // In production, delete from database
    res.json({
      success: true,
      sessionId,
      deletedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('AI session deletion error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete session' });
  }
});

// POST /api/ai/task - Execute an AI task
router.post('/task', async (req: Request, res: Response) => {
  try {
    const { taskName, parameters } = req.body;
    const userId = (req as any).user?.id || 'anonymous';

    if (!taskName) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const result = await scarlettAI.executeTask(taskName, parameters || {}, userId);

    res.json({
      success: true,
      taskName,
      result,
    });
  } catch (error: any) {
    logger.error('AI task execution error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute task' });
  }
});

export default router;

