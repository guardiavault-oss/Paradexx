import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Check,
  Crown,
  Zap,
  Shield,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  icon: typeof Shield;
  color: string;
  features: string[];
  limits: {
    protectedTransactions: number | 'unlimited';
    networks: number;
    alerts: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
  };
}

const tiers: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'month',
    icon: Shield,
    color: 'text-gray-400',
    features: [
      '10 protected transactions/month',
      '3 supported networks',
      'Basic MEV detection',
      'Email notifications',
      'Community support',
    ],
    limits: {
      protectedTransactions: 10,
      networks: 3,
      alerts: true,
      apiAccess: false,
      prioritySupport: false,
      advancedAnalytics: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingPeriod: 'month',
    icon: Zap,
    color: 'text-blue-400',
    features: [
      '500 protected transactions/month',
      '10+ supported networks',
      'Advanced MEV detection',
      'All notification channels',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    limits: {
      protectedTransactions: 500,
      networks: 10,
      alerts: true,
      apiAccess: true,
      prioritySupport: true,
      advancedAnalytics: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    billingPeriod: 'month',
    icon: Crown,
    color: 'text-purple-400',
    features: [
      'Unlimited protected transactions',
      'All networks supported',
      'Custom MEV strategies',
      'Dedicated relay infrastructure',
      'White-label options',
      '24/7 dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    limits: {
      protectedTransactions: 'unlimited',
      networks: 999,
      alerts: true,
      apiAccess: true,
      prioritySupport: true,
      advancedAnalytics: true,
    },
  },
];

interface CurrentSubscription {
  tierId: string;
  startDate: Date;
  renewalDate: Date;
  usage: {
    protectedTransactions: number;
    totalTransactions: number;
  };
  status: 'active' | 'expiring' | 'trial';
}

export function SubscriptionManager() {
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription>({
    tierId: 'free',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    usage: {
      protectedTransactions: 7,
      totalTransactions: 10,
    },
    status: 'active',
  });

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTier = tiers.find(t => t.id === currentSubscription.tierId) || tiers[0];
  const usagePercentage = currentTier.limits.protectedTransactions === 'unlimited'
    ? 0
    : (currentSubscription.usage.protectedTransactions / currentTier.limits.protectedTransactions) * 100;

  const daysUntilRenewal = Math.ceil(
    (currentSubscription.renewalDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  const handleUpgrade = (tierId: string) => {
    setSelectedTier(tierId);
    setShowUpgradeDialog(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedTier) return;

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setCurrentSubscription({
      tierId: selectedTier,
      startDate: new Date(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usage: {
        protectedTransactions: 0,
        totalTransactions: tiers.find(t => t.id === selectedTier)?.limits.protectedTransactions === 'unlimited'
          ? 999999
          : tiers.find(t => t.id === selectedTier)?.limits.protectedTransactions || 0,
      },
      status: 'active',
    });

    setIsProcessing(false);
    setShowUpgradeDialog(false);
    setSelectedTier(null);

    const tierName = tiers.find(t => t.id === selectedTier)?.name || '';
    toast.success(`Successfully upgraded to ${tierName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div>
        <h2 className="text-white text-xl mb-1">Subscription</h2>
        <p className="text-gray-400 text-sm">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Status */}
      <Card className="p-6 bg-[#1a1a1a] border-[#2a2a2a]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white text-xl">{currentTier.name} Plan</h3>
              <Badge
                variant="outline"
                className={`${
                  currentSubscription.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}
              >
                {currentSubscription.status === 'active' ? 'Active' : 'Expiring Soon'}
              </Badge>
            </div>
            <p className="text-gray-400 text-sm">
              {currentTier.price === 0 ? (
                'Free forever'
              ) : (
                <>
                  ${currentTier.price}/{currentTier.billingPeriod} • Renews{' '}
                  {currentSubscription.renewalDate.toLocaleDateString()}
                </>
              )}
            </p>
          </div>

          {currentTier.id !== 'enterprise' && (
            <Button
              onClick={() => handleUpgrade(currentTier.id === 'free' ? 'pro' : 'enterprise')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Usage */}
        {currentTier.limits.protectedTransactions !== 'unlimited' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Monthly Usage: {currentSubscription.usage.protectedTransactions} /{' '}
                {currentTier.limits.protectedTransactions} transactions
              </span>
              <span className="text-sm text-gray-400">
                {usagePercentage.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={usagePercentage}
              className={`h-2 ${
                usagePercentage > 80
                  ? 'bg-red-500/20 [&>div]:bg-red-500'
                  : usagePercentage > 60
                  ? 'bg-yellow-500/20 [&>div]:bg-yellow-500'
                  : 'bg-emerald-500/20 [&>div]:bg-emerald-500'
              }`}
            />
            {usagePercentage > 80 && (
              <div className="flex items-center gap-2 mt-3 text-sm text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span>You're approaching your monthly limit. Consider upgrading.</span>
              </div>
            )}
          </div>
        )}

        {/* Billing Info */}
        {currentTier.price > 0 && (
          <>
            <Separator className="my-6 bg-[#2a2a2a]" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">Next Billing Date</div>
                <div className="text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {currentSubscription.renewalDate.toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Amount</div>
                <div className="text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  ${currentTier.price}
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="text-white mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = tier.id === currentSubscription.tierId;

            return (
              <Card
                key={tier.id}
                className={`p-6 transition-all ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className={`w-6 h-6 ${tier.color}`} />
                  <div>
                    <h4 className="text-white">{tier.name}</h4>
                    {isCurrent && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs mt-1">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-3xl text-white font-mono mb-1">
                    {tier.price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        ${tier.price}
                        <span className="text-sm text-gray-500">/{tier.billingPeriod}</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={isCurrent}
                  className={`w-full ${
                    isCurrent
                      ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : tier.price === 0 ? 'Downgrade' : 'Upgrade'}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Upgrade</DialogTitle>
          </DialogHeader>

          {selectedTier && (
            <div className="space-y-4">
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">New Plan:</span>
                  <span className="text-white font-medium">
                    {tiers.find(t => t.id === selectedTier)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Monthly Cost:</span>
                  <span className="text-white font-mono">
                    ${tiers.find(t => t.id === selectedTier)?.price}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                • Your card will be charged immediately
                <br />• You can cancel or change your plan at any time
                <br />• Unused portion of current plan will be prorated
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeDialog(false)}
                  className="flex-1 border-[#2a2a2a]"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmUpgrade}
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Upgrade
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
