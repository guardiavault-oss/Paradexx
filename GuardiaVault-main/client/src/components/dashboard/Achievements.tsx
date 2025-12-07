import { useState, useEffect } from "react";
import { Trophy, Sparkles, Award } from "lucide-react";
import { logError } from "@/utils/logger";

interface Achievement {
  type: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  rewardEarned?: string;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await fetch("/api/achievements", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to load achievements");
      }

      const data = await response.json();
      setAchievements(data.data?.achievements || []);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "Achievements_loadAchievements",
      });
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <div className="text-center text-slate-400">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Achievements</h3>
            <p className="text-sm text-slate-400">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Completion</span>
          <span className="text-sm font-semibold text-white">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.type}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              achievement.unlocked
                ? "border-yellow-500/50 bg-yellow-500/5"
                : "border-slate-700 bg-slate-800/50 opacity-60"
            }`}
          >
            {achievement.unlocked && (
              <div className="absolute top-3 right-3">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
            )}
            <div className="text-4xl mb-3">{achievement.icon}</div>
            <h4 className="text-lg font-semibold text-white mb-1">
              {achievement.title}
            </h4>
            <p className="text-sm text-slate-400 mb-3">
              {achievement.description}
            </p>
            {achievement.unlocked && achievement.rewardEarned && (
              <div className="text-xs text-emerald-400 font-semibold">
                +${achievement.rewardEarned} Reward
              </div>
            )}
            {achievement.unlocked && achievement.unlockedAt && (
              <div className="text-xs text-slate-500 mt-2">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

