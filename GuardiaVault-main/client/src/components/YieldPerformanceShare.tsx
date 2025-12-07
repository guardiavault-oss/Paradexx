/**
 * Yield Performance Share Component
 * Allows users to share their yield performance on social media
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Copy, 
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface YieldPerformanceShareProps {
  apy?: number;
  totalEarned?: string;
  totalValue?: string;
  asset?: string;
  vaultName?: string;
}

export default function YieldPerformanceShare({
  apy,
  totalEarned,
  totalValue,
  asset = "ETH",
  vaultName = "My Vault",
}: YieldPerformanceShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = apy
    ? `💰 Just earned ${apy.toFixed(2)}% APY on my crypto with GuardiaVault! Auto-compounding DeFi yields + free inheritance protection. Check it out! ${shareUrl}`
    : `💰 Earning competitive yields on my crypto with GuardiaVault - the only platform that combines DeFi yields with inheritance protection! ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Share text copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: "twitter" | "facebook" | "linkedin") => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  if (!apy && !totalEarned) {
    return null; // Don't show if no yield data
  }

  return (
    <Card className="glass-card border-emerald-500/20 bg-gradient-to-br from-emerald-950/10 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Share2 className="w-5 h-5 text-emerald-400" />
          Share Your Performance
        </CardTitle>
        <CardDescription>
          Show off your yield earnings and help others discover GuardiaVault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white">My Yield Performance</h4>
              <p className="text-xs text-slate-400">{vaultName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-4">
            {apy && (
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{apy.toFixed(2)}%</div>
                <div className="text-xs text-slate-400">APY</div>
              </div>
            )}
            {totalEarned && (
              <div className="text-center">
                <div className="text-xl font-bold text-white">+{parseFloat(totalEarned).toFixed(4)}</div>
                <div className="text-xs text-slate-400">{asset}</div>
              </div>
            )}
            {totalValue && (
              <div className="text-center">
                <div className="text-xl font-bold text-white">{parseFloat(totalValue).toFixed(4)}</div>
                <div className="text-xs text-slate-400">Total Value</div>
              </div>
            )}
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("twitter")}
            className="glass border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30"
          >
            <Twitter className="w-4 h-4 mr-2" />
            Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("facebook")}
            className="glass border-white/10 hover:bg-blue-600/20 hover:border-blue-600/30"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare("linkedin")}
            className="glass border-white/10 hover:bg-blue-700/20 hover:border-blue-700/30"
          >
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="glass border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Social Proof */}
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-slate-400 text-center">
            <Sparkles className="w-3 h-3 inline mr-1 text-emerald-400" />
            Sharing your performance helps grow the community and showcase real yield results
          </p>
        </div>
      </CardContent>
    </Card>
  );
}






