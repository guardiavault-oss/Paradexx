import { Check } from "lucide-react";

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
}

export default function WizardProgress({
  steps,
  currentStep,
}: WizardProgressProps) {
  return (
    <div className="w-full" data-testid="wizard-progress">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-primary text-primary-foreground glow-primary"
                        : isCurrent
                        ? "bg-primary/20 text-primary border-2 border-primary glow-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                  data-testid={`step-${step.id}`}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isCurrent
                        ? "text-foreground"
                        : isCompleted
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mb-12">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted ? "bg-primary" : "bg-border"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
