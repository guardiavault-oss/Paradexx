import { Check } from "lucide-react";

export interface PricingCardProps {
  name: string;
  price: number | string;
  period: string;
  badge?: string;
  description: string;
  features: string[];
  popular?: boolean;
  isDegen?: boolean;
}

export function PricingCard({ name, price, period, badge, description, features, popular, isDegen = false }: PricingCardProps) {
  const bgColor = "rgb(0, 0, 0)";
  const textColor = "rgb(255, 255, 255)";
  const subTextColor = "rgba(255, 255, 255, 0.7)";
  const borderColor = isDegen 
    ? (popular ? "rgba(255, 100, 100, 0.8)" : "rgba(255, 255, 255, 0.3)")
    : (popular ? "rgba(100, 150, 255, 0.8)" : "rgba(255, 255, 255, 0.3)");
  const badgeColor = isDegen ? "rgba(255, 50, 50, 0.3)" : "rgba(100, 150, 255, 0.3)";
  const badgeTextColor = isDegen ? "rgb(255, 100, 100)" : "rgb(100, 150, 255)";
  const badgeBorderColor = isDegen ? "rgba(255, 50, 50, 0.5)" : "rgba(100, 150, 255, 0.5)";
  const checkBgColor = isDegen ? "rgba(255, 100, 100, 0.3)" : "rgba(100, 150, 255, 0.3)";
  const checkBorderColor = isDegen ? "rgba(255, 100, 100, 0.6)" : "rgba(100, 150, 255, 0.6)";
  const checkIconColor = isDegen ? "rgb(255, 100, 100)" : "rgb(100, 150, 255)";
  const buttonBgColor = isDegen
    ? (popular ? "rgba(255, 50, 50, 0.2)" : "rgba(255, 255, 255, 0.1)")
    : (popular ? "rgba(100, 150, 255, 0.2)" : "rgba(255, 255, 255, 0.1)");
  const buttonBorderColor = isDegen
    ? (popular ? "rgba(255, 50, 50, 0.5)" : "rgba(255, 255, 255, 0.3)")
    : (popular ? "rgba(100, 150, 255, 0.5)" : "rgba(255, 255, 255, 0.3)");

  return (
    <div 
      className="w-full h-full flex flex-col p-6 md:p-10 border rounded-3xl overflow-auto"
      style={{ 
        backgroundColor: bgColor,
        borderColor: borderColor,
        boxShadow: popular 
          ? `0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 60px 0 ${isDegen ? 'rgba(255, 50, 50, 0.4)' : 'rgba(100, 150, 255, 0.4)'}`
          : "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
        fontFamily: "'Rajdhani', sans-serif"
      }}
    >
      {badge && (
        <div 
          className="inline-flex self-start px-3 py-1 rounded-full mb-4 uppercase"
          style={{ 
            fontSize: "11px", 
            fontWeight: 700, 
            letterSpacing: "0.1em",
            backgroundColor: badgeColor,
            color: badgeTextColor,
            border: `1px solid ${badgeBorderColor}`
          }}
        >
          {badge}
        </div>
      )}
      
      <h3 className="mb-2" style={{ fontSize: window.innerWidth < 768 ? "32px" : "42px", fontWeight: 900, letterSpacing: "-0.01em", color: textColor }}>
        {name}
      </h3>
      
      <div className="mb-4 flex items-baseline gap-1">
        {typeof price === 'number' ? (
          <>
            <span style={{ fontSize: window.innerWidth < 768 ? "48px" : "64px", fontWeight: 900, letterSpacing: "-0.02em", color: textColor }}>
              ${price}
            </span>
            <span style={{ fontSize: window.innerWidth < 768 ? "18px" : "20px", fontWeight: 600, color: subTextColor }}>
              /{period}
            </span>
          </>
        ) : (
          <span style={{ fontSize: window.innerWidth < 768 ? "40px" : "48px", fontWeight: 900, letterSpacing: "-0.01em", color: textColor }}>
            {price} {period}
          </span>
        )}
      </div>
      
      <p className="mb-6" style={{ fontSize: window.innerWidth < 768 ? "15px" : "17px", lineHeight: "1.5", color: subTextColor, fontWeight: 500 }}>
        {description}
      </p>
      
      <div className="flex-1 space-y-3 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div 
              className="flex-shrink-0 rounded-full p-1 mt-0.5"
              style={{ 
                backgroundColor: checkBgColor,
                border: `1px solid ${checkBorderColor}`
              }}
            >
              <Check size={14} style={{ color: checkIconColor }} />
            </div>
            <span style={{ fontSize: window.innerWidth < 768 ? "14px" : "16px", lineHeight: "1.5", color: subTextColor, fontWeight: 500 }}>
              {feature}
            </span>
          </div>
        ))}
      </div>
      
      <button 
        className="w-full py-4 rounded-xl uppercase transition-all hover:scale-[1.02]"
        style={{ 
          fontSize: "14px", 
          fontWeight: 700, 
          letterSpacing: "0.1em",
          backgroundColor: buttonBgColor,
          border: `1px solid ${buttonBorderColor}`,
          color: textColor,
          cursor: "pointer"
        }}
      >
        Get Started
      </button>
    </div>
  );
}