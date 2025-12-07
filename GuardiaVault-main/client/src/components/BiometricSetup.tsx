/**
 * Biometric Setup Component
 * Guides users through setting up WebAuthn biometric authentication
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Fingerprint, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerWebAuthnCredential, isWebAuthnSupported, isMobileDevice, getBiometricTypeName } from "@/lib/webauthn";

interface BiometricSetupProps {
  onComplete?: () => void;
}

export default function BiometricSetup({ onComplete }: BiometricSetupProps = {} as BiometricSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [collecting, setCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setBiometricSupported(isWebAuthnSupported());
    setIsMobile(isMobileDevice());
    setBiometricType(getBiometricTypeName());
  }, []);

  const handleStartCollection = async () => {
    if (!biometricSupported) {
      toast({
        title: "Not Supported",
        description: `${biometricType} is not supported on this device`,
        variant: "destructive",
      });
      return;
    }

    setCollecting(true);
    setProgress(0);

    try {
      // Get device name
      const deviceName = isMobile 
        ? `${biometricType} - ${navigator.userAgent.includes("iPhone") ? "iPhone" : navigator.userAgent.includes("iPad") ? "iPad" : navigator.userAgent.includes("Android") ? "Android" : "Mobile"}`
        : `${biometricType} - ${navigator.platform}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Register WebAuthn credential
      const result = await registerWebAuthnCredential(deviceName);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setCollecting(false);
        setStep(3);
        toast({
          title: "Success",
          description: `${biometricType} authentication enabled successfully`,
        });
      } else {
        throw new Error(result.error || "Failed to register biometric");
      }
    } catch (error: any) {
      setCollecting(false);
      setProgress(0);
      toast({
        title: "Error",
        description: error.message || "Failed to set up biometric authentication",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5" />
          Set Up {biometricType} Authentication
        </CardTitle>
        <CardDescription>
          Use {biometricType} for secure login and check-ins. Works on mobile and desktop.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                {biometricSupported ? (
                  <>
                    We'll use your device's {biometricType} for secure authentication. 
                    Your biometric data never leaves your device and is stored securely.
                  </>
                ) : (
                  <>
                    {biometricType} is not supported on this device. 
                    Please use a device with biometric authentication capabilities.
                  </>
                )}
              </AlertDescription>
            </Alert>

            {biometricSupported && (
              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ul className="list-disc ml-6 space-y-1 text-sm text-muted-foreground">
                  <li>Uses your device's built-in {biometricType}</li>
                  <li>Secure WebAuthn standard (FIDO2)</li>
                  <li>Works on mobile and desktop browsers</li>
                  <li>No passwords needed once set up</li>
                </ul>
              </div>
            )}

            <Button 
              onClick={() => setStep(2)} 
              className="w-full min-h-[44px]"
              disabled={!biometricSupported}
            >
              {biometricSupported ? "Get Started" : "Not Supported"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto">
                <Fingerprint className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Ready to Set Up {biometricType}</h3>
                <p className="text-sm text-muted-foreground">
                  {isMobile 
                    ? `Tap the button below to register your ${biometricType}. You'll be prompted to authenticate with your device's biometric.`
                    : `Click the button below to register your ${biometricType}. You'll be prompted to authenticate with your device's biometric.`
                  }
                </p>
              </div>
            </div>

            {collecting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Setting up {biometricType}...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {!collecting && (
              <Button 
                onClick={handleStartCollection} 
                className="w-full min-h-[44px]"
                disabled={!biometricSupported}
              >
                {collecting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 w-4 h-4" />
                    Set Up {biometricType}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">{biometricType} Configured!</h3>
            <p className="text-muted-foreground">
              You can now use {biometricType} to login and complete check-ins. 
              Your biometric data is stored securely on your device.
            </p>
            <Button
              onClick={() => {
                if (onComplete) {
                  onComplete();
                } else {
                  window.location.reload();
                }
              }}
            >
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

