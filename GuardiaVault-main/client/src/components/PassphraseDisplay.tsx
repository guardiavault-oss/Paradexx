import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Download, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GuardianPassphrase {
  guardianId: string;
  guardianName: string;
  guardianEmail: string;
  passphrase: string;
}

interface PassphraseDisplayProps {
  guardianPassphrases: GuardianPassphrase[];
  masterSecret?: string;
  vaultName: string;
  onClose: () => void;
}

export default function PassphraseDisplay({
  guardianPassphrases,
  masterSecret,
  vaultName,
  onClose,
}: PassphraseDisplayProps) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showMasterSecret, setShowMasterSecret] = useState(false);

  const toggleReveal = (guardianId: string) => {
    setRevealed((prev) => ({ ...prev, [guardianId]: !prev[guardianId] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const downloadPassphrases = () => {
    const content = `GuardiaVault - ${vaultName}
Generated: ${new Date().toLocaleString()}

${masterSecret ? `MASTER SECRET (SAVE THIS SECURELY):\n${masterSecret}\n\n` : ""}GUARDIAN PASSPHRASES:
${guardianPassphrases
  .map(
    (gp, i) => `
${i + 1}. ${gp.guardianName} (${gp.guardianEmail})
   Passphrase: ${gp.passphrase}
`
  )
  .join("\n")}

IMPORTANT SECURITY INSTRUCTIONS:
1. Store the master secret in a secure location (password manager, safe, etc.)
2. Distribute each passphrase ONLY to its corresponding guardian via secure channel
3. Guardians should store their passphrases securely
4. Never share passphrases via email or insecure messaging
5. Delete this file after distributing all passphrases

With the master secret, you can regenerate all guardian passphrases if needed.
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guardiavault-${vaultName.replace(/\s+/g, "-")}-passphrases.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Passphrases downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Alert className="border-yellow-500 bg-yellow-500/10">
        <AlertTriangle className="h-4 h-4 text-yellow-600" />
        <AlertDescription className="text-yellow-600 dark:text-yellow-400">
          <strong>Critical:</strong> These passphrases are shown only once. Each guardian needs their specific
          passphrase to decrypt their fragment. Save them securely before closing this page.
        </AlertDescription>
      </Alert>

      {masterSecret && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Master Secret
            </CardTitle>
            <CardDescription>
              Keep this secret safe! You can regenerate all guardian passphrases using this master secret.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="p-4 bg-muted rounded-md font-mono text-sm break-all">
                {showMasterSecret ? masterSecret : "•".repeat(masterSecret.length)}
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMasterSecret(!showMasterSecret)}
                  data-testid="button-toggle-master-secret"
                >
                  {showMasterSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(masterSecret, "Master secret")}
                  data-testid="button-copy-master-secret"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Guardian Passphrases</CardTitle>
          <CardDescription>
            Each guardian needs their specific passphrase to decrypt their fragment when the vault triggers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {guardianPassphrases.map((gp, index) => (
            <Card key={gp.guardianId}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{gp.guardianName}</p>
                    <p className="text-sm text-muted-foreground">{gp.guardianEmail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Guardian {index + 1}</span>
                </div>

                <div className="relative">
                  <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
                    {revealed[gp.guardianId] ? gp.passphrase : "•".repeat(44)}
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleReveal(gp.guardianId)}
                      className="h-7 w-7"
                      data-testid={`button-toggle-passphrase-${index}`}
                    >
                      {revealed[gp.guardianId] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(gp.passphrase, `Passphrase for ${gp.guardianName}`)}
                      className="h-7 w-7"
                      data-testid={`button-copy-passphrase-${index}`}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          <strong>Distribution Instructions:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Contact each guardian via secure channel (encrypted messaging, in-person, etc.)</li>
            <li>Provide them with their specific passphrase only</li>
            <li>Instruct them to store it securely (password manager recommended)</li>
            <li>Never send passphrases via unencrypted email or SMS</li>
            <li>Confirm each guardian has received and stored their passphrase</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={downloadPassphrases}
          className="flex-1"
          data-testid="button-download-passphrases"
        >
          <Download className="w-4 h-4 mr-2" />
          Download All
        </Button>
        <Button onClick={onClose} className="flex-1 glow-primary" data-testid="button-close-passphrases">
          I've Saved the Passphrases
        </Button>
      </div>
    </div>
  );
}
