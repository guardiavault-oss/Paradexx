/**
 * Legal Documents Page
 * Displays all legal documents with navigation
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, AlertTriangle, Cookie, DollarSign, Eye, Gavel, Accessibility } from "lucide-react";

const legalDocuments = [
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data",
    icon: Shield,
    path: "/legal/privacy",
  },
  {
    id: "terms",
    title: "Terms of Service",
    description: "User agreement and service terms",
    icon: FileText,
    path: "/legal/terms",
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    description: "Important legal disclaimers",
    icon: AlertTriangle,
    path: "/legal/disclaimer",
  },
  {
    id: "risks",
    title: "Risk Disclosure",
    description: "Comprehensive risk information",
    icon: AlertTriangle,
    path: "/legal/risks",
  },
  {
    id: "refund",
    title: "Refund Policy",
    description: "Subscription refund terms",
    icon: DollarSign,
    path: "/legal/refund",
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    description: "How we use cookies and tracking",
    icon: Cookie,
    path: "/legal/cookies",
  },
  {
    id: "security",
    title: "Security Policy",
    description: "Our security measures and practices",
    icon: Shield,
    path: "/legal/security",
  },
  {
    id: "accessibility",
    title: "Accessibility Policy",
    description: "Accessibility standards and features",
    icon: Accessibility,
    path: "/legal/accessibility",
  },
];

export default function Legal() {
  const [, setLocation] = useLocation();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const handleDocumentClick = (path: string) => {
    setLocation(path);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Legal Documents</h1>
          <p className="text-muted-foreground text-lg">
            Review our legal policies, terms, and disclosures
          </p>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {legalDocuments.map((doc) => {
            const Icon = doc.icon;
            return (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleDocumentClick(doc.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">{doc.title}</CardTitle>
                  </div>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Document
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Contact</CardTitle>
            <CardDescription>
              For legal questions or concerns, please contact us
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">General Legal Inquiries</p>
              <p className="text-muted-foreground">legal@guardiavault.com</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Privacy Questions</p>
              <p className="text-muted-foreground">privacy@guardiavault.com</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Security Issues</p>
              <p className="text-muted-foreground">security@guardiavault.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> These legal documents are binding agreements. Please read them carefully.
            If you have questions, consult with a qualified attorney. By using GuardiaVault, you agree to
            these terms and policies.
          </p>
        </div>
      </div>
    </div>
  );
}

