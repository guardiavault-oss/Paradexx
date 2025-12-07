# Generate Legal Document Pages from Markdown
# This script creates React components from legal markdown files

Write-Host "Generating legal document pages..." -ForegroundColor Cyan

$legalDir = "legal"
$pagesDir = "client/src/pages/legal"

# Create pages directory if it doesn't exist
if (-not (Test-Path $pagesDir)) {
    New-Item -ItemType Directory -Path $pagesDir -Force | Out-Null
}

# Map of markdown files to component names
$documents = @{
    "PRIVACY_POLICY.md" = "PrivacyPolicy"
    "TERMS_OF_SERVICE.md" = "TermsOfService"
    "DISCLAIMER.md" = "Disclaimer"
    "RISK_DISCLOSURE.md" = "RiskDisclosure"
    "REFUND_POLICY.md" = "RefundPolicy"
    "COOKIE_POLICY.md" = "CookiePolicy"
    "SECURITY_POLICY.md" = "SecurityPolicy"
    "ACCESSIBILITY_POLICY.md" = "AccessibilityPolicy"
}

foreach ($file in $documents.Keys) {
    $componentName = $documents[$file]
    $markdownPath = Join-Path $legalDir $file
    $componentPath = Join-Path $pagesDir "$componentName.tsx"
    
    if (Test-Path $markdownPath) {
        Write-Host "Creating $componentName.tsx..." -ForegroundColor Green
        
        # Read markdown content
        $content = Get-Content $markdownPath -Raw
        
        # Create React component
        $componentCode = @"
/**
 * $componentName Component
 * Auto-generated from legal/$file
 * Last Updated: $(Get-Date -Format "MMMM yyyy")
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function $componentName() {
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
            <CardTitle className="text-3xl">$componentName</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
{`$($content -replace '\$', '\\$' -replace '`', '\`')`}
                </pre>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"@
        
        Set-Content -Path $componentPath -Value $componentCode -Encoding UTF8
    } else {
        Write-Host "Warning: $markdownPath not found" -ForegroundColor Yellow
    }
}

Write-Host "`nLegal pages generated successfully!" -ForegroundColor Cyan

