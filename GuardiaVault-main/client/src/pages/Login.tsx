import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Lock, Mail, Eye, EyeOff, Shield, Fingerprint, AlertCircle, Chrome } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { SimpleOptimizedImage } from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import {
  authenticateWithWebAuthnForLogin,
  checkWebAuthnAvailable,
  isWebAuthnSupported,
  isMobileDevice,
  getBiometricTypeName
} from "@/lib/webauthn-login";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  totpToken: z.string().optional(),
  backupCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { isAuthenticated, isConnecting, login, register } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [checkingWebAuthn, setCheckingWebAuthn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }

    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      switch (error) {
        case "invalid_state":
          errorMessage = "Security verification failed. This usually happens if cookies are blocked. Please enable cookies and try again.";
          break;
        case "no_code":
          errorMessage = "Authentication was cancelled or failed.";
          break;
        case "oauth_not_configured":
          const provider = urlParams.get("provider") || "OAuth";
          errorMessage = `${provider} login is not configured. Please contact support or use email login.`;
          break;
        case "token_exchange_failed":
        case "invalid_grant":
          errorMessage = "Authentication failed. The redirect URI may not match. Please try again or contact support.";
          break;
        case "user_info_failed":
          errorMessage = "Failed to retrieve user information.";
          break;
        case "no_email":
          errorMessage = "No email address found. Please ensure your account has an email.";
          break;
        case "user_not_found":
          const notFoundProvider = urlParams.get("provider") || "OAuth";
          const customMessage = urlParams.get("message");
          errorMessage = customMessage || `No account found. Please sign up first using ${notFoundProvider} OAuth.`;
          break;
        case "oauth_failed":
          const failedProvider = urlParams.get("provider") || "OAuth";
          errorMessage = `${failedProvider} authentication failed. Please try again or use email login.`;
          break;
      }
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAuthenticated, setLocation, toast]);

  // Watch email field for WebAuthn check
  const email = useWatch({
    control: loginForm.control,
    name: "email",
  });

  // Check WebAuthn availability and mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
    setBiometricType(getBiometricTypeName());
  }, []);

  // Check WebAuthn when email is entered
  useEffect(() => {
    if (email && isWebAuthnSupported()) {
      checkWebAuthnForEmail(email);
    }
  }, [email]);

  const checkWebAuthnForEmail = async (email: string) => {
    setCheckingWebAuthn(true);
    try {
      const available = await checkWebAuthnAvailable(email);
      setWebAuthnAvailable(available);
    } catch (error) {
      setWebAuthnAvailable(false);
    } finally {
      setCheckingWebAuthn(false);
    }
  };

  const handleBiometricLogin = async () => {
    const email = loginForm.getValues("email");

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await authenticateWithWebAuthnForLogin(email);

      if (result.success && result.user) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.email}!`,
        });
        // Reload to update auth state
        window.location.href = "/dashboard";
      } else {
        toast({
          title: "Biometric Login Failed",
          description: result.error || "Please try password login",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Biometric Login Failed",
        description: error.message || "Please try password login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function onLogin(data: LoginFormData) {
    setIsLoading(true);
    setError(null);
    try {
      // Use the login function from useWallet which handles errors properly
      await login(data.email, data.password, data.totpToken, data.backupCode);
      // Login successful - redirect is handled by useWallet or we can redirect here
      // Wait a moment for auth state to update, then redirect
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    } catch (error: any) {
      // Error is already handled by useWallet's login function with toast
      // If 2FA is required, handle it
      if (error?.requires2FA) {
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }
      // Set error for display
      setError(error?.message || "Login failed. Please check your credentials and try again.");
      setIsLoading(false);
    }
  }


  // Biometric OAuth handlers
  const handleBiometricOAuthLogin = async () => {
    if (!webAuthnAvailable || !isWebAuthnSupported()) {
      toast({
        title: "Biometric Authentication Not Available",
        description: "Biometric authentication is not supported on this device or browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First check if user has biometric authentication set up
      const statusResponse = await fetch(`/api/auth/oauth/biometric/status?email=${encodeURIComponent(loginForm.getValues('email'))}`);
      const statusData = await statusResponse.json();

      if (!statusData.available) {
        if (!statusData.userExists) {
          toast({
            title: "User Not Found",
            description: "Please sign up first before using biometric authentication.",
            variant: "destructive",
          });
          return;
        } else {
          toast({
            title: "Biometric Authentication Not Set Up",
            description: "Please configure biometric authentication in your settings first.",
            variant: "destructive",
          });
          return;
        }
      }

      // Initiate biometric OAuth
      const initResponse = await fetch('/api/auth/oauth/biometric/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.getValues('email'),
        }),
      });

      const initData = await initResponse.json();

      if (!initResponse.ok) {
        throw new Error(initData.message || 'Failed to initiate biometric authentication');
      }

      // Perform WebAuthn authentication
      const assertion = await authenticateWithWebAuthnForLogin(initData.options);

      // Complete biometric OAuth
      const completeResponse = await fetch('/api/auth/oauth/biometric/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assertionResponse: assertion,
        }),
      });

      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(completeData.message || 'Biometric authentication failed');
      }

      // Authentication successful
      toast({
        title: "Login Successful",
        description: "Welcome back! You've been authenticated using biometric authentication.",
      });

      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);

    } catch (error: any) {
      console.error('Biometric OAuth error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Biometric authentication failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Forgot password handler - simple email reset
  const handleForgotPassword = async () => {
    if (!loginForm.getValues('email')) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive a password reset link.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.getValues('email'),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Reset Email Sent",
          description: data.message,
        });
      } else {
        throw new Error(data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                width={96}
                height={96}
                onClick={() => setLocation("/")}
              />

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome to GuardiaVault</h1>
                <p className="text-xs sm:text-sm text-slate-400" data-testid="text-login-subtitle">
                  Secure your crypto inheritance
                </p>
              </div>
            </div>

            {/* Login Form - No tabs, just login */}
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                {/* Error Alert - NEW */}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Social Login Options - NEW */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBiometricOAuthLogin}
                    disabled={!loginForm.getValues('email') || isLoading}
                    className="w-full bg-white/5 hover:bg-white/10 border-white/20 min-h-[44px]"
                  >
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Login with Biometric Authentication
                  </Button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-900/90 text-slate-400">Or continue with email and password</span>
                    </div>
                  </div>
                </div>

                {/* Email and Password Login */}
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                            data-testid="input-login-email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                            data-testid="input-login-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                            data-testid="button-toggle-login-password"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requires2FA && (
                  <FormField
                    control={loginForm.control}
                    name={useBackupCode ? "backupCode" : "totpToken"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                          <Shield className="w-4 h-4" />
                          {useBackupCode ? "Backup Code" : "Two-Factor Authentication Code"}
                        </FormLabel>
                        <FormControl>
                          {useBackupCode ? (
                            <div className="space-y-2">
                              <Input
                                type="text"
                                placeholder="Enter 8-digit backup code"
                                maxLength={8}
                                className="text-center text-lg tracking-widest bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                                  field.onChange(value);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setUseBackupCode(false)}
                                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                              >
                                Use TOTP code instead
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <InputOTP
                                maxLength={6}
                                value={field.value || ""}
                                onChange={field.onChange}
                                className="justify-center"
                              >
                                <InputOTPGroup className="gap-2">
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
                              <button
                                type="button"
                                onClick={() => setUseBackupCode(true)}
                                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                              >
                                Use backup code instead
                              </button>
                            </div>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl py-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isConnecting || isLoading}
                  data-testid="button-login-submit"
                >
                  {isConnecting || isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : requires2FA ? (
                    "Verify & Login"
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>

            {/* Forgot Password Link */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-sm text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forgot your password?
              </button>
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm text-slate-400 mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/signup")}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Sign up
              </button>
            </p>

            {/* Trust Signals - NEW */}
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
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-slate-400 hover:text-white transition-colors"
            data-testid="button-back-to-home"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
