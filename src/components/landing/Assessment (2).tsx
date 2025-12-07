import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Shield, Zap } from "lucide-react";

type Question = {
  id: number;
  question: string;
  degen: { text: string; value: number };
  regen: { text: string; value: number };
};

const assessmentQuestions: Question[] = [
  {
    id: 1,
    question: "A token pumps 40% in an hour. Your move?",
    degen: {
      text: "Ape in - momentum is everything",
      value: 10,
    },
    regen: {
      text: "Wait for pullback, assess fundamentals",
      value: 0,
    },
  },
  {
    id: 2,
    question: "Your ideal portfolio check frequency?",
    degen: {
      text: "Every few minutes - I need the pulse",
      value: 10,
    },
    regen: {
      text: "Weekly or monthly - noise is the enemy",
      value: 0,
    },
  },
  {
    id: 3,
    question:
      "A project you invested in just rugged. Reaction?",
    degen: { text: "Part of the game. Next play.", value: 10 },
    regen: {
      text: "Deep dive what I missed. Never again.",
      value: 0,
    },
  },
  {
    id: 4,
    question: "What does winning in crypto look like?",
    degen: {
      text: "100x gains that change my life overnight",
      value: 10,
    },
    regen: {
      text: "Steady growth that outlasts market cycles",
      value: 0,
    },
  },
  {
    id: 5,
    question: "How do you research new investments?",
    degen: {
      text: "Twitter hype, chart patterns, gut feeling",
      value: 10,
    },
    regen: {
      text: "Team credentials, tokenomics, roadmap analysis",
      value: 0,
    },
  },
  {
    id: 6,
    question: "Your strategy during a market crash?",
    degen: {
      text: "Buy the dip aggressively - blood in the streets",
      value: 10,
    },
    regen: {
      text: "Dollar-cost average with preset allocations",
      value: 0,
    },
  },
  {
    id: 7,
    question: "You hit a 10x on a position. What's next?",
    degen: {
      text: "Let it ride - could be 100x tomorrow",
      value: 10,
    },
    regen: {
      text: "Take profits, secure the win, rebalance",
      value: 0,
    },
  },
  {
    id: 8,
    question: "How important is community sentiment?",
    degen: {
      text: "Everything - memes fuel the moon mission",
      value: 10,
    },
    regen: {
      text: "Nice-to-have, but fundamentals come first",
      value: 0,
    },
  },
  {
    id: 9,
    question: "Your approach to portfolio diversification?",
    degen: {
      text: "All-in on 1-3 high-conviction plays",
      value: 10,
    },
    regen: {
      text: "Balanced across 10+ assets and sectors",
      value: 0,
    },
  },
];

interface AssessmentProps {
  initialTribe: "degen" | "regen";
  onComplete: (results: {
    originalTribe: "degen" | "regen";
    degenPercent: number;
    regenPercent: number;
  }) => void;
  onShowResults?: () => void;
  showResults?: boolean;
}

