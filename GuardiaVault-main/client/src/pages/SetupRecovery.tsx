import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMultiSigRecovery } from "@/hooks/useMultiSigRecovery";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  ArrowLeft,
  Wallet,
  Shield,
  Users,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import WizardProgress from "@/components/WizardProgress";
import { useAnnounce } from "@/utils/accessibility";
import { encryptSeedPhrase, generateEncryptionPassword } from "@/lib/encryption";

const recoveryKeySchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const recoveryFormSchema = z.object({
  walletAddress: z
    .string()
    .min(42, "Invalid wallet address")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  recoveryKeys: z
    .array(recoveryKeySchema)
    .length(3, "Exactly 3 recovery keys required"),
  seedPhrase: z.string().min(12, "Seed phrase must be at least 12 words"),
});

type RecoveryFormValues = z.infer<typeof recoveryFormSchema>;

export default function SetupRecovery() {
  const [, setLocation] = useLocation();
  const { walletAddress } = useWallet();
  const { toast } = useToast();
  const { createRecovery, loading } = useMultiSigRecovery();
  const [currentStep, setCurrentStep] = useState(1);
  const [encryptedData, setEncryptedData] = useState<string>("");
  const announce = useAnnounce();

  const form = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoveryFormSchema),
    defaultValues: {
      walletAddress: walletAddress || "",
      recoveryKeys: [
        { email: "", name: "" },
        { email: "", name: "" },
        { email: "", name: "" },
      ],
      seedPhrase: "",
    },
  });

  const STEPS = [
    { id: 1, title: "Wallet Address", icon: Wallet },
    { id: 2, title: "Recovery Keys", icon: Users },
    { id: 3, title: "Seed Phrase", icon: Lock },
    { id: 4, title: "Review", icon: CheckCircle2 },
  ];

  // Convert STEPS to WizardProgress format
  const wizardSteps = STEPS.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.id === 1 ? "Enter your wallet address" :
                 step.id === 2 ? "Add 3 recovery key contacts" :
                 step.id === 3 ? "Enter your seed phrase securely" :
                 "Review and confirm all information",
  }));

  // Announce step changes to screen readers
  useEffect(() => {
    const stepTitle = STEPS.find(s => s.id === currentStep)?.title || "Step";
    announce(`Now on ${stepTitle} step`);
  }, [currentStep, announce]);

  const handleEncryptAndSubmit = async (data: RecoveryFormValues) => {
    try {
      // Generate encryption password
      const encryptionPassword = generateEncryptionPassword(data.walletAddress);

      // Encrypt seed phrase using Web Crypto API
      const encrypted = await encryptSeedPhrase(data.seedPhrase, encryptionPassword);
      setEncryptedData(encrypted);

      // Prepare recovery key addresses (from emails - backend will handle conversion)
      // For now, we'll need backend API to convert emails to addresses
      // This is a placeholder - you'll need to implement email-to-address mapping
      const recoveryKeyAddresses: [string, string, string] = [
        data.recoveryKeys[0].email, // Placeholder - backend will convert
        data.recoveryKeys[1].email,
        data.recoveryKeys[2].email,
      ];

      // Call backend API first to handle email-to-address conversion and send invitations
      const response = await fetch("/api/recovery/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          walletAddress: data.walletAddress,
          recoveryKeys: data.recoveryKeys,
          encryptedData: encrypted,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create recovery setup");
      }

      const { recoveryId: dbRecoveryId, recoveryKeyAddresses: addresses } =
        await response.json();

      // Now call the contract with actual addresses
      const result = await createRecovery(
        data.walletAddress,
        addresses as [string, string, string],
        encrypted
      );

      // Update database with contract recovery ID
      if (result.recoveryId !== undefined) {
        await fetch(`/api/recovery/update-contract-id/${dbRecoveryId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ contractRecoveryId: result.recoveryId }),
        });
      }

      toast({
        title: "Recovery Setup Complete!",
        description:
          "Recovery keys have been notified. They can help you recover your wallet if needed.",
      });

      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup recovery",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold font-display mb-2">
          Setup Wallet Recovery
        </h1>
        <p className="text-muted-foreground">
          Protect your wallet with 2-of-3 recovery keys. If you lose your seed
          phrase, 2 trusted friends can help you recover it.
        </p>
      </div>

      {/* Wizard Progress Indicator */}
      <div className="mb-8">
        <WizardProgress steps={wizardSteps} currentStep={currentStep - 1} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleEncryptAndSubmit)}>
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Address
                </CardTitle>
                <CardDescription>
                  Enter the wallet address you want to protect
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0x..."
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        The Ethereum wallet address you want to set up recovery
                        for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    This recovery system protects your wallet access. Make sure
                    you own this wallet address.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      setCurrentStep(2);
                    }}
                    disabled={!form.watch("walletAddress")}
                  >
                    Next: Recovery Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recovery Keys
                </CardTitle>
                <CardDescription>
                  Choose 3 trusted people to be your recovery keys. 2 of 3 must
                  attest if you need to recover your wallet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">Recovery Key {index + 1}</h3>
                    <FormField
                      control={form.control}
                      name={`recoveryKeys.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`recoveryKeys.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Recovery keys will receive an email invitation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Security</AlertTitle>
                  <AlertDescription>
                    Choose people you trust completely. They won't have access to
                    your wallet until you lose access and 2 of them attest.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={
                      form.watch("recoveryKeys").some(
                        (key) => !key.email || !key.name
                      )
                    }
                  >
                    Next: Seed Phrase
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Seed Phrase
                </CardTitle>
                <CardDescription>
                  Enter your seed phrase. It will be encrypted before storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="seedPhrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seed Phrase</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="word1 word2 word3..."
                          rows={4}
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your 12 or 24 word seed phrase. This will be
                        encrypted before storage.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Encryption</AlertTitle>
                  <AlertDescription>
                    Your seed phrase is encrypted client-side before being sent
                    to the server. Only your recovery keys can decrypt it after
                    the 7-day time lock expires.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    disabled={!form.watch("seedPhrase")}
                  >
                    Next: Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Review & Submit
                </CardTitle>
                <CardDescription>
                  Review your recovery setup before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Wallet Address</h3>
                  <p className="text-sm font-mono text-muted-foreground">
                    {form.watch("walletAddress")}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Recovery Keys</h3>
                  {form.watch("recoveryKeys").map((key, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-semibold">{key.name}</span>{" "}
                      <span className="text-muted-foreground">
                        ({key.email})
                      </span>
                    </div>
                  ))}
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Final Steps</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Your seed phrase will be encrypted</li>
                      <li>Recovery keys will receive email invitations</li>
                      <li>2 of 3 keys must attest to trigger recovery</li>
                      <li>7-day time lock prevents immediate access</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {loading ? "Setting up..." : "Setup Recovery"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}


