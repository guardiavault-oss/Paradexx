import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft, Check, Loader2, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/utils/logger";


interface CheckoutProps {
  plan?: string;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  // Single annual pricing tiers
  const { toast } = useToast();

  const [subscriptionDuration, setSubscriptionDuration] = useState<"1year" | "10year">("1year");

  // Get plan from URL params or default to Guardian+
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "Guardian+";

  // Updated pricing plans
  const plans: Record<string, { price: number; monthlyPrice?: number; features: string[]; description: string }> = {
    "Starter": { 
      monthlyPrice: 49.99,
      price: 599.88, // Annual equivalent (49.99 * 12)
      description: "Best for: Everyday crypto users",
      features: [
        "2-of-3 Multi-Sig Recovery",
        "Guardian Portal (no signup needed)",
        "1 Wallet, 1 Beneficiary",
        "Basic Will Builder (visual UI)",
        "Email recovery alerts"
      ] 
    },
    "Vault Pro": { 
      monthlyPrice: 99.99,
      price: 1199.88, // Annual equivalent (99.99 * 12)
      description: "Best for: Power users, DAOs, and estate attorneys",
      features: [
        "Everything in Starter, plus:",
        "Multi-wallet support (BTC, ETH, NFTs)",
        "Smart Will Builder (legal PDF + on-chain logic)",
        "Hardware key & Web3 signature support",
        "Priority recovery & concierge setup",
        "Earn 3–5% APY on staked vaults"
      ] 
    },
    "Guardian+": { 
      monthlyPrice: 249.99,
      price: 2999.88, // Annual equivalent (249.99 * 12)
      description: "Most Popular - Peace of mind for you and your family",
      features: [
        "Everything in Vault Pro, plus:",
        "Automated Death Certificate Verification",
        "3 Guardians + 3 Beneficiaries",
        "SMS/Telegram notifications",
        "Biometric & 2FA login",
        "On-chain Will Execution"
      ] 
    },
    // Legacy plans for backward compatibility
    "Basic": { 
      price: 99, 
      description: "Individual crypto holders",
      features: [
        "1 vault",
        "5 beneficiaries per vault",
        "90-day check-in interval",
        "Standard guardian setup",
        "Email & SMS notifications"
      ] 
    },
    "Family": { 
      price: 199, 
      description: "Family units, multiple vaults",
      features: [
        "3 vaults",
        "10 beneficiaries per vault",
        "60-day check-in interval",
        "Guardian management",
        "Priority email support"
      ] 
    },
    "Premium": { 
      price: 499, 
      description: "Advanced users, unlimited access",
      features: [
        "Unlimited vaults",
        "Unlimited beneficiaries",
        "30-day check-in interval",
        "Priority 24/7 support",
        "Advanced document storage",
        "Dedicated account manager"
      ] 
    },
  };
  const planDetails = plans[plan] || plans["Guardian+"];

  // Calculate pricing based on duration and plan type
  // All plans are now monthly pricing
  const calculatePrice = (duration: "1year" | "10year") => {
    // All plans use monthly pricing
    const monthlyPrice = planDetails.monthlyPrice || planDetails.price;
    const annualPrice = monthlyPrice * 12;
    
    if (duration === "10year") {
      const basePrice10Year = annualPrice * 10;
      const discount = basePrice10Year * 0.15;
      return {
        basePrice: basePrice10Year,
        discountedPrice: basePrice10Year - discount,
        discount,
        months: 120,
        monthlyPrice,
      };
    }
    
    // For 1 year, show monthly option
    return {
      basePrice: monthlyPrice,
      discountedPrice: monthlyPrice,
      discount: 0,
      months: 1,
      isMonthly: true,
      monthlyPrice,
      annualPrice,
    };
  };

