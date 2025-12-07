import { AlertTriangle, Scale, Shield } from "lucide-react";

export default function LegalAdvisorySection() {
  return (
    <section className="relative py-16 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Scale className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Legal Advisory & Risk Disclosure
            </h2>
          </div>

          {/* Main Content */}
          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            {/* Important Notice */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-300 mb-2">
                    IMPORTANT: GuardiaVault is a technology platform, not a financial institution, investment advisor, or legal service provider.
                  </p>
                  <p className="text-amber-200/90">
                    This platform facilitates digital inheritance management and yield generation services. You should consult with qualified professionals before making any financial, legal, or estate planning decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* No Financial Advice */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                1. No Financial, Legal, or Tax Advice
              </h3>
              <p className="mb-2">
                GuardiaVault does NOT provide:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                <li>Financial advice or investment recommendations</li>
                <li>Legal advice or estate planning services</li>
                <li>Tax advice or tax planning</li>
                <li>Investment suitability assessments</li>
                <li>Guarantees of returns or performance</li>
              </ul>
              <p className="mt-3">
                <strong className="text-white">You must consult with qualified professionals</strong> (licensed financial advisors, attorneys, CPAs) before:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400 mt-2">
                <li>Participating in yield generation, staking, or DeFi protocols</li>
                <li>Creating inheritance plans or designating beneficiaries</li>
                <li>Making estate planning decisions</li>
                <li>Handling cryptocurrency assets</li>
                <li>Determining tax implications of your activities</li>
              </ul>
            </div>

            {/* Yield Generation & Staking Risks */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                2. Yield Generation, Staking & DeFi Risks
              </h3>
              <p className="mb-3">
                <strong className="text-white">CRITICAL WARNINGS:</strong>
              </p>
              
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="font-semibold text-red-300 mb-2">Principal Loss Risk</p>
                  <p className="text-slate-300">
                    <strong>You can lose your entire principal investment.</strong> Yield generation, staking, and DeFi protocols carry significant risk of total loss. Past performance does not guarantee future results. APY rates are estimates and subject to change.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Smart Contract Risks</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                    <li>Smart contracts may contain bugs, vulnerabilities, or exploits</li>
                    <li>Protocols may be hacked, resulting in total loss of funds</li>
                    <li>Smart contracts are immutable and cannot be changed after deployment</li>
                    <li>Code audits do not guarantee security</li>
                    <li>New vulnerabilities may be discovered after deployment</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Protocol & Liquidity Risks</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                    <li>DeFi protocols may fail, become insolvent, or shut down</li>
                    <li>Liquidity pools may experience impermanent loss</li>
                    <li>Staking validators may be slashed, resulting in loss of staked assets</li>
                    <li>Protocol changes may affect yields or access to funds</li>
                    <li>Third-party protocols (Lido, Aave, Compound, etc.) are independent and carry their own risks</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Market & Volatility Risks</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                    <li>Cryptocurrency markets are highly volatile</li>
                    <li>Asset values can decrease significantly or become worthless</li>
                    <li>Yields are not guaranteed and may decrease or become negative</li>
                    <li>Market conditions may prevent withdrawal or access to funds</li>
                    <li>Regulatory changes may affect protocol operations</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white mb-2">Technical & Operational Risks</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                    <li>Blockchain networks may experience congestion, delays, or failures</li>
                    <li>Transaction fees may exceed expected returns</li>
                    <li>Network upgrades or forks may affect protocol functionality</li>
                    <li>Integration with third-party protocols may fail</li>
                    <li>Technical errors may result in loss of funds</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cryptocurrency Risks */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                3. Cryptocurrency & Blockchain Risks
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                <li><strong className="text-white">Irreversibility:</strong> Blockchain transactions cannot be reversed. Lost or stolen assets may be unrecoverable.</li>
                <li><strong className="text-white">Regulatory Uncertainty:</strong> Cryptocurrency regulations vary by jurisdiction and may change, affecting your ability to use or access services.</li>
                <li><strong className="text-white">No Insurance:</strong> Cryptocurrency assets are not insured by FDIC, SIPC, or any government agency.</li>
                <li><strong className="text-white">Tax Implications:</strong> Yield generation, staking, and DeFi activities may have tax consequences. Consult a tax professional.</li>
                <li><strong className="text-white">Technology Risks:</strong> Wallets may be compromised, private keys may be lost, and networks may experience issues.</li>
              </ul>
            </div>

            {/* Platform Limitations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                4. Platform Limitations & Disclaimers
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                <li><strong className="text-white">No Custody:</strong> GuardiaVault does NOT custody your cryptocurrency. Assets remain in your wallets or third-party protocols.</li>
                <li><strong className="text-white">No Guarantees:</strong> We do not guarantee yields, returns, or that beneficiaries will receive assets.</li>
                <li><strong className="text-white">Third-Party Services:</strong> Integration with protocols like Lido, Aave, and Compound is provided "as-is." We are not responsible for third-party protocol failures.</li>
                <li><strong className="text-white">No Warranty:</strong> Services are provided "as-is" without warranties of any kind, express or implied.</li>
                <li><strong className="text-white">Use at Your Own Risk:</strong> You are solely responsible for understanding risks and making informed decisions.</li>
              </ul>
            </div>

            {/* Regulatory & Compliance */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                5. Regulatory & Compliance
              </h3>
              <p className="mb-2">
                <strong className="text-white">You are responsible for:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                <li>Complying with all applicable laws and regulations in your jurisdiction</li>
                <li>Determining whether yield generation, staking, or DeFi activities are legal in your jurisdiction</li>
                <li>Reporting taxable events to appropriate tax authorities</li>
                <li>Obtaining necessary licenses or approvals if required</li>
                <li>Understanding and complying with securities laws, if applicable</li>
              </ul>
              <p className="mt-3 text-slate-300">
                GuardiaVault may not be available in all jurisdictions. Some services may be restricted based on your location.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                6. Limitation of Liability
              </h3>
              <p className="mb-2 text-slate-300">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, GUARDIAVAULT SHALL NOT BE LIABLE FOR:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                <li>Loss of cryptocurrency assets or principal</li>
                <li>Loss of yields, staking rewards, or expected returns</li>
                <li>Smart contract bugs, exploits, or protocol failures</li>
                <li>Third-party protocol failures (Lido, Aave, Compound, etc.)</li>
                <li>Blockchain network failures or congestion</li>
                <li>Regulatory changes or enforcement actions</li>
                <li>Tax liabilities or penalties</li>
                <li>Incorrect beneficiary designations or inheritance disputes</li>
                <li>Any indirect, incidental, special, or consequential damages</li>
              </ul>
            </div>

            {/* Professional Advice Required */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-300 mb-2">
                7. Professional Advice Required
              </h3>
              <p className="text-blue-200/90">
                <strong>BEFORE USING GUARDIAVAULT FOR YIELD GENERATION, STAKING, OR ESTATE PLANNING, CONSULT WITH:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-blue-200/80 mt-2">
                <li>A licensed financial advisor familiar with cryptocurrency and DeFi</li>
                <li>An attorney specializing in estate planning and cryptocurrency law</li>
                <li>A certified public accountant familiar with cryptocurrency taxation</li>
                <li>A cryptocurrency or DeFi expert, if needed</li>
              </ul>
            </div>

            {/* Acknowledgment */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mt-6">
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-white">BY USING GUARDIAVAULT, YOU ACKNOWLEDGE THAT:</strong> You have read, understood, and accept this Legal Advisory & Risk Disclosure. You understand the significant risks involved in cryptocurrency, yield generation, staking, and DeFi activities. You are using GuardiaVault at your own risk and have consulted (or will consult) with qualified professionals. You accept that GuardiaVault is not responsible for any losses, damages, or liabilities arising from your use of the platform or third-party protocols.
              </p>
            </div>

            {/* Links */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">
                For complete terms, please review our{" "}
                <a href="/legal/terms" className="text-blue-400 hover:text-blue-300 underline">
                  Terms of Service
                </a>
                ,{" "}
                <a href="/legal/disclaimer" className="text-blue-400 hover:text-blue-300 underline">
                  Legal Disclaimer
                </a>
                , and{" "}
                <a href="/legal/risk-disclosure" className="text-blue-400 hover:text-blue-300 underline">
                  Risk Disclosure
                </a>
                .
              </p>
              <p className="text-xs text-slate-500">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

