import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  X,
  Search,
  Book,
  MessageCircle,
  ChevronRight,
  Shield,
  Zap,
  Users,
  ChevronDown,
} from "lucide-react";

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  type: "degen" | "regen";
}

interface FAQItem {
  question: string;
  answer: string;
}

export function HelpCenter({
  isOpen,
  onClose,
  type,
}: HelpCenterProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "getting-started", label: "Getting Started", icon: Book, count: 12 },
    { id: "security", label: "Security", icon: Shield, count: 8 },
    { id: "trading", label: "Trading", icon: Zap, count: 15 },
    { id: "vault", label: "Vault & Guardians", icon: Users, count: 10 },
  ];

  const faqs: FAQItem[] = [
    {
      question: "How do I connect my wallet?",
      answer: "Click the 'Connect Wallet' button and choose your preferred connection method. We support MetaMask, WalletConnect, and email login.",
    },
    {
      question: "Is my wallet secure?",
      answer: "Yes! We use industry-standard encryption and never store your private keys. Your wallet remains in your full control.",
    },
    {
      question: "What is MEV protection?",
      answer: "MEV protection prevents bots from front-running your transactions, ensuring you get the best possible price.",
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          borderLeft: `1px solid ${primaryColor}40`,
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Help Center</h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 rounded-xl text-white placeholder-white/40 outline-none"
              style={{ border: `1px solid ${primaryColor}20` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedCategory ? (
            <>
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3">Browse Topics</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className="w-full p-4 rounded-xl border transition-all flex items-center gap-3"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: `${primaryColor}20`,
                      }}
                    >
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <category.icon className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-white">{category.label}</div>
                        <div className="text-xs text-white/60">{category.count} articles</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Frequently Asked</h3>
                <div className="space-y-2">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="rounded-xl border overflow-hidden"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        borderColor: `${primaryColor}20`,
                      }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <span className="text-sm font-medium text-white pr-2">{faq.question}</span>
                        <motion.div
                          animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-white/60" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {expandedFAQ === index && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4">
                              <p className="text-xs text-white/60">{faq.answer}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-sm mb-4"
                style={{ color: primaryColor }}
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to topics
              </motion.button>
              <h3 className="text-lg font-bold text-white mb-4">
                {categories.find((c) => c.id === selectedCategory)?.label}
              </h3>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-4 rounded-xl border flex items-center justify-center gap-2 font-medium"
            style={{
              background: `${primaryColor}20`,
              borderColor: `${primaryColor}40`,
              color: primaryColor,
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
