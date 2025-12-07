import { ArrowLeft } from "lucide-react";
import FlowingShaderBackground from "../FlowingShaderBackground";

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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
            Terms of Service
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
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing and using Paradex ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </Section>

          <Section title="2. Non-Custodial Wallet Service">
            <p>
              Paradex is a non-custodial cryptocurrency wallet application. This means:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>We do not store, have access to, or control your private keys or seed phrases</li>
              <li>You are solely responsible for maintaining the security of your wallet credentials</li>
              <li>We cannot recover, reset, or retrieve your private keys if lost</li>
              <li>You acknowledge that loss of your private keys means permanent loss of access to your assets</li>
              <li>All transactions are executed directly on the blockchain and are irreversible</li>
            </ul>
          </Section>

          <Section title="3. Guardian Recovery (Optional)">
            <p>
              If you opt to use our Guardian Recovery feature during signup:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>You may designate trusted guardians who can assist in wallet recovery</li>
              <li>Guardians hold encrypted shards of your recovery information</li>
              <li>Recovery requires approval from a threshold of your designated guardians</li>
              <li>You are responsible for maintaining relationships with your guardians</li>
              <li>We facilitate communication but do not control the recovery process</li>
            </ul>
          </Section>

          <Section title="4. User Responsibilities">
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Keep your seed phrase, private keys, and passwords secure and confidential</li>
              <li>Never share your credentials with anyone, including Paradex support</li>
              <li>Verify all transaction details before confirming</li>
              <li>Understand the risks associated with cryptocurrency transactions</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
              <li>Use the Platform at your own risk</li>
            </ul>
          </Section>

          <Section title="5. Prohibited Activities">
            <p>You may not use the Platform to:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Engage in any illegal activities or money laundering</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Attempt to gain unauthorized access to the Platform or other users' wallets</li>
              <li>Interfere with or disrupt the Platform's functionality</li>
              <li>Use the Platform for any fraudulent or malicious purpose</li>
            </ul>
          </Section>

          <Section title="6. Risks and Disclaimers">
            <p>
              You acknowledge and accept the following risks:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Cryptocurrency markets are highly volatile and unpredictable</li>
              <li>Transactions on the blockchain are irreversible</li>
              <li>Smart contract interactions may contain unknown vulnerabilities</li>
              <li>Network fees (gas) can fluctuate significantly</li>
              <li>We are not responsible for losses due to market conditions, user error, or technical issues</li>
            </ul>
          </Section>

          <Section title="7. No Financial Advice">
            <p>
              Paradex does not provide financial, investment, or trading advice. All features, including assessments and recommendations, are for informational purposes only. You should conduct your own research and consult with qualified professionals before making financial decisions.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Paradex and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Platform.
            </p>
          </Section>

          <Section title="9. Modifications to Service">
            <p>
              We reserve the right to modify, suspend, or discontinue the Platform (or any part thereof) at any time with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the service.
            </p>
          </Section>

          <Section title="10. Third-Party Services">
            <p>
              The Platform may integrate with third-party services, protocols, and decentralized applications. We are not responsible for the functionality, security, or reliability of these third-party services. Your use of third-party services is at your own risk.
            </p>
          </Section>

          <Section title="11. Intellectual Property">
            <p>
              All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, and software, are the exclusive property of Paradex and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Paradex operates, without regard to its conflict of law provisions.
            </p>
          </Section>

          <Section title="13. Contact Information">
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              <span className="text-cyan-400">legal@paradex.app</span>
            </p>
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
