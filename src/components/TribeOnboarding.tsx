import { useState } from "react";
import Assessment from "./landing/Assessment";
import { motion } from "motion/react";

interface TribeOnboardingProps {
  onComplete: (results: any) => void;
}

export default function TribeOnboarding({ onComplete }: TribeOnboardingProps) {
  const [showResults, setShowResults] = useState(false);

  const handleShowResults = () => {
    setShowResults(true);
  };

  const handleComplete = (results: any) => {
    // Pass results up with tribe information
    onComplete({
      tribe: results.degenPercent > 50 ? "degen" : "regen",
      degenPercent: results.degenPercent,
      regenPercent: results.regenPercent,
      ...results,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 w-full h-full"
    >
      <Assessment
        initialTribe={null}
        onComplete={handleComplete}
        onShowResults={handleShowResults}
        showResults={showResults}
      />
    </motion.div>
  );
}
