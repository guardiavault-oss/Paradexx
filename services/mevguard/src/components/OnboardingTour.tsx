import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Shield,
  Activity,
  Bell,
  Network,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from '../lib/hooks';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
  image?: string;
  page?: string;
  tips: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MEVGUARD',
    description: 'Your comprehensive MEV protection platform. Let\'s take a quick tour to get you started.',
    icon: Shield,
    tips: [
      'Monitor MEV attacks in real-time',
      'Protect your transactions automatically',
      'Track savings and performance',
    ],
  },
  {
    id: 'protection',
    title: 'MEV Protection',
    description: 'MEVGUARD protects your transactions from sandwich attacks, front-running, and other MEV threats across 10+ networks.',
    icon: Shield,
    page: 'overview',
    tips: [
      'Add token addresses to protect',
      'Automatic threat detection',
      'Private transaction routing',
      'Real-time monitoring',
    ],
  },
  {
    id: 'monitoring',
    title: 'Live Monitoring',
    description: 'Watch threats being detected and blocked in real-time. See exactly what attacks are targeting your transactions.',
    icon: Activity,
    page: 'live',
    tips: [
      'Real-time threat feed',
      'Attack type classification',
      'Profit/loss calculations',
      'Transaction traces',
    ],
  },
  {
    id: 'alerts',
    title: 'Smart Alerts',
    description: 'Get notified when attacks are detected, protection is active, or gas prices spike.',
    icon: Bell,
    page: 'alerts',
    tips: [
      'Customizable alert types',
      'Multiple delivery methods',
      'Quiet hours support',
      'Threshold configuration',
    ],
  },
  {
    id: 'networks',
    title: 'Multi-Chain Support',
    description: 'MEVGUARD works across Ethereum, Polygon, BSC, Arbitrum, Optimism, and more.',
    icon: Network,
    page: 'networks',
    tips: [
      '10+ supported networks',
      'Instant chain switching',
      'Aggregate view across all chains',
      'Chain-specific MEV detection',
    ],
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You now know the basics. Start protecting your transactions from MEV attacks.',
    icon: CheckCircle,
    tips: [
      'Add your first token address',
      'Explore the dashboard',
      'Configure your alerts',
      'Review security settings',
    ],
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

export function OnboardingTour({ onComplete, autoStart = false }: OnboardingTourProps) {
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage('onboarding-completed', false);
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (autoStart && !hasCompletedTour) {
      // Delay showing tour to let the dashboard load
      setTimeout(() => setShowTour(true), 1000);
    }
  }, [autoStart, hasCompletedTour]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowTour(false);
    setCurrentStep(0);
  };

  const handleComplete = () => {
    setHasCompletedTour(true);
    setShowTour(false);
    setCurrentStep(0);
    onComplete?.();
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!showTour) return null;

  return (
    <Dialog open={showTour} onOpenChange={setShowTour}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-2xl">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-6 pb-4">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h2 className="text-white text-2xl mb-3">{step.title}</h2>
                <p className="text-gray-400">{step.description}</p>
              </div>

              {/* Tips */}
              <div className="bg-[#0f0f0f] rounded-lg p-4 mb-6">
                <h4 className="text-white text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Key Features:
                </h4>
                <ul className="space-y-2">
                  {step.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="border-[#2a2a2a]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={handleSkip}
              className="border-[#2a2a2a] text-gray-400"
            >
              Skip Tour
            </Button>

            <Button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Restart tour button component
export function RestartTourButton() {
  const [, setHasCompletedTour] = useLocalStorage('onboarding-completed', false);
  const [showTour, setShowTour] = useState(false);

  const handleRestartTour = () => {
    setHasCompletedTour(false);
    setShowTour(true);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleRestartTour}
        className="border-[#2a2a2a]"
      >
        <Activity className="w-4 h-4 mr-2" />
        Restart Tutorial
      </Button>
      {showTour && (
        <OnboardingTour
          autoStart={true}
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  );
}
