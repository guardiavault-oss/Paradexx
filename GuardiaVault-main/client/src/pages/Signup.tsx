import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Loader2, AlertTriangle, Chrome, Mail, Lock, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { SimpleOptimizedImage } from "@/components/OptimizedImage";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Terms & Conditions Content Component
const TermsContent = () => (
  <div className="space-y-3 text-sm">
    <p><strong>Last Updated:</strong> January 2025</p>
    <div className="p-3 bg-destructive/10 border border-destructive rounded mb-4">
      <p className="font-semibold text-destructive flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        PLEASE READ THESE TERMS CAREFULLY BEFORE USING THIS SERVICE
      </p>
    </div>

    <h3 className="font-semibold mt-4">1. ACCEPTANCE OF TERMS</h3>
    <p>By accessing or using GuardiaVault ("Service"), you agree to be bound by these Terms & Conditions.</p>

    <h3 className="font-semibold mt-4">2. NO CUSTODY - YOU CONTROL YOUR KEYS</h3>
    <p>GuardiaVault is NON-CUSTODIAL. We NEVER have access to your private keys or digital assets.</p>

    <h3 className="font-semibold mt-4">3. ASSUMPTION OF RISK</h3>
    <p>YOU ACKNOWLEDGE THESE RISKS:</p>
    <ul className="list-disc ml-6 space-y-1">
      <li><strong>Smart Contract Risk:</strong> Bugs or vulnerabilities may exist</li>
      <li><strong>Key Loss:</strong> Lost keys are UNRECOVERABLE</li>
      <li><strong>Irreversibility:</strong> Transactions cannot be reversed</li>
    </ul>

    <h3 className="font-semibold mt-4">4. LIMITATION OF LIABILITY</h3>
    <p>GUARDIAVAULT SHALL NOT BE LIABLE FOR:</p>
    <ul className="list-disc ml-6 space-y-1">
      <li>ANY LOSS OF DIGITAL ASSETS OR FUNDS</li>
      <li>SMART CONTRACT FAILURES</li>
      <li>USER ERROR OR NEGLIGENCE</li>
    </ul>
    <p className="mt-2 font-semibold">MAX LIABILITY: $100 USD</p>

    <h3 className="font-semibold mt-4">5. INDEMNIFICATION</h3>
    <p>You agree to indemnify and hold harmless GuardiaVault from any claims.</p>

    <h3 className="font-semibold mt-4">6. ARBITRATION</h3>
    <p>Disputes shall be resolved through binding arbitration. You waive class action rights.</p>

    <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive rounded">
      <p className="font-semibold text-destructive flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        BY ACCEPTING, YOU ACKNOWLEDGE DIGITAL ASSETS ARE HIGHLY RISKY AND YOU MAY LOSE YOUR ENTIRE INVESTMENT.
      </p>
    </div>

    <p className="text-xs text-muted-foreground mt-4">View complete terms in the footer.</p>
  </div>
);

