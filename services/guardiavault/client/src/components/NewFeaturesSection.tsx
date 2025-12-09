import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Fingerprint, 
  FileCheck, 
  TrendingUp, 
  Users,
  Sparkles,
  CheckCircle2
} from "lucide-react";

interface NewFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
  gradient: string;
}

const newFeatures: NewFeature[] = [
  {
    icon: Fingerprint,
    title: "Biometric Check-in Verification",
    description: "Enhanced security with behavioral biometric verification. Your typing patterns and mouse movements verify your identity during every check-in.",
    badge: "NEW",
    gradient: "from-purple-600 to-violet-600",
  },
  {
    icon: TrendingUp,
    title: "Yield-Generating Vaults",
    description: "Your funds earn 3-5% APY while waiting. Auto-staking in secure protocols with only 1% performance fee.",
    badge: "NEW",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Users,
    title: "dao-based Verification",
    description: "Community-driven verification system. Stake tokens, vote on claims, and earn reputation for accurate verifications.",
    badge: "NEW",
    gradient: "from-blue-600 to-cyan-600",
  },
];

export default function NewFeaturesSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-b from-background via-background to-background/95 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1), transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1), transparent 50%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <Badge className="mb-4 text-sm sm:text-base px-4 py-1.5 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Latest Enhancements
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-primary">
              Revolutionary New Features
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Three game-changing enhancements that make GuardiaVault the most advanced digital inheritance platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {newFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover-elevate bg-gradient-to-br from-background to-background/50"
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`} />
                
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2.5 sm:p-3 rounded-lg bg-gradient-to-br ${feature.gradient} bg-opacity-10`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6`} 
                        style={{
                          color: feature.gradient.includes('purple') ? 'rgb(147, 51, 234)' :
                                 feature.gradient.includes('red') ? 'rgb(220, 38, 38)' :
                                 feature.gradient.includes('emerald') ? 'rgb(34, 197, 94)' :
                                 'rgb(59, 130, 246)',
                        }}
                      />
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl md:text-2xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  
                  {/* Feature Highlights */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Available now</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 sm:mt-16 md:mt-20">
          <p className="text-base sm:text-lg text-muted-foreground mb-6">
            Experience the future of digital inheritance
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all duration-300 glow-primary"
          >
            Get Started Today
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </a>
        </div>
      </div>
    </section>
  );
}

