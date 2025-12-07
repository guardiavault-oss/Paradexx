import { ArrowLeft } from "lucide-react";
import FlowingShaderBackground from "../FlowingShaderBackground";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="relative w-full min-h-screen overflow-auto bg-black">
      <FlowingShaderBackground />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-8 text-white/60 hover:text-white transition-colors"
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "clamp(48px, 8vw, 72px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "transparent",
              background: "linear-gradient(180deg, #E0E0E0 0%, #FFFFFF 20%, #888888 45%, #444444 50%, #CCCCCC 70%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "16px",
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "0.05em",
            }}
          >
            Last Updated: December 6, 2024
          </p>
        </div>

        {/* Content */}
        <div
          className="space-y-8 p-8 rounded-2xl border border-white/10"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Section title="1. Introduction">
            <p>
              At Paradex, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our non-custodial cryptocurrency wallet application. By using Paradex, you agree to the collection and use of information in accordance with this policy.
            </p>
          </Section>

          <Section title="2. Non-Custodial Nature">
            <p>
              As a non-custodial wallet service:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li><strong>We do not have access to your private keys or seed phrases</strong></li>
              <li>Your wallet credentials are stored locally on your device only</li>
              <li>We cannot view your wallet balance or transaction history</li>
              <li>We cannot initiate transactions on your behalf</li>
              <li>Your cryptocurrency assets remain under your sole control</li>
            </ul>
          </Section>

          <Section title="3. Information We Collect">
            <h3 className="text-white font-semibold mt-4 mb-2">3.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address (if you create an account)</li>
              <li>Guardian contact information (if you opt into Guardian Recovery)</li>
              <li>Profile preferences (Degen/Regen tribe selection)</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-white font-semibold mt-4 mb-2">3.2 Information Automatically Collected</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device information (operating system, browser type)</li>
              <li>Usage analytics (feature usage, interaction patterns)</li>
              <li>IP address and general location data</li>
              <li>Error logs and performance data</li>
            </ul>

            <h3 className="text-white font-semibold mt-4 mb-2">3.3 Blockchain Data</h3>
            <p className="mt-2">
              When you interact with blockchain networks, certain information is publicly available on the blockchain, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Your wallet address</li>
              <li>Transaction amounts and timestamps</li>
              <li>Smart contract interactions</li>
              <li>Token holdings and transfers</li>
            </ul>
            <p className="mt-2 text-yellow-400">
              Note: This blockchain data is not collected by Paradex but is inherently public on blockchain networks.
            </p>
          </Section>

          <Section title="4. How We Use Your Information">
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Provide and maintain the Platform's functionality</li>
              <li>Improve user experience and develop new features</li>
              <li>Send important updates about the Platform</li>
              <li>Provide customer support</li>
              <li>Detect and prevent fraud or security issues</li>
              <li>Comply with legal obligations</li>
              <li>Facilitate Guardian Recovery processes (if enabled)</li>
              <li>Personalize your experience (Degen/Regen preferences)</li>
            </ul>
          </Section>

          <Section title="5. Guardian Recovery System">
            <p>
              If you opt into our Guardian Recovery feature:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>We store encrypted shards of your recovery information</li>
              <li>Guardian contact information is encrypted and stored securely</li>
              <li>We facilitate communication between you and your guardians</li>
              <li>Recovery requests are logged for security purposes</li>
              <li>No single party (including Paradex) can access your full recovery information</li>
            </ul>
          </Section>

          <Section title="6. Data Storage and Security">
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure servers with regular security audits</li>
              <li>Limited employee access to user data</li>
              <li>Regular backups and disaster recovery procedures</li>
              <li>Two-factor authentication (2FA) support</li>
            </ul>
            <p className="mt-4 text-yellow-400">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>
              Paradex integrates with various third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Blockchain network nodes and RPC providers</li>
              <li>Price feed APIs and market data providers</li>
              <li>Analytics services (anonymized usage data)</li>
              <li>Cloud infrastructure providers</li>
            </ul>
            <p className="mt-4">
              These third parties have their own privacy policies. We recommend reviewing their policies before using integrated features.
            </p>
          </Section>

          <Section title="8. Data Sharing">
            <p>
              We do not sell or rent your personal information. We may share data only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
              <li><strong>Guardian Recovery:</strong> With designated guardians for recovery purposes</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Service Providers:</strong> With trusted partners who assist in platform operations</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </Section>

          <Section title="9. Your Rights and Choices">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
              <li>Disable analytics tracking</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at <span className="text-cyan-400">privacy@paradex.app</span>
            </p>
          </Section>

          <Section title="10. Data Retention">
            <p>
              We retain your information for as long as necessary to provide services and comply with legal obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Account information: Until you request deletion</li>
              <li>Transaction logs: As required by financial regulations</li>
              <li>Support communications: For a reasonable period after resolution</li>
              <li>Analytics data: Aggregated and anonymized after 90 days</li>
            </ul>
          </Section>

          <Section title="11. Children's Privacy">
            <p>
              Paradex is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </Section>

          <Section title="12. International Data Transfers">
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using Paradex, you consent to such transfers.
            </p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Platform. Continued use of Paradex after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="mt-4 space-y-1">
              <p>Email: <span className="text-cyan-400">privacy@paradex.app</span></p>
              <p>Legal: <span className="text-cyan-400">legal@paradex.app</span></p>
              <p>Support: <span className="text-cyan-400">support@paradex.app</span></p>
            </div>
          </Section>
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h2
        className="mb-4"
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "24px",
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "16px",
          lineHeight: 1.8,
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