export default function Assessment({
  initialTribe,
  onComplete,
  onShowResults,
  showResults = false,
}: AssessmentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Randomize question order on mount
  const [randomizedQuestions] = useState(() => {
    return assessmentQuestions.map(q => ({
      ...q,
      // Randomly swap the order (true = degen first, false = regen first)
      swapped: Math.random() > 0.5
    }));
  });

  const isDegen = initialTribe === "degen";

  // Theme colors
  const colors = {
    primary: isDegen ? "#ff3366" : "#00d4ff",
    secondary: isDegen ? "#ff6b6b" : "#00ff88",
    bg: isDegen ? "#1a0505" : "#001019",
    text: "#ffffff",
  };

  const handleAnswer = (value: number) => {
    const newScore = totalScore + value;

    if (currentQuestionIndex < randomizedQuestions.length - 1) {
      setTotalScore(newScore);
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setTotalScore(newScore);
      setIsCompleted(true);
      if (onShowResults) onShowResults();
    }
  };

  const currentQuestion =
    randomizedQuestions[currentQuestionIndex];

  // Calculate results
  const degenPercent = Math.round((totalScore / 90) * 100); // Max score is 90 (9 questions * 10 points)
  const regenPercent = 100 - degenPercent;

  const matchPercentage = isDegen ? degenPercent : regenPercent;

  let tagline = "";
  if (matchPercentage > 70) {
    tagline = `Pure ${initialTribe === "degen" ? "Degen" : "Regen"}. The fire burns true.`;
  } else if (matchPercentage >= 50) {
    tagline = `A ${initialTribe === "degen" ? "Degen" : "Regen"} with ${initialTribe === "degen" ? "Regen" : "Degen"} instincts. Balanced chaos.`;
  } else {
    tagline = `You chose ${initialTribe === "degen" ? "Degen" : "Regen"}, but ${initialTribe === "degen" ? "Regen" : "Degen"} runs deep. Embrace the contrast.`;
  }

  const handleFinish = () => {
    onComplete({
      originalTribe: initialTribe,
      degenPercent,
      regenPercent,
    });
  };

  if (isCompleted && showResults) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white font-['Rajdhani'] overflow-y-auto py-8 md:py-0">
        {/* Background Effects */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${colors.primary}40 0%, transparent 70%)`,
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-2xl px-6 py-8 md:p-8 text-center my-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex justify-center"
          >
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center border-4"
              style={{
                borderColor: colors.primary,
                boxShadow: `0 0 40px ${colors.primary}80`,
                background: `linear-gradient(135deg, ${colors.primary}20, transparent)`,
              }}
            >
              {initialTribe === "degen" ? (
                <Zap size={64} color={colors.primary} />
              ) : (
                <Shield size={64} color={colors.primary} />
              )}
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-6xl font-bold mb-2 uppercase tracking-wider"
            style={{ textShadow: `0 0 20px ${colors.primary}` }}
          >
            {initialTribe}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-2xl md:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
          >
            {degenPercent}% Degen / {regenPercent}% Regen
          </motion.div>

          {/* Spectrum Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-4 w-full bg-gray-800 rounded-full mb-8 overflow-hidden relative"
          >
            <div
              className="h-full absolute left-0 top-0 transition-all duration-1000 ease-out"
              style={{
                width: `${degenPercent}%`,
                background:
                  "linear-gradient(90deg, #ff3366, #ff6b6b)",
              }}
            />
            <div
              className="h-full absolute right-0 top-0 transition-all duration-1000 ease-out"
              style={{
                width: `${regenPercent}%`,
                background:
                  "linear-gradient(90deg, #00d4ff, #00ff88)",
              }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="text-lg md:text-xl text-gray-300 mb-8 md:mb-12 italic px-4"
          >
            "{tagline}"
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFinish}
            className="px-8 md:px-12 py-3 md:py-4 rounded-full text-lg md:text-xl font-bold uppercase tracking-widest transition-all"
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 0 30px ${colors.primary}60`,
            }}
          >
            ENTER PARADEX
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white font-['Rajdhani'] overflow-y-auto py-8 md:py-0">
      {/* Background Mesh/Particles Placeholder */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${colors.primary}20 0%, transparent 80%)`,
          }}
        />
      </div>

      <div className="w-full max-w-4xl px-4 md:px-6 relative z-10 my-auto">
        <motion.div
          key="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12 text-center"
        >
          <h3 className="text-lg md:text-xl text-gray-400 uppercase tracking-[0.2em] mb-2">
            Identity Verification
          </h3>
          <h2 className="text-2xl md:text-3xl font-bold">
            Let's confirm your nature
          </h2>

          {/* Progress Bars */}
          <div className="flex justify-center gap-2 mt-6">
            {randomizedQuestions.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 w-12 rounded-full transition-all duration-300 ${
                  idx <= currentQuestionIndex
                    ? "bg-white"
                    : "bg-gray-800"
                }`}
                style={{
                  backgroundColor:
                    idx <= currentQuestionIndex
                      ? colors.primary
                      : undefined,
                  boxShadow:
                    idx === currentQuestionIndex
                      ? `0 0 10px ${colors.primary}`
                      : undefined,
                }}
              />
            ))}
          </div>
        </motion.div>

        <div className="relative min-h-[400px] md:min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-8 md:mb-12 text-center leading-tight px-2">
                {currentQuestion.question}
              </h1>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* Randomize which option appears first */}
                {currentQuestion.swapped ? (
                  <>
                    {/* Regen First */}
                    <button
                      onClick={() =>
                        handleAnswer(currentQuestion.regen.value)
                      }
                      className="group relative p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity text-white ml-auto" size={20} />
                      </div>
                      <p className="text-lg md:text-2xl font-semibold leading-snug">
                        {currentQuestion.regen.text}
                      </p>
                    </button>

                    {/* Degen Second */}
                    <button
                      onClick={() =>
                        handleAnswer(currentQuestion.degen.value)
                      }
                      className="group relative p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity text-white ml-auto" size={20} />
                      </div>
                      <p className="text-lg md:text-2xl font-semibold leading-snug">
                        {currentQuestion.degen.text}
                      </p>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Degen First */}
                    <button
                      onClick={() =>
                        handleAnswer(currentQuestion.degen.value)
                      }
                      className="group relative p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity text-white ml-auto" size={20} />
                      </div>
                      <p className="text-lg md:text-2xl font-semibold leading-snug">
                        {currentQuestion.degen.text}
                      </p>
                    </button>

                    {/* Regen Second */}
                    <button
                      onClick={() =>
                        handleAnswer(currentQuestion.regen.value)
                      }
                      className="group relative p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity text-white ml-auto" size={20} />
                      </div>
                      <p className="text-lg md:text-2xl font-semibold leading-snug">
                        {currentQuestion.regen.text}
                      </p>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}