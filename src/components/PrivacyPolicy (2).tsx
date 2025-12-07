/**
 * Privacy Policy Page
 * Required for Apple App Store and Google Play Store
 * Enhanced with Paradex metallic chrome aesthetic
 */

import { motion } from 'motion/react';
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Trash2, Mail } from 'lucide-react';

export function PrivacyPolicy() {
    const lastUpdated = 'December 5, 2024';

    const sections = [
        {
            icon: Database,
            title: 'Information We Collect',
            content: `We collect minimal information necessary to provide our wallet services:

• **Account Information**: Email address and display name when you create an account
• **Wallet Data**: Your public wallet addresses (we never store private keys on our servers)
• **Guardian Information**: Email addresses of guardians you designate for wallet recovery
• **Device Information**: Device type, operating system, and app version for troubleshooting
• **Usage Analytics**: Anonymous usage patterns to improve our services`
        },
        {
            icon: Lock,
            title: 'How We Protect Your Data',
            content: `Your security is our top priority:

• **End-to-End Encryption**: All sensitive data is encrypted in transit and at rest
• **Zero-Knowledge Architecture**: We cannot access your private keys or seed phrases
• **Biometric Security**: Optional Face ID/Touch ID adds an extra layer of protection
• **Secure Enclaves**: Cryptographic operations happen in device secure enclaves
• **SOC 2 Compliant**: Our infrastructure meets enterprise security standards`
        },
        {
            icon: Eye,
            title: 'How We Use Your Information',
            content: `We use collected information to:

• Provide and maintain wallet services
• Send transaction notifications and security alerts
• Enable guardian-based wallet recovery
• Improve app performance and user experience
• Comply with legal obligations
• Prevent fraud and abuse`
        },
        {
            icon: Shield,
            title: 'Information Sharing',
            content: `We do NOT sell your personal information. We may share data only:

• **With Guardians**: When you initiate recovery, guardians receive recovery requests
• **Service Providers**: Trusted partners who help operate our services (under strict NDAs)
• **Legal Requirements**: When required by law or to protect our rights
• **Blockchain Networks**: Transaction data is public on blockchain networks by design`
        },
        {
            icon: Bell,
            title: 'Your Rights',
            content: `You have the right to:

• **Access**: Request a copy of your personal data
• **Correction**: Update inaccurate information
• **Deletion**: Request deletion of your account and data
• **Portability**: Export your data in a standard format
• **Opt-Out**: Disable non-essential notifications
• **Withdraw Consent**: Revoke permissions at any time`
        },
        {
            icon: Trash2,
            title: 'Data Retention',
            content: `We retain your data as follows:

• **Active Accounts**: Data retained while your account is active
• **Deleted Accounts**: Personal data deleted within 30 days of account deletion
• **Transaction History**: Blockchain transactions are permanent and public
• **Legal Holds**: Data may be retained longer if required by law`
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

                    <h1 className="text-4xl text-white mb-4">Privacy Policy</h1>
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
                        At Paradex ("we", "our", or "us"), we are committed to protecting your privacy.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your
                        information when you use our mobile application and related services (collectively,
                        the "Services"). Please read this policy carefully. By using our Services, you
                        consent to the data practices described in this policy.
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
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ADEF] to-[#0066CC] flex items-center justify-center"
                                    style={{ boxShadow: "0 0 20px rgba(0, 173, 239, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.15)" }}
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

                {/* Contact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 bg-gradient-to-br from-[#00ADEF]/10 to-[#0066CC]/10 border border-[#00ADEF]/30 rounded-2xl p-6"
                    style={{ boxShadow: "0 0 40px rgba(0, 173, 239, 0.15)" }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Mail className="w-6 h-6 text-[#00ADEF]" />
                        <h2 className="text-xl text-white">Contact Us</h2>
                    </div>
                    <p className="text-[#AAAAAA] mb-4">
                        If you have questions about this Privacy Policy or our data practices, please contact us:
                    </p>
                    <ul className="text-[#AAAAAA] space-y-2">
                        <li>Email: <a href="mailto:privacy@paradex.io" className="text-[#00ADEF] hover:underline">privacy@paradex.io</a></li>
                        <li>Website: <a href="https://paradex.io" className="text-[#00ADEF] hover:underline">https://paradex.io</a></li>
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

export default PrivacyPolicy;
