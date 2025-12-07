/**
 * Guardian Education Component
 * Provides templates, FAQ, and educational materials for guardians
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle2, HelpCircle, FileText, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GuardianEducationProps {
  vaultOwnerName?: string;
  vaultName?: string;
}

export default function GuardianEducation({ vaultOwnerName = "Sarah", vaultName = "My Vault" }: GuardianEducationProps) {
  const { toast } = useToast();
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const messageTemplate = `Hi [Guardian Name],

I hope this message finds you well. I wanted to reach out because I've set up a digital inheritance plan for my cryptocurrency, and I would be honored if you would serve as one of my guardians.

Here's what being a guardian means in simple terms:

• You'll hold a piece of my recovery key - but you can't access my funds alone
• You'll only be contacted if I can't access my wallet for 90+ days, or if something unexpected happens
• If I need help, you'll just confirm that I need assistance - no technical knowledge required
• The process is simple and I'll guide you through everything

Your role is like being a trusted friend who holds a spare key - you won't need to do anything unless something happens to me, and even then, it's straightforward.

Would you be willing to help me protect my digital assets? If you have any questions, I'm happy to answer them.

Thank you for considering this important role.

Best regards,
${vaultOwnerName}`;

  const faqs = [
    {
      question: "What does being a guardian actually mean?",
      answer: "You hold a piece of the recovery key needed to restore access to the cryptocurrency. Think of it like a safety deposit box that requires multiple keys - you have one key, but can't access anything alone. You'll only be contacted if the vault owner can't access their wallet for an extended period or if something unexpected happens."
    },
    {
      question: "Do I need technical knowledge or a cryptocurrency wallet?",
      answer: "No technical knowledge is required! You don't need a wallet now - you'll only need one if recovery is actually needed. The process is designed to be simple, and we'll guide you through every step if the time comes."
    },
    {
      question: "What happens if I'm contacted?",
      answer: "If the vault owner can't access their wallet, you'll receive an email with a simple link. You'll be asked to confirm that the vault owner needs help. It's as simple as clicking a button and saying 'yes' or 'no'. Multiple guardians must agree before any access is restored."
    },
    {
      question: "Can I access the funds alone?",
      answer: "No, absolutely not. Your piece alone is useless - it requires multiple guardians (usually 2 out of 3) to agree before access can be restored. This security feature protects everyone."
    },
    {
      question: "What if I don't want to be a guardian anymore?",
      answer: "You can contact the vault owner to be removed, and they can invite someone else. It's important to let them know so they can update their safety plan."
    },
    {
      question: "Will this cost me anything?",
      answer: "No, being a guardian is completely free. You're simply helping someone you trust protect their digital assets. If you choose to use GuardiaVault for your own vault later, invited guardians get 50% off premium plans."
    }
  ];

  const handleCopyTemplate = (template: string, templateName: string) => {
    navigator.clipboard.writeText(template);
    setCopiedTemplate(templateName);
    toast({
      title: "Copied!",
      description: `${templateName} copied to clipboard.`,
    });
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Preparing Your Guardians</h2>
        <p className="text-slate-400">
          Help your guardians understand their role with these resources
        </p>
      </div>

      <Tabs defaultValue="template" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="template">
            <FileText className="w-4 h-4 mr-2" />
            Message Template
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="w-4 h-4 mr-2" />
            Common Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Template Message for Your Guardians
                  </CardTitle>
                  <CardDescription>
                    Copy this message to help explain the guardian role in simple terms
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyTemplate(messageTemplate, "Message Template")}
                >
                  {copiedTemplate === "Message Template" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-white/5">
                <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
                  {messageTemplate}
                </pre>
              </div>
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-200">
                  <strong>Tip:</strong> Personalize this message with your guardian's name and add any personal details you'd like to share. The goal is to make them feel comfortable and understand that this is a simple, important role.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Key Points to Emphasize</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">No technical knowledge needed</p>
                    <p className="text-xs text-slate-400">Anyone can be a guardian - it's designed to be simple</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">No action required unless needed</p>
                    <p className="text-xs text-slate-400">They'll only be contacted if something happens to you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Can't access funds alone</p>
                    <p className="text-xs text-slate-400">Multiple guardians must work together - it's secure</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Completely free</p>
                    <p className="text-xs text-slate-400">No cost to them, just helping a friend</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Questions Your Guardians Might Ask
              </CardTitle>
              <CardDescription>
                Answers to common questions about being a guardian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-slate-800/50 rounded-lg border border-white/5"
                  >
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-400" />
                      {faq.question}
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-green-400">Pro Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                Encourage your guardians to ask questions! The more comfortable they feel, the more likely they are to accept. 
                Remind them that this is a safety net - most guardians will never need to take any action.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}






