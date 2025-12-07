import { motion, AnimatePresence } from "motion/react";
import { X, FileText, Shield, ArrowLeft } from "lucide-react";
import { GlassCard } from "../ui";

interface LegalPagesProps {
  isOpen: boolean;
  onClose: () => void;
  page: "terms" | "privacy";
  walletType?: "degen" | "regen";
}

export function LegalPages({
  isOpen,
  onClose,
  page,
  walletType = "degen",
}: LegalPagesProps) {
  const isDegen = walletType === "degen";
  const accentColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";

  if (!isOpen) return null;

  const content =
    page === "terms" ? TERMS_CONTENT : PRIVACY_CONTENT;
  const Icon = page === "terms" ? FileText : Shield;
  const title =
    page === "terms" ? "Terms of Service" : "Privacy Policy";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[80] flex items-start justify-center overflow-y-auto py-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl mx-4 bg-black/95 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
          style={{
            boxShadow: `0 0 60px ${accentColor}30`,
          }}
        >
          {/* Header */}
          <div
            className="p-6 border-b border-white/10 sticky top-0 z-10 backdrop-blur-2xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, ${secondaryColor}10 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}40 0%, ${secondaryColor}20 100%)`,
                  }}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                    {title}
                  </h2>
                  <p className="text-xs text-white/50 uppercase tracking-wider">
                    Last updated: December 2024
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {content.sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard hover={false}>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">
                    {section.title}
                  </h3>
                  <div className="space-y-4 text-white/70">
                    {section.paragraphs.map(
                      (paragraph, pIndex) => (
                        <div key={pIndex}>
                          {typeof paragraph === "string" ? (
                            <p className="leading-relaxed">
                              {paragraph}
                            </p>
                          ) : (
                            <div>
                              <p className="font-bold text-white/90 mb-2">
                                {paragraph.title}
                              </p>
                              <ul className="space-y-2 ml-4">
                                {paragraph.items.map(
                                  (item, iIndex) => (
                                    <li
                                      key={iIndex}
                                      className="flex gap-2"
                                    >
                                      <span className="text-white/40">
                                        •
                                      </span>
                                      <span>{item}</span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-black/50">
            <p className="text-sm text-white/40 text-center">
              Questions? Contact us at{" "}
              <a
                href="mailto:legal@paradoxwallet.app"
                className="text-white/70 hover:text-white underline"
              >
                legal@paradoxwallet.app
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const TERMS_CONTENT = {
  sections: [
    {
      title: "1. Acceptance of Terms",
      paragraphs: [
        'By accessing or using Paradox Wallet ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.',
        "Paradox Wallet is a non-custodial cryptocurrency wallet. You retain full control and responsibility for your private keys and digital assets.",
      ],
    },
    {
      title: "2. Service Description",
      paragraphs: [
        {
          title: "Paradox Wallet provides:",
          items: [
            "Self-custody cryptocurrency wallet functionality",
            "Token swapping through decentralized exchanges",
            "NFT storage and management",
            "Portfolio analytics and tracking",
            "Access to curated decentralized applications",
            "Security features including decoy wallet mode and honeypot detection",
          ],
        },
      ],
    },
    {
      title: "3. User Responsibilities",
      paragraphs: [
        {
          title: "You are solely responsible for:",
          items: [
            "Safeguarding your recovery phrase and private keys",
            "All transactions executed through your wallet",
            "Verifying transaction details before confirmation",
            "Understanding the risks of cryptocurrency transactions",
            "Compliance with applicable laws and regulations",
            "Security of your device and wallet access",
          ],
        },
        "⚠️ We will NEVER ask for your recovery phrase or private keys. Anyone asking for these is attempting to scam you.",
      ],
    },
    {
      title: "4. Fees and Charges",
      paragraphs: [
        {
          title: "Paradox Wallet charges the following fees:",
          items: [
            "Swap fees: 0.5% of transaction value (waived for Premium Pass holders)",
            "Bridge fees: 0.1% of transaction value",
            "Vault management: 0.20-0.25% annually for accounts over $10,000",
            "Premium feature unlocks: One-time fees as displayed in-app",
          ],
        },
        "Network gas fees are passed through without markup. These fees go directly to blockchain validators, not Paradox Wallet.",
      ],
    },
    {
      title: "5. Risks and Disclaimers",
      paragraphs: [
        "Cryptocurrency transactions involve significant risk. You acknowledge and accept these risks:",
        {
          title: "Key Risks:",
          items: [
            "Permanent loss of funds if private keys are lost",
            "Irreversible transactions - no chargebacks possible",
            "Price volatility and potential total loss of value",
            "Smart contract vulnerabilities",
            "Regulatory uncertainty",
            "Potential hacks, exploits, or technical failures",
          ],
        },
        'PARADOX WALLET IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee uninterrupted service, security, or freedom from errors.',
      ],
    },
    {
      title: "6. Privacy and Data",
      paragraphs: [
        "We are committed to privacy and data minimization:",
        {
          title: "What we collect:",
          items: [
            "Minimal analytics (wallet interactions, feature usage)",
            "Error logs for debugging",
            "Optional email for support communications",
          ],
        },
        {
          title: "What we DON'T collect:",
          items: [
            "Your recovery phrase or private keys",
            "Transaction details or wallet contents",
            "Personal identifying information (unless voluntarily provided)",
            "Browsing history or off-app activity",
          ],
        },
        "See our Privacy Policy for complete details.",
      ],
    },
    {
      title: "7. Prohibited Activities",
      paragraphs: [
        {
          title: "You may not use Paradox Wallet to:",
          items: [
            "Engage in illegal activities or money laundering",
            "Finance terrorism or sanctioned entities",
            "Violate intellectual property rights",
            "Distribute malware or conduct phishing attacks",
            "Manipulate markets or engage in fraud",
            "Circumvent security features",
          ],
        },
        "We reserve the right to terminate access for violations of these terms.",
      ],
    },
    {
      title: "8. Limitation of Liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW:",
        "Paradox Wallet, its developers, and affiliates SHALL NOT BE LIABLE for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or cryptocurrency.",
        "Our total liability shall not exceed the fees you paid to Paradox Wallet in the 12 months preceding the claim.",
      ],
    },
    {
      title: "9. Indemnification",
      paragraphs: [
        "You agree to indemnify and hold harmless Paradox Wallet from any claims, damages, losses, or expenses (including legal fees) arising from:",
        {
          title: "",
          items: [
            "Your use of the Service",
            "Violation of these Terms",
            "Violation of applicable laws",
            "Infringement of third-party rights",
          ],
        },
      ],
    },
    {
      title: "10. Changes to Terms",
      paragraphs: [
        "We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Service.",
        "Continued use of Paradox Wallet after changes constitutes acceptance of the modified Terms.",
        "Material changes will be communicated through in-app notifications.",
      ],
    },
    {
      title: "11. Governing Law",
      paragraphs: [
        "These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to conflict of law provisions.",
        "Any disputes shall be resolved through binding arbitration in accordance with [Arbitration Rules].",
      ],
    },
    {
      title: "12. Contact Information",
      paragraphs: [
        "For questions about these Terms, contact us at:",
        "Email: legal@paradoxwallet.app",
        "Discord: discord.gg/paradoxwallet",
      ],
    },
  ],
};

const PRIVACY_CONTENT = {
  sections: [
    {
      title: "1. Introduction",
      paragraphs: [
        'Paradox Wallet ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our non-custodial cryptocurrency wallet service.',
        "Because Paradox Wallet is non-custodial, we do not have access to your private keys, recovery phrase, or wallet contents. You maintain complete control over your digital assets.",
      ],
    },
    {
      title: "2. Information We Collect",
      paragraphs: [
        {
          title: "Automatically Collected Data:",
          items: [
            "Device type and operating system",
            "App version and update status",
            "Feature usage analytics (which features you use, how often)",
            "Error logs and crash reports",
            "Network connection type",
          ],
        },
        {
          title: "Information You Provide:",
          items: [
            "Email address (optional, for support)",
            "Support tickets and correspondence",
            "Feedback and survey responses",
          ],
        },
        {
          title: "What We NEVER Collect:",
          items: [
            "Recovery phrases or private keys",
            "Wallet addresses or balances",
            "Transaction details or history",
            "Token holdings or NFT collections",
            "Browsing history",
            "Biometric data",
            "Personal identifying information (name, address, etc.)",
          ],
        },
      ],
    },
    {
      title: "3. How We Use Information",
      paragraphs: [
        {
          title: "We use collected data to:",
          items: [
            "Improve app performance and stability",
            "Fix bugs and technical issues",
            "Understand feature usage and user preferences",
            "Provide customer support",
            "Communicate important updates",
            "Detect and prevent fraud or abuse",
          ],
        },
        "We DO NOT sell, rent, or share your data with third parties for marketing purposes.",
      ],
    },
    {
      title: "4. Data Storage and Security",
      paragraphs: [
        {
          title: "Security Measures:",
          items: [
            "End-to-end encryption for sensitive operations",
            "Secure local storage on your device",
            "No cloud storage of private keys",
            "Regular security audits",
            "Industry-standard encryption protocols",
          ],
        },
        {
          title: "Data Retention:",
          items: [
            "Analytics data: 90 days",
            "Error logs: 30 days",
            "Support tickets: 1 year",
            "Account deletion requests: Immediate",
          ],
        },
      ],
    },
    {
      title: "5. Third-Party Services",
      paragraphs: [
        "Paradox Wallet integrates with third-party services for core functionality:",
        {
          title: "Service Providers:",
          items: [
            "Blockchain node providers (Infura, Alchemy) - for transaction broadcasting",
            "Price oracles (CoinGecko, Defillama) - for token price data",
            "Analytics services (Mixpanel) - for usage analytics",
            "Error tracking (Sentry) - for crash reports",
          ],
        },
        "These providers have their own privacy policies. We recommend reviewing them.",
      ],
    },
    {
      title: "6. Decentralized Applications (dApps)",
      paragraphs: [
        "When you connect to dApps through Paradox Wallet:",
        {
          title: "",
          items: [
            "dApps can see your wallet address and balances",
            "Transaction data is recorded on public blockchains",
            "Each dApp has its own privacy policy",
            "We are not responsible for dApp privacy practices",
          ],
        },
        "💡 Use our Curated dApp Store to access verified, trusted applications.",
      ],
    },
    {
      title: "7. Blockchain Transparency",
      paragraphs: [
        "Important: All blockchain transactions are PUBLIC and PERMANENT.",
        {
          title: "Anyone can see:",
          items: [
            "Your wallet address",
            "Transaction amounts and recipients",
            "Token balances and history",
            "NFT holdings",
            "Smart contract interactions",
          ],
        },
        "This is inherent to blockchain technology and not controlled by Paradox Wallet.",
      ],
    },
    {
      title: "8. Children's Privacy",
      paragraphs: [
        "Paradox Wallet is not intended for users under 18 years of age.",
        "We do not knowingly collect information from children. If you believe we have collected data from a child, please contact us immediately.",
      ],
    },
    {
      title: "9. International Data Transfers",
      paragraphs: [
        "Paradox Wallet is available globally. Data may be processed in countries other than your own.",
        "We ensure appropriate safeguards are in place for international data transfers in compliance with GDPR and other regulations.",
      ],
    },
    {
      title: "10. Your Rights",
      paragraphs: [
        {
          title: "You have the right to:",
          items: [
            "Access your data - request a copy of data we hold",
            "Correct inaccuracies - update incorrect information",
            "Delete your data - request complete deletion",
            "Opt-out of analytics - disable tracking in Settings",
            "Data portability - export your data",
            "Withdraw consent - stop data collection anytime",
          ],
        },
        "To exercise these rights, contact privacy@paradoxwallet.app",
      ],
    },
    {
      title: "11. Cookies and Tracking",
      paragraphs: [
        "Paradox Wallet uses minimal tracking:",
        {
          title: "",
          items: [
            "Essential cookies for app functionality",
            "Analytics cookies (can be disabled in Settings)",
            "No advertising or marketing cookies",
            "No cross-site tracking",
          ],
        },
      ],
    },
    {
      title: "12. Data Breach Notification",
      paragraphs: [
        "In the unlikely event of a data breach affecting your information:",
        {
          title: "",
          items: [
            "We will notify affected users within 72 hours",
            "Notifications sent via in-app alert and email",
            "Details of the breach and remediation steps provided",
            "Regulatory authorities notified as required by law",
          ],
        },
        "Note: Because we don't store private keys, a Paradox Wallet breach cannot compromise your funds.",
      ],
    },
    {
      title: "13. Changes to Privacy Policy",
      paragraphs: [
        "We may update this Privacy Policy periodically. Changes will be posted in-app and on our website.",
        "Material changes will be communicated with 30 days' notice.",
        "Continued use after changes constitutes acceptance of the updated policy.",
      ],
    },
    {
      title: "14. Contact Us",
      paragraphs: [
        "For privacy-related questions or requests:",
        "Email: privacy@paradoxwallet.app",
        "Data Protection Officer: dpo@paradoxwallet.app",
        "Discord: discord.gg/paradoxwallet",
      ],
    },
    {
      title: "15. Regional Compliance",
      paragraphs: [
        {
          title: "GDPR (Europe):",
          items: [
            "Legal basis: Legitimate interest and consent",
            "Data controller: Paradox Wallet Inc.",
            "Right to lodge complaint with supervisory authority",
          ],
        },
        {
          title: "CCPA (California):",
          items: [
            "We do not sell personal information",
            "Right to opt-out of data sharing",
            "Annual privacy disclosure available upon request",
          ],
        },
      ],
    },
  ],
};

export default LegalPages;