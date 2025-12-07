import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShaderBackground } from './ShaderBackground';
import logoImage from 'figma:asset/306e2061f29e3889bf71aa552b80f03f126168a8.png';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      setError('Please accept the Terms and Conditions to continue.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Simulate login with credentials check
    setTimeout(() => {
      if (email === 'demo@mevguard.co' && password === 'asdzxc2564') {
        setIsLoading(false);
        onLogin();
      } else {
        setIsLoading(false);
        setError('Invalid email or password. Please try again.');
      }
    }, 1500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Animated Shader Background */}
      <ShaderBackground />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <ImageWithFallback 
            src={logoImage} 
            alt="MEVGUARD Logo" 
            className="w-64 h-auto mx-auto mb-4"
          />
        </div>

        {/* Login Card */}
        <Card className="p-8 bg-[#1a1a1a]/50 border-[#2a2a2a] backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-white">Welcome Back</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Label className="text-gray-300 mb-2">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 mb-2">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded border-[#2a2a2a] bg-[#0f0f0f] text-emerald-600" />
                Remember me
              </label>
              <a href="#" className="text-emerald-500 hover:text-emerald-400">
                Forgot password?
              </a>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id="terms-checkbox"
                className="rounded border-[#2a2a2a] bg-[#0f0f0f] text-emerald-600 mt-0.5 flex-shrink-0"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="terms-checkbox" className="text-gray-400">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-emerald-500 hover:text-emerald-400 underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                >
                  Terms and Conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-emerald-500 hover:text-emerald-400 underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyModal(true);
                  }}
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-black font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
            <p className="text-center text-gray-400 text-sm">
              Don't have an account?{' '}
              <a href="#" className="text-emerald-500 hover:text-emerald-400 font-medium">
                Contact Sales
              </a>
            </p>
          </div>
        </Card>
      </div>

      {/* Terms and Conditions Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Terms and Conditions</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-gray-400 text-sm">
              <p className="text-gray-300">
                <strong>Last Updated: November 18, 2025</strong>
              </p>

              <section>
                <h3 className="text-white mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using MEVGUARD ("Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, you should not access or use the Service.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">2. Description of Service</h3>
                <p>
                  MEVGUARD provides MEV (Maximal Extractable Value) protection services for blockchain transactions across multiple networks including but not limited to Ethereum, Polygon, BSC, and Arbitrum. The Service includes:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Real-time threat detection and prevention</li>
                  <li>Private mempool transaction routing</li>
                  <li>Integration with private relays (Flashbots, MEV-Share, Eden Network)</li>
                  <li>Transaction monitoring and analytics</li>
                  <li>API access for programmatic protection</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white mb-2">3. User Obligations</h3>
                <p>You agree to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Use the Service in compliance with all applicable laws and regulations</li>
                  <li>Not use the Service for any illegal or unauthorized purpose</li>
                  <li>Not attempt to bypass, disable, or interfere with security-related features</li>
                  <li>Not use the Service to manipulate markets or engage in fraudulent activities</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white mb-2">4. Service Availability</h3>
                <p>
                  While we strive to maintain 99.9% uptime, MEVGUARD does not guarantee uninterrupted or error-free service. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">5. Fees and Payment</h3>
                <p>
                  Use of certain features of the Service may require payment of fees. All fees are non-refundable unless otherwise stated. We reserve the right to change our pricing structure at any time with 30 days notice to existing customers.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">6. Limitation of Liability</h3>
                <p>
                  MEVGUARD provides MEV protection services on a "best effort" basis. While we employ advanced detection and prevention mechanisms, we cannot guarantee 100% protection against all MEV attacks. The Service is provided "AS IS" without warranties of any kind.
                </p>
                <p className="mt-2">
                  In no event shall MEVGUARD be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">7. Intellectual Property</h3>
                <p>
                  All content, features, and functionality of the Service are owned by MEVGUARD and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">8. Termination</h3>
                <p>
                  We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">9. Governing Law</h3>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which MEVGUARD operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">10. Contact Information</h3>
                <p>
                  For questions about these Terms, please contact us at:{' '}
                  <a href="mailto:legal@mevguard.io" className="text-emerald-500 hover:text-emerald-400">
                    legal@mevguard.io
                  </a>
                </p>
              </section>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
            <Button
              variant="outline"
              onClick={() => setShowTermsModal(false)}
              className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setAgreedToTerms(true);
                setShowTermsModal(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Accept Terms
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-gray-400 text-sm">
              <p className="text-gray-300">
                <strong>Last Updated: November 18, 2025</strong>
              </p>

              <section>
                <h3 className="text-white mb-2">1. Introduction</h3>
                <p>
                  MEVGUARD ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our MEV protection services.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">2. Information We Collect</h3>
                <p className="mb-2"><strong className="text-gray-300">Account Information:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Email address and name</li>
                  <li>Company information (if applicable)</li>
                  <li>Billing and payment information</li>
                  <li>Communication preferences</li>
                </ul>
                <p className="mt-3 mb-2"><strong className="text-gray-300">Transaction Data:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Blockchain addresses (wallet addresses)</li>
                  <li>Transaction hashes and metadata</li>
                  <li>Network and protocol information</li>
                  <li>MEV threat detection data</li>
                  <li>Protection statistics and analytics</li>
                </ul>
                <p className="mt-3 mb-2"><strong className="text-gray-300">Usage Information:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>API usage logs and patterns</li>
                  <li>Dashboard activity and preferences</li>
                  <li>Device and browser information</li>
                  <li>IP addresses and access times</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white mb-2">3. How We Use Your Information</h3>
                <p>We use the collected information to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide and maintain our MEV protection services</li>
                  <li>Process transactions and prevent fraudulent activity</li>
                  <li>Detect and mitigate MEV threats in real-time</li>
                  <li>Improve our algorithms and protection mechanisms</li>
                  <li>Send important service notifications and updates</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Comply with legal obligations and regulatory requirements</li>
                  <li>Generate anonymized analytics and research</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white mb-2">4. Data Sharing and Disclosure</h3>
                <p className="mb-2">We do not sell your personal information. We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-gray-300">Service Providers:</strong> Third-party vendors who help us operate our service (cloud hosting, analytics, payment processing)</li>
                  <li><strong className="text-gray-300">Relay Partners:</strong> Private relay networks (Flashbots, MEV-Share, Eden Network) for transaction routing</li>
                  <li><strong className="text-gray-300">Legal Requirements:</strong> When required by law, court order, or government request</li>
                  <li><strong className="text-gray-300">Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white mb-2">5. Data Security</h3>
                <p>
                  We implement industry-standard security measures to protect your information, including:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure socket layer (SSL) technology</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Encrypted backups and disaster recovery procedures</li>
                </ul>
                <p className="mt-2">
                  However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">6. Data Retention</h3>
                <p>
                  We retain your information for as long as necessary to provide our services and comply with legal obligations. Transaction data may be retained for analytical and compliance purposes according to applicable regulations.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">7. Your Privacy Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your data (subject to legal requirements)</li>
                  <li>Object to or restrict certain processing activities</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white mb-2">8. Cookies and Tracking</h3>
                <p>
                  We use cookies and similar tracking technologies to improve user experience, analyze usage patterns, and maintain session information. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">9. International Data Transfers</h3>
                <p>
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">10. Children's Privacy</h3>
                <p>
                  Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">11. Changes to This Policy</h3>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h3 className="text-white mb-2">12. Contact Us</h3>
                <p>
                  For questions about this Privacy Policy or to exercise your privacy rights, contact us at:{' '}
                  <a href="mailto:privacy@mevguard.io" className="text-emerald-500 hover:text-emerald-400">
                    privacy@mevguard.io
                  </a>
                </p>
              </section>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
            <Button
              variant="outline"
              onClick={() => setShowPrivacyModal(false)}
              className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setAgreedToTerms(true);
                setShowPrivacyModal(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Accept Policy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}