  const oneYearPrice = calculatePrice("1year");
  const tenYearPrice = calculatePrice("10year");
  const currentPrice = subscriptionDuration === "1year" ? oneYearPrice : tenYearPrice;

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      // No login required - payment first!
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: Include session cookie
        body: JSON.stringify({
          plan,
          months: currentPrice.months,
          duration: subscriptionDuration,
          amount: currentPrice.discountedPrice,
        }),
      });

      if (!response.ok) {
        // Try to parse error response, but handle non-JSON gracefully
        let errorMessage = "Failed to create checkout session";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            errorMessage = `${response.status} ${response.statusText}`;
          }
        } catch {
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Ensure response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server");
      }
      
      const data = await response.json();
      const fallbackUrl = data?.url || (data?.id ? `https://checkout.stripe.com/c/pay/${data.id}` : (data?.sessionId ? `https://checkout.stripe.com/c/pay/${data.sessionId}` : undefined));
      if (!fallbackUrl) {
        throw new Error("No checkout URL returned from server");
      }
      window.location.href = fallbackUrl;
    } catch (error: any) {
      logError(error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session. Please try again or contact support.",
        variant: "destructive",
      });
      // Don't throw the error - just show toast and let user try again
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-display mb-2">Complete Your Purchase</h1>
          <p className="text-muted-foreground">Choose your payment method</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Plan Summary */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold font-display mb-2">{plan} Plan</h2>
              <p className="text-sm text-muted-foreground">{planDetails.description}</p>
            </div>
            <div className="space-y-3 mb-6">
              {planDetails.features.map((feature: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  Billing Cycle
                </Label>
                <div className="space-y-2">
                  <div 
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${
                      subscriptionDuration === "1year" ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSubscriptionDuration("1year")}
                  >
                    <input
                      type="radio"
                      checked={subscriptionDuration === "1year"}
                      onChange={() => setSubscriptionDuration("1year")}
                      className="text-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Monthly</div>
                      <div className="text-xs text-muted-foreground">${planDetails.monthlyPrice || planDetails.price}/month</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${oneYearPrice.discountedPrice}/mo</div>
                    </div>
                  </div>
                  <div 
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${
                      subscriptionDuration === "10year" ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSubscriptionDuration("10year")}
                  >
                    <input
                      type="radio"
                      checked={subscriptionDuration === "10year"}
                      onChange={() => setSubscriptionDuration("10year")}
                      className="text-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">10 Years</div>
                      <div className="text-xs text-muted-foreground">120 months - Save 15%</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${tenYearPrice.discountedPrice}</div>
                      <div className="text-xs text-muted-foreground line-through">${oneYearPrice.annualPrice ? (oneYearPrice.annualPrice * 10).toFixed(2) : '0.00'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-semibold">{plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {plan === "Starter" && subscriptionDuration === "1year" ? "Billing:" : "Duration:"}
                </span>
                <span className="font-semibold">
                  {plan === "Starter" && subscriptionDuration === "1year" 
                    ? "Monthly" 
                    : subscriptionDuration === "1year" 
                    ? "1 Year" 
                    : "10 Years"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price:</span>
                <span>${currentPrice.basePrice}</span>
              </div>
              {subscriptionDuration === "10year" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount (15%):</span>
                  <span className="font-semibold text-primary">-${currentPrice.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t">
                <span>Total:</span>
                <span>${currentPrice.discountedPrice}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Secure Payment Processing</div>
                  <div className="text-muted-foreground">
                    Your payment is processed securely through Stripe. All transactions are encrypted and PCI-compliant.
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-display text-center mb-6">
            Secure Payment
          </h2>

          {/* Stripe Payment - Only Option */}
          <Card className="p-6 hover-elevate transition-all border-primary/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold font-display mb-2">Credit Card Payment</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Pay securely with Visa, Mastercard, Amex, or any major credit card
                </p>
                <div className="text-2xl font-bold mb-1">${currentPrice.discountedPrice}</div>
                <p className="text-xs text-muted-foreground">Processed securely by Stripe</p>
              </div>
            </div>
          </Card>

          {/* Checkout Button */}
          <div className="flex justify-center mt-8">
            <Button
              size="lg"
              className="glow-primary px-12"
              onClick={handleStripeCheckout}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Processing..." : `Pay $${currentPrice.discountedPrice} Now`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
