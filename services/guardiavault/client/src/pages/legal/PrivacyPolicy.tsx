/**
 * Privacy Policy Page
 * Auto-generated from legal/PRIVACY_POLICY.md
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
// Markdown component not available - using plain text rendering

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation("/legal")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Legal Documents
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground mb-6">
                  <strong>Last Updated:</strong> January 2024
                </p>
                <p>
                  Please visit <a href="/legal/privacy" className="text-primary">/legal/privacy</a> for the full document.
                  The complete Privacy Policy is available in the <code>legal/PRIVACY_POLICY.md</code> file.
                </p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

