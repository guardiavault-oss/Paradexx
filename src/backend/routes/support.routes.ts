import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import crypto from 'crypto';

const router = Router();

const defaultArticles = [
  {
    slug: 'getting-started',
    title: 'Getting Started with Paradox',
    category: 'basics',
    content: 'Learn how to set up your wallet, secure your account, and start managing your crypto assets.',
    order: 1,
  },
  {
    slug: 'security-best-practices',
    title: 'Security Best Practices',
    category: 'security',
    content: 'Enable 2FA, use biometric authentication, and learn how to keep your assets safe.',
    order: 2,
  },
  {
    slug: 'mev-protection',
    title: 'Understanding MEV Protection',
    category: 'defi',
    content: 'Learn how Paradox protects your transactions from front-running and sandwich attacks.',
    order: 3,
  },
  {
    slug: 'inheritance-vaults',
    title: 'Setting Up Inheritance Vaults',
    category: 'guardianx',
    content: 'Configure guardians and beneficiaries to ensure your assets are passed on securely.',
    order: 4,
  },
  {
    slug: 'cross-chain-swaps',
    title: 'Cross-Chain Swaps',
    category: 'defi',
    content: 'How to swap tokens across different blockchains using our bridge aggregator.',
    order: 5,
  },
  {
    slug: 'nft-management',
    title: 'NFT Gallery & Management',
    category: 'nfts',
    content: 'View, transfer, and manage your NFT collection across multiple chains.',
    order: 6,
  },
  {
    slug: 'fiat-onramp',
    title: 'Buying Crypto with Fiat',
    category: 'basics',
    content: 'Use MoonPay or Onramper to purchase crypto directly with your credit card or bank.',
    order: 7,
  },
  {
    slug: 'degenx-trading',
    title: 'DegenX Trading Features',
    category: 'trading',
    content: 'Access advanced trading features including token sniping and limit orders.',
    order: 8,
  },
];

async function ensureHelpArticles() {
  const count = await prisma.helpArticle.count();
  if (count === 0) {
    await prisma.helpArticle.createMany({
      data: defaultArticles,
      skipDuplicates: true,
    });
  }
}

router.get('/help', async (_req: Request, res: Response) => {
  try {
    await ensureHelpArticles();

    const articles = await prisma.helpArticle.findMany({
      where: { published: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        content: true,
      },
    });

    const categoryStats = await prisma.helpArticle.groupBy({
      by: ['category'],
      where: { published: true },
      _count: { id: true },
    });

    const categories = categoryStats.map(cat => ({
      id: cat.category,
      name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
      articleCount: cat._count.id,
    }));

    res.json({
      articles: articles.map(a => ({
        id: a.slug,
        title: a.title,
        category: a.category,
        content: a.content,
      })),
      categories,
    });
  } catch (error) {
    logger.error('Get help articles error:', error);
    res.status(500).json({ error: 'Failed to get help articles' });
  }
});

router.get('/help/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const article = await prisma.helpArticle.findUnique({
      where: { slug, published: true },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article });
  } catch (error) {
    logger.error('Get help article error:', error);
    res.status(500).json({ error: 'Failed to get help article' });
  }
});

router.post('/tickets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subject, description, category, priority = 'medium' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description required' });
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Use: low, medium, high, urgent' });
    }

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.userId!,
        ticketNumber,
        subject,
        description,
        category: category || 'general',
        priority,
        status: 'open',
      },
    });

    res.json({
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
      message: 'Support ticket created. Our team will respond within 24-48 hours.',
    });
  } catch (error) {
    logger.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

router.get('/tickets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where: any = { userId: req.userId! };
    if (status) {
      where.status = status;
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          firstResponseAt: true,
          resolvedAt: true,
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      tickets,
      total,
      hasMore: Number(offset) + tickets.length < total,
    });
  } catch (error) {
    logger.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to get support tickets' });
  }
});

