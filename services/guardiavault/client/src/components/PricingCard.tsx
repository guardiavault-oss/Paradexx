import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Shield } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  prepaymentRange?: string;
  tenYearOption?: string;
  oneYearPrice?: number;
  tenYearPrice?: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  onSelect?: () => void;
}

export default function PricingCard({
  name,
  price,
  prepaymentRange,
  tenYearOption,
  oneYearPrice,
  tenYearPrice,
  description,
  features,
  isPopular,
  onSelect,
}: PricingCardProps) {
  return (
    <Card
      className={`p-6 sm:p-8 md:p-10 hover-elevate relative min-h-[500px] sm:min-h-[550px] flex flex-col ${
        isPopular ? "border-primary glow-primary" : ""
      }`}
      data-testid={`card-pricing-${name.toLowerCase()}`}
    >
      {isPopular && (
        <Badge
          className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm px-4 py-1"
          data-testid="badge-popular"
        >
          Most Popular
        </Badge>
      )}

      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display mb-3">{name}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{description}</p>
        <div className="mb-4">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl sm:text-5xl md:text-6xl font-bold font-display">{price}</span>
          </div>
          <div className="mt-4 sm:mt-6 space-y-3">
            {price.includes("/mo") ? (
              <div className="text-sm sm:text-base">
                <div className="font-semibold text-base sm:text-lg">Monthly Subscription</div>
                <div className="text-muted-foreground text-sm sm:text-base">
                  Billed monthly, cancel anytime
                </div>
              </div>
            ) : (
              <div className="text-sm sm:text-base">
                <div className="font-semibold text-base sm:text-lg">Annual Billing</div>
                <div className="text-muted-foreground text-sm sm:text-base">${oneYearPrice || price.replace(/[^0-9]/g, "")}</div>
              </div>
            )}
            {tenYearPrice && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-primary/10 border border-primary/30 rounded-lg" data-testid={`text-tenyear-${name.toLowerCase()}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-primary">10 Years</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">15% OFF</span>
                </div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-primary">
                  ${tenYearPrice}
              </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">Best Value</p>
            </div>
          )}
          </div>
        </div>
      </div>

      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 mt-0.5" />
            <span className="text-sm sm:text-base">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="w-full text-sm sm:text-base px-4 sm:px-6 py-5 sm:py-6 min-h-[44px] sm:min-h-[48px]"
        variant={isPopular ? "default" : "outline"}
        onClick={onSelect}
        data-testid={`button-select-${name.toLowerCase()}`}
      >
        Prepay & Protect
      </Button>

      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-foreground mb-1 text-sm sm:text-base">Protected by Escrow Contract</div>
            <div className="text-xs sm:text-sm">Payment secured in smart contract escrow</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
