import { useState, useEffect } from "react";
import { BookOpen, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { logError } from "@/utils/logger";

interface Article {
  id: string;
  title: string;
  emoji: string;
  readTime: number;
  content: string;
  category: string;
}

// Mock articles (in production, fetch from /api/articles)
const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Understanding Yield Farming",
    emoji: "🌾",
    readTime: 5,
    content: "Yield farming is the process of earning rewards by staking or lending crypto assets...",
    category: "DeFi Basics",
  },
  {
    id: "2",
    title: "Lido Staking Explained",
    emoji: "🪙",
    readTime: 7,
    content: "Lido is a liquid staking protocol that allows you to stake ETH while maintaining liquidity...",
    category: "Strategies",
  },
  {
    id: "3",
    title: "Inheritance Protection Guide",
    emoji: "🛡️",
    readTime: 10,
    content: "Learn how GuardiaVault protects your crypto assets for your family's future...",
    category: "Security",
  },
  {
    id: "4",
    title: "APY vs APR Explained",
    emoji: "📊",
    readTime: 6,
    content: "Understanding the difference between Annual Percentage Yield and Annual Percentage Rate...",
    category: "Education",
  },
  {
    id: "5",
    title: "Risk Management in DeFi",
    emoji: "⚖️",
    readTime: 8,
    content: "Best practices for managing risk when participating in decentralized finance...",
    category: "Security",
  },
  {
    id: "6",
    title: "Compound Interest Magic",
    emoji: "✨",
    readTime: 5,
    content: "How compound interest can exponentially grow your crypto portfolio over time...",
    category: "Education",
  },
];

export default function EducationHub() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [completedArticles, setCompletedArticles] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch articles from API
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setArticles(data);
        } else {
          // Fallback to mock data only in development
          if (process.env.NODE_ENV === "development") {
            setArticles(MOCK_ARTICLES);
          }
        }
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "EducationHub_fetchArticles",
        });
        // Fallback to mock data only in development
        if (process.env.NODE_ENV === "development") {
          setArticles(MOCK_ARTICLES);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();

    // Load completed articles from localStorage
    const saved = localStorage.getItem("completed_articles");
    if (saved) {
      setCompletedArticles(new Set(JSON.parse(saved)));
    }
  }, []);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
  };

  const handleCompleteArticle = async (articleId: string) => {
    const newCompleted = new Set(completedArticles);
    newCompleted.add(articleId);
    setCompletedArticles(newCompleted);
    localStorage.setItem(
      "completed_articles",
      JSON.stringify(Array.from(newCompleted))
    );

    // Check if all articles are completed
    if (newCompleted.size === articles.length && articles.length > 0) {
      try {
        // Notify backend to check education_complete achievement
        await fetch("/api/achievements/check", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          context: "EducationHub_checkAchievement",
        });
      }
    }
  };

  const progressPercentage =
    articles.length > 0
      ? (completedArticles.size / articles.length) * 100
      : 0;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <div className="text-center text-slate-400">Loading articles...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Education Hub</h3>
            <p className="text-sm text-slate-400">Learn about crypto & DeFi</p>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Learning Progress</span>
          <span className="text-sm font-semibold text-white">
            {completedArticles.size} / {articles.length} completed
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">
          {progressPercentage.toFixed(0)}% Complete
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => handleArticleClick(article)}
            className={`group relative p-6 rounded-xl border-2 transition-all text-left ${
              completedArticles.has(article.id)
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
            }`}
          >
            {completedArticles.has(article.id) && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            <div className="text-4xl mb-3">{article.emoji}</div>
            <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
              {article.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime} min
              </div>
              <span>•</span>
              <span>{article.category}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-5xl mb-3">{selectedArticle.emoji}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {selectedArticle.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedArticle.readTime} min read
                  </div>
                  <span>•</span>
                  <span>{selectedArticle.category}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-slate-300 leading-relaxed">
                {selectedArticle.content}
              </p>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-700/50">
              {!completedArticles.has(selectedArticle.id) && (
                <button
                  onClick={() => handleCompleteArticle(selectedArticle.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </button>
              )}
              <button
                onClick={() => setSelectedArticle(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