router.get('/tickets/:ticketId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [
          { id: ticketId, userId: req.userId! },
          { ticketNumber: ticketId, userId: req.userId! },
        ],
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ ticket });
  } catch (error) {
    logger.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket details' });
  }
});

router.put('/tickets/:ticketId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        OR: [
          { id: ticketId, userId: req.userId! },
          { ticketNumber: ticketId, userId: req.userId! },
        ],
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const validStatuses = ['closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Users can only close tickets' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status },
    });

    res.json({ ticket: updated });
  } catch (error) {
    logger.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Public FAQ endpoint
router.get('/faq', async (_req: Request, res: Response) => {
  try {
    const faqs = [
      {
        id: '1',
        category: 'General',
        question: 'What is Paradex?',
        answer: 'Paradex is an advanced crypto wallet platform with built-in DeFi features, MEV protection, inheritance vaults, and security tools.',
      },
      {
        id: '2',
        category: 'General',
        question: 'Is Paradex safe to use?',
        answer: 'Yes, Paradex uses industry-standard security practices including encryption, biometric authentication, and multi-signature support for large transactions.',
      },
      {
        id: '3',
        category: 'Security',
        question: 'What is MEV protection?',
        answer: 'MEV (Maximal Extractable Value) protection prevents front-running and sandwich attacks on your transactions by routing them through private mempools.',
      },
      {
        id: '4',
        category: 'Security',
        question: 'How do I enable 2FA?',
        answer: 'Go to Settings > Security > Two-Factor Authentication and follow the setup wizard to link your authenticator app.',
      },
      {
        id: '5',
        category: 'Inheritance',
        question: 'What are Inheritance Vaults?',
        answer: 'Inheritance Vaults allow you to set up trusted guardians and beneficiaries who can access your assets after a period of inactivity.',
      },
      {
        id: '6',
        category: 'Inheritance',
        question: 'How do Guardians work?',
        answer: 'Guardians are trusted contacts who verify your identity and can help recover your account or approve inheritance distributions.',
      },
      {
        id: '7',
        category: 'DeFi',
        question: 'What DEXs does Paradex support?',
        answer: 'Paradex aggregates quotes from major DEXs including Uniswap, 1inch, ParaSwap, and LI.FI across Ethereum, Polygon, Arbitrum, and more.',
      },
      {
        id: '8',
        category: 'DeFi',
        question: 'How do cross-chain swaps work?',
        answer: 'Cross-chain swaps use bridge protocols to move assets between different blockchains in a single transaction.',
      },
      {
        id: '9',
        category: 'Fees',
        question: 'What are Paradex fees?',
        answer: 'Paradex charges no platform fees for standard swaps. You only pay network gas fees and standard DEX fees.',
      },
      {
        id: '10',
        category: 'Account',
        question: 'How do I recover my account?',
        answer: 'Use the recovery option with your backup seed phrase or guardian recovery if you have set up guardians.',
      },
    ];

    res.json({
      faqs,
      categories: ['General', 'Security', 'Inheritance', 'DeFi', 'Fees', 'Account'],
    });
  } catch (error) {
    logger.error('Get FAQ error:', error);
    res.status(500).json({ error: 'Failed to get FAQs' });
  }
});

router.get('/status', async (_req: Request, res: Response) => {
  try {
    let dbStatus = 'operational';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'degraded';
    }

    const mevServiceStatus = process.env.MEV_GUARD_URL ? 'operational' : 'unavailable';

    res.json({
      status: dbStatus === 'operational' ? 'operational' : 'degraded',
      services: {
        api: 'operational',
        database: dbStatus,
        authentication: 'operational',
        walletOperations: 'operational',
        mevProtection: mevServiceStatus,
        bridging: 'operational',
        priceFeeds: 'operational',
      },
      lastUpdated: new Date().toISOString(),
      scheduledMaintenance: null,
    });
  } catch (error) {
    logger.error('Get system status error:', error);
    res.json({
      status: 'degraded',
      services: {
        api: 'operational',
        database: 'degraded',
      },
      lastUpdated: new Date().toISOString(),
    });
  }
});

export default router;
