import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Calendar, Zap } from "lucide-react";
import { logError } from "@/utils/logger";

interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  apyBonus: number;
  rewardPool: string;
  status: string;
  participantCount: number;
}

interface UserChallenge {
  challengeId: string;
  challengeName: string;
  currentEarnings: string;
  rank: number | null;
  rewardEarned: string | null;
  apyBonus: number;
}

export default function YieldChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
    loadUserChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await fetch("/api/challenges", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to load challenges");
      }

      const data = await response.json();
      setChallenges(data.data || []);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "YieldChallenges_loadChallenges",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserChallenges = async () => {
    try {
      const response = await fetch("/api/challenges/my", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserChallenges(data.data || []);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "YieldChallenges_loadUserChallenges",
      });
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to join challenge");
      }

      // Reload user challenges
      loadUserChallenges();
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "YieldChallenges_joinChallenge",
      });
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const isJoined = (challengeId: string) => {
    return userChallenges.some((uc) => uc.challengeId === challengeId);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <div className="text-center text-slate-400">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Yield Challenges</h3>
            <p className="text-sm text-slate-400">
              Compete for bonus APY and rewards
            </p>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      {challenges.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          No active challenges at the moment
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const userChallenge = userChallenges.find(
              (uc) => uc.challengeId === challenge.id
            );
            const joined = isJoined(challenge.id);

            return (
              <div
                key={challenge.id}
                className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">
                      {challenge.name}
                    </h4>
                    <p className="text-slate-400 text-sm mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(challenge.startDate).toLocaleDateString()} -{" "}
                          {new Date(challenge.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{challenge.apyBonus}% APY Bonus</span>
                      </div>
                      <div className="text-slate-400">
                        {challenge.participantCount} participants
                      </div>
                    </div>
                  </div>
                  {joined && userChallenge && (
                    <div className="text-right">
                      <div className="text-sm text-slate-400 mb-1">Your Rank</div>
                      <div className="text-2xl font-bold text-purple-400">
                        #{userChallenge.rank || "—"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatCurrency(userChallenge.currentEarnings)} earned
                      </div>
                    </div>
                  )}
                </div>

                {joined && userChallenge ? (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div>
                      <div className="text-sm text-slate-400">Current Earnings</div>
                      <div className="text-lg font-semibold text-emerald-400">
                        {formatCurrency(userChallenge.currentEarnings)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 text-white"
                      onClick={() => {
                        window.location.href = `/api/challenges/${challenge.id}/leaderboard`;
                      }}
                    >
                      View Leaderboard
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold mt-4"
                    onClick={() => handleJoinChallenge(challenge.id)}
                  >
                    Join Challenge
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* User's Active Challenges Summary */}
      {userChallenges.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-700/50">
          <h4 className="text-lg font-semibold text-white mb-4">
            Your Active Challenges
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {userChallenges.map((uc) => (
              <div
                key={uc.challengeId}
                className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">
                    {uc.challengeName}
                  </span>
                  {uc.rank && (
                    <span className="text-purple-400 font-bold">#{uc.rank}</span>
                  )}
                </div>
                <div className="text-sm text-slate-400 mb-1">
                  Earnings: {formatCurrency(uc.currentEarnings)}
                </div>
                <div className="text-xs text-emerald-400">
                  +{uc.apyBonus}% APY Bonus
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

