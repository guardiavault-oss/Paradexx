import { Router, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.userId!,
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        hash: true,
        type: true,
        status: true,
        value: true,
        from: true,
        to: true,
        chain: true,
        timestamp: true,
      },
    });

    const notifications = transactions.map(tx => ({
      id: tx.id,
      type: 'transaction',
      title: getTransactionTitle(tx.type, tx.status),
      message: `${tx.type} transaction ${tx.status === 'success' ? 'completed' : tx.status}`,
      data: {
        txHash: tx.hash,
        type: tx.type,
        status: tx.status,
        value: tx.value,
        chain: tx.chain,
      },
      read: tx.status !== 'pending',
      createdAt: tx.timestamp,
    }));

    const priceAlerts = await prisma.priceAlert.findMany({
      where: {
        userId: req.userId!,
        triggered: true,
      },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    });

    const alertNotifications = priceAlerts.map(alert => ({
      id: `alert-${alert.id}`,
      type: 'price_alert',
      title: `${alert.token} Price Alert`,
      message: `${alert.token} is now ${alert.condition} $${alert.targetPrice}`,
      data: {
        token: alert.token,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        currentPrice: alert.currentPrice,
      },
      read: alert.notified,
      createdAt: alert.triggeredAt,
    }));

    const allNotifications = [...notifications, ...alertNotifications]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, Number(limit));

    res.json({ notifications: allNotifications });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

router.get('/badge-count', async (req: Request, res: Response) => {
  try {
    const pendingTx = await prisma.transaction.count({
      where: {
        userId: req.userId!,
        status: 'pending',
      },
    });

    const unnotifiedAlerts = await prisma.priceAlert.count({
      where: {
        userId: req.userId!,
        triggered: true,
        notified: false,
      },
    });

    res.json({ count: pendingTx + unnotifiedAlerts });
  } catch (error) {
    logger.error('Get badge count error:', error);
    res.status(500).json({ error: 'Failed to get badge count' });
  }
});

router.post('/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    if (notificationId.startsWith('alert-')) {
      const alertId = notificationId.replace('alert-', '');
      await prisma.priceAlert.update({
        where: { id: alertId },
        data: { notified: true },
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/read-all', async (req: Request, res: Response) => {
  try {
    await prisma.priceAlert.updateMany({
      where: {
        userId: req.userId!,
        triggered: true,
        notified: false,
      },
      data: { notified: true },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

router.delete('/:notificationId', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    if (notificationId.startsWith('alert-')) {
      const alertId = notificationId.replace('alert-', '');
      await prisma.priceAlert.delete({
        where: { id: alertId },
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

function getTransactionTitle(type: string, status: string): string {
  const action = type.charAt(0).toUpperCase() + type.slice(1);
  const state = status === 'success' ? 'Completed' : status === 'failed' ? 'Failed' : 'Pending';
  return `${action} ${state}`;
}

export default router;
