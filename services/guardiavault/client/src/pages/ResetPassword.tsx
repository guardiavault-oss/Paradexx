import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SimpleOptimizedImage } from "@/components/OptimizedImage";
import { useToast } from "@/hooks/use-toast";

const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [userEmail, setUserEmail] = useState<string>("");
    const [resetComplete, setResetComplete] = useState(false);

    const resetForm = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Get token from URL
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setIsValidToken(false);
            return;
        }

        // Verify token
        fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
            .then(res => res.json())
            .then(data => {
                setIsValidToken(data.valid);
                if (data.valid) {
                    setUserEmail(data.email);
                }
            })
            .catch(() => {
                setIsValidToken(false);
            });
    }, [token]);

    const onResetPassword = async (data: ResetPasswordFormData) => {
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword: data.newPassword,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setResetComplete(true);
                toast({
                    title: "Password Reset Successful",
                    description: "Your password has been reset. You can now log in with your new password.",
                });

                // Redirect to login after a delay
                setTimeout(() => {
                    setLocation("/login");
                }, 3000);
            } else {
                throw new Error(result.message || 'Failed to reset password');
            }
        } catch (error: any) {
            toast({
                title: "Reset Failed",
                description: error.message || "Failed to reset password. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isValidToken === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (isValidToken === false) {
        return (
            <div className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />

                <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
                    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-[24px] border border-white/10 p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h1>
                        <p className="text-slate-400 mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <Button
                            onClick={() => setLocation("/login")}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl"
                        >
                            Back to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (resetComplete) {
        return (
            <div className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />

                <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
                    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-[24px] border border-white/10 p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-white mb-2">Password Reset Complete</h1>
                        <p className="text-slate-400 mb-6">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                        <Button
                            onClick={() => setLocation("/login")}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl"
                        >
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5" />

            <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
                <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-[24px] border border-white/10 p-8">
                    <div className="text-center mb-6">
                        <SimpleOptimizedImage
                            src="logo"
                            alt="GuardiaVault Logo"
                            className="h-16 w-auto mb-4 mx-auto"
                            priority
                            width={64}
                            height={64}
                        />
                        <h1 className="text-xl font-bold text-white">Reset Your Password</h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Enter a new password for {userEmail}
                        </p>
                    </div>

                    <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                            <FormField
                                control={resetForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300 text-sm font-medium">New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={resetForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300 text-sm font-medium">Confirm New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-10 bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl py-3 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Resetting Password...
                                    </span>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center mt-6">
                        <button
                            onClick={() => setLocation("/login")}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
