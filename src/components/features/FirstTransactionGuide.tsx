import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Shield,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  tip?: string;
  highlight?: string;
}

interface FirstTransactionGuideProps {
  type: "send" | "receive" | "swap";
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  walletType?: "degen" | "regen";
}

const GUIDE_CONTENT: Record<string, GuideStep[]> = {
  send: [
    {
      id: "intro",
      title: "Sending Crypto",
      description:
        "You're about to send cryptocurrency to another wallet. Let's walk through it step by step.",
      tip: "Always double-check the recipient address. Crypto transactions can't be reversed!",
    },
    {
      id: "address",
      title: "Enter Recipient Address",
      description:
        "This is the wallet address where you want to send crypto. It usually starts with '0x' and is 42 characters long.",
      tip: "Use the address book to save frequently used addresses and avoid typos.",
      highlight: '[data-guide="recipient-address"]',
    },
    {
      id: "amount",
      title: "Choose Amount",
      description:
        "Enter how much you want to send. You'll see the value in both crypto and your local currency.",
      tip: "Keep some extra for 'gas fees' - the small cost to process your transaction.",
      highlight: '[data-guide="amount-input"]',
    },
    {
      id: "review",
      title: "Review Transaction",
      description:
        "Before confirming, we'll show you exactly what will happen including any fees. This is your chance to double-check everything.",
      tip: "Our simulation shows what will change in your wallet before you confirm.",
    },
    {
      id: "confirm",
      title: "Confirm & Sign",
      description:
        "When you're ready, tap confirm. You may need to use your PIN or biometrics to authorize the transaction.",
      tip: "You can always cancel before the final confirmation if something looks wrong.",
    },
  ],
  receive: [
    {
      id: "intro",
      title: "Receiving Crypto",
      description:
        "To receive crypto, you just need to share your wallet address with the sender. Let's show you how.",
      tip: "Your address is like your email - it's safe to share publicly.",
    },
    {
      id: "address",
      title: "Your Wallet Address",
      description:
        "This is your unique wallet address. Anyone can send you crypto to this address.",
      tip: "You can use the same address to receive any supported cryptocurrency.",
      highlight: '[data-guide="your-address"]',
    },
    {
      id: "qr",
      title: "QR Code",
      description:
        "The QR code contains your address. Others can scan it with their phone to send you crypto instantly.",
      tip: "Great for in-person transactions - no need to type long addresses!",
      highlight: '[data-guide="qr-code"]',
    },
    {
      id: "share",
      title: "Share Options",
      description:
        "You can copy your address to clipboard, share via message, or save the QR code image.",
      tip: "Once someone sends crypto to your address, it will appear in your wallet after confirmation.",
    },
  ],
  swap: [
    {
      id: "intro",
      title: "Swapping Tokens",
      description:
        "A swap lets you exchange one cryptocurrency for another directly in your wallet. No need for an exchange!",
      tip: "Swaps happen on decentralized exchanges (DEXs) - you stay in control of your funds.",
    },
    {
      id: "from",
      title: "Token to Swap From",
      description:
        "Select the token you want to trade away and enter the amount.",
      tip: "Make sure you have enough of this token plus some ETH for gas fees.",
      highlight: '[data-guide="swap-from"]',
    },
    {
      id: "to",
      title: "Token to Receive",
      description:
        "Choose which token you want to receive. The exchange rate will be calculated automatically.",
      tip: 'Rates can change quickly. Your swap is protected by "slippage tolerance".',
      highlight: '[data-guide="swap-to"]',
    },
    {
      id: "slippage",
      title: "Understanding Slippage",
      description:
        "'Slippage' is the difference between expected and actual price. We protect you by setting a maximum acceptable slippage.",
      tip: "Default is 0.5-1%. Higher values complete faster but might cost more.",
    },
    {
      id: "confirm",
      title: "Review & Confirm",
      description:
        "Check the rate, fees, and minimum received amount. Then confirm to execute the swap.",
      tip: "Our MEV protection ensures you get the best price without front-running.",
    },
  ],
};

export function FirstTransactionGuide({
  type,
  isOpen,
  onClose,
  onComplete,
  walletType = "degen",
}: FirstTransactionGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = GUIDE_CONTENT[type];
  const step = steps[currentStep];

  const isDegen = walletType === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  // Mark as completed in localStorage
  const markComplete = () => {
    localStorage.setItem(
      `paradex_first_${type}_complete`,
      "true",
    );
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      markComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    markComplete();
  };

  const getIcon = () => {
    switch (type) {
      case "send":
        return <ArrowUpRight className="w-6 h-6" />;
      case "receive":
        return <ArrowDownLeft className="w-6 h-6" />;
      case "swap":
        return <RefreshCw className="w-6 h-6" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-black/95 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          style={{
            boxShadow: `0 0 60px ${accentColor}30`,
          }}
        >
          {/* Header */}
          <div
            className="p-6 flex items-center justify-between border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
                }}
              >
                <div style={{ color: accentColor }}>
                  {getIcon()}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  First{" "}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </h2>
                <p className="text-xs text-white/50 uppercase tracking-wider">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-white/5">
            <motion.div
              className="h-full"
              style={{
                background: `linear-gradient(90deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles
                    className="w-5 h-5"
                    style={{ color: accentColor }}
                  />
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Tip Box */}
                {step.tip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl flex items-start gap-3"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}10 0%, ${secondaryColor}05 100%)`,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
                      }}
                    >
                      <Lightbulb
                        className="w-5 h-5"
                        style={{ color: accentColor }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white/80 mb-1 uppercase tracking-wider">
                        💡 Pro Tip
                      </p>
                      <p className="text-sm text-white/70">
                        {step.tip}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-white/50 hover:text-white/70 transition-colors font-black uppercase tracking-wider"
            >
              Skip Guide
            </button>
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {currentStep === steps.length - 1
                  ? "Got it!"
                  : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check if user has completed first transaction guides
export function useFirstTransactionGuide() {
  const hasCompletedSend =
    localStorage.getItem("paradex_first_send_complete") ===
    "true";
  const hasCompletedReceive =
    localStorage.getItem("paradex_first_receive_complete") ===
    "true";
  const hasCompletedSwap =
    localStorage.getItem("paradex_first_swap_complete") ===
    "true";

  return {
    hasCompletedSend,
    hasCompletedReceive,
    hasCompletedSwap,
    shouldShowGuide: (type: "send" | "receive" | "swap") => {
      const mode =
        localStorage.getItem("paradex_user_mode") || "beginner";
      if (mode !== "beginner") return false;

      switch (type) {
        case "send":
          return !hasCompletedSend;
        case "receive":
          return !hasCompletedReceive;
        case "swap":
          return !hasCompletedSwap;
      }
    },
    resetGuides: () => {
      localStorage.removeItem("paradex_first_send_complete");
      localStorage.removeItem("paradex_first_receive_complete");
      localStorage.removeItem("paradex_first_swap_complete");
    },
  };
}

export default FirstTransactionGuide;