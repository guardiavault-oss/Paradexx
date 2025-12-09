import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, TrendingUp, Medal, RefreshCw } from "lucide-react";
import { logError } from "@/utils/logger";

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  email?: string;
  apy: number;
  earnings: number;
  totalDeposits: number;
  isYou: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function YieldLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/yield/leaderboard", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to load leaderboard");
      }

      const data = await response.json();
      setUsers(data.data || []);
      
      // Get current user ID from session
      const userResponse = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUserId(userData.id);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "YieldLeaderboard_loadLeaderboard",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);

    // Get user's data
    const userData = users.find((u) => u.userId === currentUserId);
    if (!userData) {
      setSharing(false);
      return;
    }

    // Generate OG image using Vercel OG API pattern
    const ogImageUrl = `/api/og/leaderboard?rank=${userData.rank}&apy=${userData.apy}&earnings=${userData.earnings}`;

    // For now, just copy to clipboard
    const shareText = `🚀 I'm ranking #${userData.rank} on GuardiaVault with ${userData.apy}% APY! Join me: ${window.location.origin}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My GuardiaVault Performance",
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Performance copied to clipboard!");
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "YieldLeaderboard_share",
      });
    }

    setTimeout(() => setSharing(false), 2000);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="text-slate-400 font-semibold">#{rank}</span>;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Yield Leaderboard</h3>
            <p className="text-sm text-slate-400">Top performers this month</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto mb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No leaderboard data available
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">
                  User
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-300">
                  APY
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">
                  Earnings
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userId}
                  className={`border-b border-slate-700/30 transition-colors ${
                    user.userId === currentUserId
                      ? "bg-blue-500/10 border-blue-500/20"
                      : "hover:bg-slate-800/50"
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(user.rank)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {user.username || user.email?.split("@")[0] || "Anonymous"}
                      </span>
                      {user.userId === currentUserId && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/30">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-emerald-400">
                        {user.apy.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-white">
                      {formatCurrency(user.earnings)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Share Button */}
      <Button
        size="lg"
        variant="outline"
        className="w-full border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold py-6 rounded-xl transition-all hover:scale-[1.02]"
        onClick={handleShare}
        disabled={sharing}
      >
        {sharing ? (
          <>
            <Share2 className="w-5 h-5 mr-2 animate-spin" />
            Sharing...
          </>
        ) : (
          <>
            <Share2 className="w-5 h-5 mr-2" />
            Share My Performance
          </>
        )}
      </Button>
    </div>
  );
}