export default function Signup() {
  const [, setLocation] = useLocation();
  const { register: registerUser, isAuthenticated } = useWallet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false); // false = form, true = verification
  const [verificationCode, setVerificationCode] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  // Countdown timer for verification code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (verificationStep && expiresIn > 0) {
      interval = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            setVerificationStep(false); // Go back to form if expired
            toast({
              title: "Verification Code Expired",
              description: "Please start the registration process again.",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [verificationStep, expiresIn, toast]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      switch (error) {
        case "oauth_not_configured": {
          const provider = urlParams.get("provider") || "OAuth";
          errorMessage = `${provider} signup is not configured. Please contact support or use email signup.`;
          break;
        }
        case "oauth_failed": {
          const failedProvider = urlParams.get("provider") || "OAuth";
          errorMessage = `${failedProvider} authentication failed. Please try again or use email signup.`;
          break;
        }
        case "no_email":
          errorMessage = "No email address found. Please try again or use email signup.";
          break;
      }
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  // Get payment info from URL (optional - for users coming from checkout)
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const plan = params.get("plan") || "Pro";
  const months = params.get("months") || "6";

  // Payment is optional - users can sign up for free and explore
  const hasPaymentSession = !!sessionId;

  // Social signup handlers
  const handleGoogleSignup = () => {
    toast({
      title: "Google signup disabled",
      description: "Please use your email and password to create an account.",
      variant: "destructive",
    });
  };


  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!verificationStep) {
      // Step 1: Initiate registration and send verification email
      if (!email || !password || !confirmPassword) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!acceptedTerms) {
        toast({
          title: "Terms Required",
          description: "Please accept the Terms & Conditions to continue.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password: password.trim(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStep(true);
          setExpiresIn(data.expiresIn || 900); // 15 minutes default
          toast({
            title: "Verification Email Sent",
            description: data.message,
          });
        } else {
          throw new Error(data.message || 'Failed to send verification email');
        }
      } catch (error: any) {
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to send verification email. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Step 2: Verify email code and complete registration
      if (!verificationCode || verificationCode.length !== 6) {
        toast({
          title: "Invalid Code",
          description: "Please enter the complete 6-digit verification code.",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            code: verificationCode,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast({
            title: "Account Created Successfully! 🎉",
            description: "Welcome to GuardiaVault! You can now log in with your credentials.",
          });

          // Redirect to login page
          setTimeout(() => {
            setLocation("/login");
          }, 2000);
        } else {
          throw new Error(data.message || 'Failed to verify email');
        }
      } catch (error: any) {
        toast({
          title: "Verification Failed",
          description: error.message || "Failed to verify email. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackToForm = () => {
    setVerificationStep(false);
    setVerificationCode("");
    setExpiresIn(0);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-900/50" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Glassmorphism Card */}
        <div className="relative group">
          {/* Subtle gradient border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-[32px] opacity-10 blur-md group-hover:opacity-20 transition-opacity duration-500" />

          {/* Main card */}
          <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-[24px] sm:rounded-[32px] border border-white/10 p-6 sm:p-12 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 mb-8 sm:mb-10">
              <SimpleOptimizedImage
                src="logo"
                alt="GuardiaVault Logo"
                className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto mb-2 object-contain transition-transform hover:scale-105 cursor-pointer"
                priority
                onClick={() => setLocation("/")}
              />

              <div className="space-y-2">
                {verificationStep ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Check Your Email</h1>
                    <p className="text-xs sm:text-sm text-slate-400">
                      We've sent a verification code to <span className="font-semibold text-white">{email}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Create Your Account</h1>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Sign up for free to explore GuardiaVault. Upgrade anytime to unlock full features.
                    </p>
                  </>
                )}
              </div>
            </div>

            {verificationStep ? (
              // Email Verification Step
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="text-center">
                  <Label className="text-slate-300 text-sm font-medium block mb-4">
                    Enter the 6-digit verification code
                  </Label>
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={(value) => setVerificationCode(value)}
                    disabled={loading}
                  >
                    <InputOTPGroup className="gap-2 justify-center">
                      <InputOTPSlot
                        index={0}
                        className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl h-12 w-12 text-lg font-semibold focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <InputOTPSlot
                        index={1}
                        className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl h-12 w-12 text-lg font-semibold focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <InputOTPSlot
                        index={2}
                        className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl h-12 w-12 text-lg font-semibold focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <InputOTPSlot
                        index={3}
                        className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl h-12 w-12 text-lg font-semibold focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <InputOTPSlot
                        index={4}
                        className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl h-12 w-12 text-lg font-semibold focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <InputOTPSlot
                        index={5}
                        className="bg-slate-900/50 border-slate-700/50 text-white rounded-xl h-12 w-12 text-lg font-semibold focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </InputOTPGroup>
                  </InputOTP>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-slate-400">
                      Code expires in: <span className="font-mono text-white">{formatTime(expiresIn)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleBackToForm}
                      className="text-xs text-slate-500 hover:text-slate-400 mt-2 underline"
                      disabled={loading}
                    >
                      Didn't receive the code? Try again
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl py-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>
              </form>
            ) : (
              // Original Signup Form
              <>
                {/* Social Signup Options */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignup}
                    className="w-full bg-white/5 hover:bg-white/10 border-white/20 min-h-[44px]"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Google signup disabled – use email below
                  </Button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-900/90 text-slate-400">Or continue with email</span>
                    </div>
                  </div>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSignup} className="space-y-4">

                  <div>
                    <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                      />
                    </div>
                    {hasPaymentSession && (
                      <p className="text-xs text-slate-400 mt-1">
                        Use the same email from your payment
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Create Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={8}
                        className="pl-10 pr-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">Confirm Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={8}
                        className="pl-10 pr-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Conditions Acceptance */}
                  <div className="flex items-start gap-3 p-4 border border-white/10 rounded-lg bg-slate-900/30">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      disabled={loading}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                        I have read and agree to the{" "}
                        <Dialog>
                          <DialogTrigger asChild>
                            <button type="button" className="text-blue-400 underline font-semibold hover:text-blue-300">
                              Terms & Conditions
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-display text-white">Terms & Conditions</DialogTitle>
                            </DialogHeader>
                            <DialogDescription asChild>
                              <TermsContent />
                            </DialogDescription>
                          </DialogContent>
                        </Dialog>
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">
                        Required to create account
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl py-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !acceptedTerms}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      "Create Account & Get Started"
                    )}
                  </Button>
                </form>

                {/* Login link */}
                <p className="text-center text-sm text-slate-400 mt-6">
                  Already have an account?{" "}
                  <button
                    onClick={() => setLocation("/login")}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Login here
                  </button>
                </p>

                {/* Trust Signals */}
                <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                  <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>256-bit encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      <span>Non-custodial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span>GDPR compliant</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </>
            )}

            <div className="text-center mt-6">
              <button
                onClick={() => setLocation("/")}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
