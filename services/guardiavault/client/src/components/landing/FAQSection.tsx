import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Plus, Minus, HelpCircle, Shield, Users, Key, Clock, DollarSign, Lock } from "lucide-react";
import ContactModal from "./ContactModal";

const faqCategories = [
  {
    category: "Getting Started",
    icon: HelpCircle,
    questions: [
      {
        question: "What is GuardiaVault?",
        answer: "GuardiaVault is a comprehensive digital asset inheritance platform that ensures your cryptocurrency and digital assets can be safely passed on to your beneficiaries. We combine guardian-based recovery, biometric verification, and automated yield generation to protect and grow your digital legacy."
      },
      {
        question: "How does GuardiaVault protect my assets?",
        answer: "We use a multi-layer security approach: your vault keys are split into encrypted fragments distributed among trusted guardians (2-of-3 threshold), regular biometric check-ins prevent unauthorized access, and all data is encrypted both in transit and at rest. No single party, including GuardiaVault, can access your funds alone."
      },
      {
        question: "Do I need technical knowledge to use GuardiaVault?",
        answer: "No! GuardiaVault is designed to be user-friendly for everyone. Our intuitive interface guides you through setup step-by-step. You just need to connect your wallet, choose guardians, and set your preferences - we handle all the complex cryptography behind the scenes."
      },
    ]
  },
  {
    category: "Security & Privacy",
    icon: Shield,
    questions: [
      {
        question: "Can GuardiaVault access my funds?",
        answer: "No. GuardiaVault never has access to your funds. We use a non-custodial architecture where you maintain full control. The recovery system requires consensus from multiple guardians and verified death certificates - we cannot access your assets under any circumstances."
      },
      {
        question: "What happens if GuardiaVault shuts down?",
        answer: "Your assets remain safe. All critical recovery information is stored on-chain and distributed among your guardians. Even if GuardiaVault ceased to exist, your guardians could still recover your assets using the encrypted fragments they hold. We also provide emergency recovery documentation to all users."
      },
      {
        question: "How is my biometric data handled?",
        answer: "Biometric data is processed locally on your device using WebAuthn standards and never leaves your device. Only cryptographic proofs are stored, not your actual biometric data. This ensures your privacy while maintaining security."
      },
    ]
  },
  {
    category: "Guardians System",
    icon: Users,
    questions: [
      {
        question: "Who should I choose as guardians?",
        answer: "Choose trusted individuals like family members, close friends, or professional advisors (lawyers, accountants). Ideal guardians are reliable, tech-comfortable enough to follow instructions, and geographically distributed. You need 3 guardians, and any 2 can initiate recovery."
      },
      {
        question: "What if a guardian loses their key fragment?",
        answer: "You can replace guardians at any time through your dashboard. The system will generate new key fragments and redistribute them. The old guardian's fragment becomes invalid, maintaining security. We recommend reviewing your guardians annually."
      },
      {
        question: "Can guardians access my funds without my permission?",
        answer: "No. Guardians only hold encrypted fragments that are useless alone. Recovery requires: (1) At least 2 of 3 guardians to cooperate, (2) Verified proof of death or incapacitation, (3) A time-locked waiting period, and (4) Beneficiary verification. The system is designed to prevent collusion."
      },
    ]
  },
  {
    category: "Recovery Process",
    icon: Key,
    questions: [
      {
        question: "How does the recovery process work?",
        answer: "When triggered, the recovery process follows these steps: (1) Beneficiary initiates claim with death certificate, (2) System verifies documentation, (3) Guardians are notified and must confirm (2 of 3 required), (4) Time-lock period begins (customizable, default 30 days), (5) If no dispute, assets are released to beneficiaries according to your will."
      },
      {
        question: "What documents are needed for recovery?",
        answer: "Typically required: official death certificate, beneficiary identification, proof of relationship (if applicable). The exact requirements depend on your jurisdiction. GuardiaVault can assist beneficiaries with document verification and the claims process."
      },
      {
        question: "Can I test the recovery process?",
        answer: "Yes! We offer a 'Recovery Drill' feature where you can simulate the entire process with your guardians using a test vault. This helps ensure everyone understands their role and the system works as expected."
      },
    ]
  },
  {
    category: "Check-ins & Dead Man's Switch",
    icon: Clock,
    questions: [
      {
        question: "What is a dead man's switch?",
        answer: "It's an automated system that triggers if you don't check in for a specified period. If you miss check-ins, the system alerts your guardians and can initiate the recovery process. This ensures your assets are recovered even if you become suddenly incapacitated."
      },
      {
        question: "How often do I need to check in?",
        answer: "You can customize your check-in frequency from 7 to 90 days based on your preference. Most users choose 30 days. You'll receive reminders before each check-in is due, and there's a grace period if you miss one."
      },
      {
        question: "What if I'm traveling or unable to check in?",
        answer: "You can: (1) Perform check-ins from anywhere using your phone, (2) Set vacation mode to pause check-ins temporarily, (3) Delegate temporary check-in authority to a trusted person, or (4) Extend your check-in period before traveling."
      },
    ]
  },
  {
    category: "Pricing & Billing",
    icon: DollarSign,
    questions: [
      {
        question: "What's included in each pricing tier?",
        answer: "Starter ($9.99): 1 vault, 3 guardians, basic features. Professional ($29.99): 3 vaults, yield generation, priority support. Enterprise ($49.99): Unlimited vaults, 24/7 support, custom features. All plans include core security features and updates."
      },
      {
        question: "Are there any hidden fees?",
        answer: "No hidden fees. The only additional cost is a 1% performance fee on yield generated (Professional and Enterprise only). There are no setup fees, no recovery fees, and no charges for guardian invitations or replacements."
      },
      {
        question: "Can I change or cancel my plan?",
        answer: "Yes, you can upgrade, downgrade, or cancel anytime. Upgrades take effect immediately with prorated billing. Downgrades and cancellations take effect at the end of your current billing period. Your vault remains accessible even after cancellation (read-only mode)."
      },
    ]
  },
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId);
    } else {
      newOpenItems.add(itemId);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section id="faq" className="relative py-12 overflow-hidden">

      <div className="relative z-10 container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Everything you need to know about securing your digital legacy with GuardiaVault
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {faqCategories.map((cat, index) => (
            <motion.button
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveCategory(index)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all ${
                activeCategory === index
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <cat.icon className="w-5 h-5" />
              {cat.category}
            </motion.button>
          ))}
        </div>

        {/* FAQ Items */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="space-y-4">
            {faqCategories[activeCategory].questions.map((item, index) => {
              const itemId = `${activeCategory}-${index}`;
              const isOpen = openItems.has(itemId);
              
              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div
                    className={`bg-slate-900/50 backdrop-blur border rounded-2xl transition-all cursor-pointer ${
                      isOpen 
                        ? "border-cyan-500/50 shadow-lg shadow-cyan-500/10" 
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left"
                    >
                      <h3 className="text-lg font-semibold text-white pr-4">
                        {item.question}
                      </h3>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isOpen 
                          ? "bg-cyan-500/20 text-cyan-400" 
                          : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                      }`}>
                        {isOpen ? (
                          <Minus className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5">
                            <p className="text-slate-400 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Still Have Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="inline-block">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-8">
              <Lock className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Still have questions?
              </h3>
              <p className="text-slate-400 mb-6">
                Our support team is here to help you secure your digital legacy
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setIsContactModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:scale-105 transition-transform"
                >
                  Contact Us
                </button>
                <button 
                  onClick={() => setLocation("/support")}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contact Modal */}
      <ContactModal open={isContactModalOpen} onOpenChange={setIsContactModalOpen} />
    </section>
  );
}
