import { useState, memo } from "react";
import { Shield } from "lucide-react";
import { SiX, SiGithub, SiDiscord } from "react-icons/si";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Footer() {
  const [, setLocation] = useLocation();
  const [openModal, setOpenModal] = useState<string | null>(null);

  const modalContent: Record<string, { title: string; content: JSX.Element }> = {
    about: {
      title: "About GuardiaVault",
      content: (
        <div className="space-y-4">
          <p>GuardiaVault is a revolutionary platform for securing cryptocurrency inheritance through blockchain technology and cryptographic precision.</p>
          <p>Our mission is to provide a zero-custody, trustless solution that ensures your digital assets are passed to your beneficiaries according to your wishes.</p>
          <p><strong>Founded:</strong> 2025</p>
          <p><strong>Technology:</strong> Ethereum Smart Contracts, Zero-Knowledge Proofs, Multi-Signature Architecture</p>
        </div>
      ),
    },
    contact: {
      title: "Contact Us",
      content: (
        <div className="space-y-4">
          <p><strong>Email:</strong> support@guardiavault.com</p>
          <p><strong>Support Hours:</strong> 24/7</p>
          <p><strong>Response Time:</strong> Within 24 hours</p>
          <div className="mt-6">
            <p className="font-semibold mb-2">For urgent matters:</p>
            <p>Discord: discord.gg/guardiavault</p>
            <p>Twitter/X: @GuardiaVault</p>
          </div>
        </div>
      ),
    },
    privacy: {
      title: "Privacy Policy",
      content: (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <p><strong>Last Updated:</strong> January 2025</p>
          <h3 className="font-semibold mt-4">Data Collection</h3>
          <p>We collect minimal personal information necessary to provide our services. This includes email addresses and wallet addresses you choose to connect.</p>
          <h3 className="font-semibold mt-4">Blockchain Data</h3>
          <p>All vault and guardian information is stored on-chain. This data is publicly viewable but pseudonymous.</p>
          <h3 className="font-semibold mt-4">Zero-Knowledge Architecture</h3>
          <p>We cannot access your private keys or vault secrets. Your data is encrypted client-side before any transmission.</p>
          <h3 className="font-semibold mt-4">Third-Party Services</h3>
          <p>We use Stripe for payment processing. Stripe's privacy policy applies to payment data.</p>
        </div>
      ),
    },
    terms: {
      title: "Terms & Conditions",
      content: (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <p><strong>Last Updated:</strong> January 2025</p>
          <p className="text-sm italic">PLEASE READ THESE TERMS CAREFULLY BEFORE USING THIS SERVICE</p>
          
          <h3 className="font-semibold mt-4">1. ACCEPTANCE OF TERMS</h3>
          <p>By accessing or using GuardiaVault ("Service"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use this Service.</p>
          
          <h3 className="font-semibold mt-4">2. SERVICE DESCRIPTION</h3>
          <p>GuardiaVault provides blockchain-based digital asset inheritance planning tools. We are a SOFTWARE PLATFORM ONLY and do NOT provide:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Custody or control of your digital assets</li>
            <li>Financial, legal, or tax advice</li>
            <li>Asset recovery services</li>
            <li>Guaranteed inheritance execution</li>
          </ul>
          
          <h3 className="font-semibold mt-4">3. NO CUSTODY - YOU CONTROL YOUR KEYS</h3>
          <p>GuardiaVault is a NON-CUSTODIAL platform. We NEVER have access to, control over, or custody of your private keys, seed phrases, or digital assets. All assets remain under YOUR exclusive control via blockchain smart contracts.</p>
          
          <h3 className="font-semibold mt-4">4. ASSUMPTION OF RISK</h3>
          <p>YOU ACKNOWLEDGE AND ACCEPT THE FOLLOWING RISKS:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Smart Contract Risk:</strong> Bugs, exploits, or vulnerabilities may exist</li>
            <li><strong>Blockchain Risk:</strong> Network failures, forks, or consensus issues</li>
            <li><strong>Key Loss:</strong> Lost keys or fragments are UNRECOVERABLE</li>
            <li><strong>Regulatory Risk:</strong> Laws may change affecting service availability</li>
            <li><strong>Technology Risk:</strong> Failures, errors, or incompatibilities</li>
            <li><strong>Irreversibility:</strong> Blockchain transactions cannot be reversed</li>
          </ul>
          
          <h3 className="font-semibold mt-4">5. USER RESPONSIBILITIES</h3>
          <p>YOU ARE SOLELY RESPONSIBLE FOR:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Securing your private keys and account credentials</li>
            <li>Safeguarding secret fragments shared with guardians</li>
            <li>Verifying all transaction details before confirming</li>
            <li>Understanding smart contract functionality</li>
            <li>Complying with applicable laws and regulations</li>
            <li>Conducting your own legal, tax, and financial due diligence</li>
          </ul>
          
          <h3 className="font-semibold mt-4">6. DISCLAIMER OF WARRANTIES</h3>
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>MERCHANTABILITY</li>
            <li>FITNESS FOR A PARTICULAR PURPOSE</li>
            <li>NON-INFRINGEMENT</li>
            <li>ACCURACY OR RELIABILITY</li>
            <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
          </ul>
          
          <h3 className="font-semibold mt-4">7. LIMITATION OF LIABILITY</h3>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, GUARDIAVAULT AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>ANY LOSS OF DIGITAL ASSETS OR FUNDS</li>
            <li>LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES</li>
            <li>INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
            <li>SMART CONTRACT FAILURES OR EXPLOITS</li>
            <li>BLOCKCHAIN NETWORK ISSUES</li>
            <li>UNAUTHORIZED ACCESS BY THIRD PARTIES</li>
            <li>USER ERROR OR NEGLIGENCE</li>
          </ul>
          <p className="mt-2"><strong>IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED $100 USD OR THE AMOUNT YOU PAID FOR THE SERVICE IN THE PAST 12 MONTHS, WHICHEVER IS LESS.</strong></p>
          
          <h3 className="font-semibold mt-4">8. INDEMNIFICATION</h3>
          <p>You agree to indemnify, defend, and hold harmless GuardiaVault, its officers, directors, employees, and agents from any claims, losses, liabilities, damages, costs, or expenses arising from your use of the Service or violation of these Terms.</p>
          
          <h3 className="font-semibold mt-4">9. NO FINANCIAL OR LEGAL ADVICE</h3>
          <p>GuardiaVault does not provide financial, legal, tax, or investment advice. Consult qualified professionals before making decisions regarding digital asset inheritance.</p>
          
          <h3 className="font-semibold mt-4">10. PROHIBITED USES</h3>
          <p>You may NOT use the Service to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Engage in illegal activities or money laundering</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe intellectual property rights</li>
            <li>Transmit malware or harmful code</li>
            <li>Attempt to exploit or attack the platform</li>
          </ul>
          
          <h3 className="font-semibold mt-4">11. TERMINATION</h3>
          <p>We reserve the right to suspend or terminate your access at any time, with or without cause or notice. Upon termination, your blockchain vaults remain accessible via your private keys.</p>
          
          <h3 className="font-semibold mt-4">12. DISPUTE RESOLUTION & ARBITRATION</h3>
          <p>Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive the right to participate in class action lawsuits.</p>
          
          <h3 className="font-semibold mt-4">13. GOVERNING LAW</h3>
          <p>These Terms are governed by the laws of Delaware, USA, without regard to conflict of law provisions.</p>
          
          <h3 className="font-semibold mt-4">14. SEVERABILITY</h3>
          <p>If any provision is found unenforceable, the remaining provisions remain in full force and effect.</p>
          
          <h3 className="font-semibold mt-4">15. ENTIRE AGREEMENT</h3>
          <p>These Terms constitute the entire agreement between you and GuardiaVault regarding the Service.</p>
          
          <h3 className="font-semibold mt-4">16. CHANGES TO TERMS</h3>
          <p>We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance.</p>
          
          <p className="mt-6 p-4 bg-destructive/10 border border-destructive rounded"><strong>IMPORTANT:</strong> BY USING THIS SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. YOU UNDERSTAND THAT DIGITAL ASSETS ARE HIGHLY VOLATILE AND RISKY, AND YOU MAY LOSE YOUR ENTIRE INVESTMENT.</p>
        </div>
      ),
    },
    security: {
      title: "Security",
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold">Multi-Layered Security</h3>
          <p>GuardiaVault employs military-grade security measures:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Smart Contract Audits:</strong> Audited by leading security firms</li>
            <li><strong>Zero-Knowledge Proofs:</strong> Client-side encryption</li>
            <li><strong>Multi-Signature:</strong> Guardian-based verification</li>
            <li><strong>Time-Locks:</strong> Configurable activation delays</li>
            <li><strong>No Custody:</strong> You always control your keys</li>
          </ul>
          <p className="mt-4"><strong>Bug Bounty:</strong> Report vulnerabilities to security@guardiavault.com</p>
        </div>
      ),
    },
    compliance: {
      title: "Compliance",
      content: (
        <div className="space-y-4">
          <p>GuardiaVault operates in compliance with applicable regulations:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>GDPR:</strong> Full compliance with EU data protection</li>
            <li><strong>CCPA:</strong> California privacy rights respected</li>
            <li><strong>KYC/AML:</strong> Not required (non-custodial service)</li>
            <li><strong>Regulatory Status:</strong> Software provider, not a financial institution</li>
          </ul>
          <p className="mt-4">As a non-custodial platform, GuardiaVault does not hold user funds and is not subject to money transmitter regulations.</p>
        </div>
      ),
    },
    careers: {
      title: "Careers",
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold">Join Our Team</h3>
          <p>We're building the future of digital inheritance. We're looking for passionate individuals who believe in decentralization and user sovereignty.</p>
          <h3 className="font-semibold mt-4">Open Positions:</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Senior Smart Contract Engineer</li>
            <li>Full-Stack Developer (React/Node)</li>
            <li>Security Researcher</li>
            <li>Community Manager</li>
          </ul>
          <p className="mt-4"><strong>Contact:</strong> careers@guardiavault.com</p>
        </div>
      ),
    },
    blog: {
      title: "Blog",
      content: (
        <div className="space-y-4">
          <p>Coming soon! Our blog will feature:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Crypto inheritance best practices</li>
            <li>Technical deep-dives</li>
            <li>Security updates</li>
            <li>Product announcements</li>
          </ul>
          <p className="mt-4">Subscribe to our newsletter to get notified when we launch.</p>
        </div>
      ),
    },
    documentation: {
      title: "Documentation",
      content: (
        <div className="space-y-4">
          <h3 className="font-semibold">Getting Started</h3>
          <p>Learn how to use GuardiaVault:</p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Connect your wallet (MetaMask recommended)</li>
            <li>Create a vault and deposit assets</li>
            <li>Designate guardians and beneficiaries</li>
            <li>Configure check-in schedule</li>
            <li>Share encrypted fragments with guardians</li>
          </ol>
          <p className="mt-4"><strong>Smart Contract Docs:</strong> docs.guardiavault.com</p>
          <p><strong>API Reference:</strong> api.guardiavault.com</p>
        </div>
      ),
    },
  };

  const links = {
    product: [
      { label: "Features", action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { label: "Pricing", action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { label: "Security", action: () => setOpenModal("security") },
      { label: "Documentation", action: () => setOpenModal("documentation") },
    ],
    company: [
      { label: "About", action: () => setOpenModal("about") },
      { label: "Blog", action: () => setOpenModal("blog") },
      { label: "Careers", action: () => setOpenModal("careers") },
      { label: "Contact", action: () => setOpenModal("contact") },
    ],
    legal: [
      { label: "Privacy", action: () => setLocation("/legal/privacy") },
      { label: "Terms", action: () => setLocation("/legal/terms") },
      { label: "Risk Disclosure", action: () => setLocation("/legal/risk-disclosure") },
      { label: "All Legal Docs", action: () => setLocation("/legal") },
    ],
  };

  return (
    <footer className="bg-card border-t border-card-border">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-10 md:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold font-display">GuardiaVault</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Securing crypto inheritance with cryptographic precision and
              zero-custody architecture.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#twitter"
                className="p-2 rounded-lg bg-muted hover-elevate active-elevate-2"
                data-testid="link-twitter"
                aria-label="Follow us on X (Twitter)"
              >
                <SiX className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="#github"
                className="p-2 rounded-lg bg-muted hover-elevate active-elevate-2"
                data-testid="link-github"
                aria-label="View our GitHub repository"
              >
                <SiGithub className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="#discord"
                className="p-2 rounded-lg bg-muted hover-elevate active-elevate-2"
                data-testid="link-discord"
                aria-label="Join our Discord community"
              >
                <SiDiscord className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.action}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.action}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.action}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 GuardiaVault. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with cryptographic precision
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {Object.entries(modalContent).map(([key, { title, content }]) => (
        <Dialog key={key} open={openModal === key} onOpenChange={(open) => !open && setOpenModal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">{title}</DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <div className="text-foreground">{content}</div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      ))}
    </footer>
  );
}

export default memo(Footer);
