/**
 * Terms of Service Page
 * Required for Apple App Store and Google Play Store
 * Enhanced with Paradex metallic chrome aesthetic
 */

import { motion } from 'motion/react';
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Ban, RefreshCw, Gavel } from 'lucide-react';

export function TermsOfService() {
    const lastUpdated = 'December 5, 2024';

    const sections = [
        {
            icon: FileText,
            title: '1. Acceptance of Terms',
            content: `By accessing or using Paradex ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.

These Terms constitute a legally binding agreement between you and Paradex regarding your use of the App and related services. We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the modified Terms.`
        },
        {
            icon: Shield,
            title: '2. Description of Services',
            content: `Paradex is a self-custody cryptocurrency wallet that allows you to:

• Store, send, and receive digital assets
• Manage multiple blockchain accounts
• Connect to decentralized applications (dApps)
• Set up guardian-based wallet recovery
• Enable biometric authentication

**Important**: Paradex is a non-custodial wallet. We do not hold, control, or have access to your private keys, seed phrases, or digital assets. You are solely responsible for securing your wallet.`
        },
        {
            icon: AlertTriangle,
            title: '3. Risks and Disclaimers',
            content: `**Cryptocurrency Risks**: Digital assets are highly volatile. You may lose some or all of your investment. Past performance is not indicative of future results.

**Security Risks**: Despite our security measures, no system is 100% secure. You acknowledge the risks of cyberattacks, hacking, and unauthorized access.

**Network Risks**: Blockchain networks may experience congestion, forks, or failures that could affect your transactions.

**Regulatory Risks**: Cryptocurrency regulations vary by jurisdiction and may change. You are responsible for compliance with applicable laws.

**NO FINANCIAL ADVICE**: Nothing in the App constitutes financial, investment, legal, or tax advice. Consult qualified professionals before making financial decisions.`
        },
        {
            icon: Scale,
            title: '4. User Responsibilities',
            content: `By using Paradex, you agree to:

• **Secure Your Wallet**: Safely store your seed phrase and never share it with anyone
• **Verify Transactions**: Double-check all transaction details before confirming
• **Legal Compliance**: Use the App only for lawful purposes
• **Age Requirement**: Be at least 18 years old or the legal age in your jurisdiction
• **Accurate Information**: Provide accurate information when creating an account
• **Guardian Selection**: Choose trustworthy guardians if using guardian recovery

You acknowledge that losing your seed phrase or private keys may result in permanent loss of access to your digital assets.`
        },
        {
            icon: Ban,
            title: '5. Prohibited Uses',
            content: `You agree NOT to use Paradex for:

• Money laundering, terrorist financing, or other illegal activities
• Fraud, scams, or deceptive practices
• Circumventing sanctions or export controls
• Interfering with or disrupting the App's functionality
• Attempting to gain unauthorized access to our systems
• Violating the intellectual property rights of others
• Distributing malware, viruses, or harmful code
• Any activity that violates applicable laws or regulations`
        },
        {
            icon: RefreshCw,
            title: '6. Service Modifications',
            content: `We reserve the right to:

• Modify, suspend, or discontinue any part of the App at any time
• Update these Terms with reasonable notice
• Limit certain features or functionality
• Terminate accounts that violate these Terms

We will make reasonable efforts to notify users of significant changes, but you are responsible for reviewing the Terms periodically.`
        },
        {
            icon: Gavel,
            title: '7. Limitation of Liability',
            content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

**Disclaimer of Warranties**: The App is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied.

**Limitation of Damages**: In no event shall Paradex be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or digital assets.

**Maximum Liability**: Our total liability shall not exceed the amount you paid us (if any) in the twelve months preceding the claim.

**Indemnification**: You agree to indemnify and hold harmless Paradex from any claims arising from your use of the App or violation of these Terms.`
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-[#888888] hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </a>

                    <h1 className="text-4xl text-white mb-4">Terms of Service</h1>
                    <p className="text-[#888888]">
                        Last updated: {lastUpdated}
                    </p>
                </motion.div>

                {/* Introduction */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-6 mb-8"
                    style={{
                        background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    }}
                >
                    <p className="text-[#AAAAAA] leading-relaxed">
                        Welcome to Paradex. These Terms of Service govern your use of the Paradex
                        mobile application and related services. Please read them carefully before
                        using our services. Your access to and use of the services is conditioned
                        on your acceptance of and compliance with these Terms.
                    </p>
                </motion.div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-6"
                            style={{
                                background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
                                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                            }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DC143C] to-[#A01030] flex items-center justify-center"
                                    style={{ boxShadow: "0 0 20px rgba(220, 20, 60, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.15)" }}
                                >
                                    <section.icon className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl text-white">{section.title}</h2>
                            </div>
                            <div className="text-[#AAAAAA] leading-relaxed whitespace-pre-line">
                                {section.content}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Governing Law */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-6"
                    style={{
                        background: "linear-gradient(145deg, #0D0D0D 0%, #1A1A1A 100%)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    }}
                >
                    <h2 className="text-xl text-white mb-4">8. Governing Law</h2>
                    <p className="text-[#AAAAAA]">
                        These Terms shall be governed by and construed in accordance with the laws of the
                        State of Delaware, United States, without regard to its conflict of law provisions.
                        Any disputes arising under these Terms shall be resolved through binding arbitration
                        in accordance with the rules of the American Arbitration Association.
                    </p>
                </motion.div>

                {/* Contact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="mt-8 bg-gradient-to-br from-[#DC143C]/10 to-[#A01030]/10 border border-[#DC143C]/30 rounded-2xl p-6"
                    style={{ boxShadow: "0 0 40px rgba(220, 20, 60, 0.15)" }}
                >
                    <h2 className="text-xl text-white mb-4">Contact Information</h2>
                    <p className="text-[#AAAAAA] mb-4">
                        For questions about these Terms of Service, please contact us:
                    </p>
                    <ul className="text-[#AAAAAA] space-y-2">
                        <li>Email: <a href="mailto:legal@paradex.io" className="text-[#DC143C] hover:underline">legal@paradex.io</a></li>
                        <li>Website: <a href="https://paradex.io" className="text-[#DC143C] hover:underline">https://paradex.io</a></li>
                    </ul>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-[#666666] text-sm mt-12"
                >
                    © {new Date().getFullYear()} Paradex. All rights reserved.
                </motion.p>
            </div>
        </div>
    );
}

export default TermsOfService;
