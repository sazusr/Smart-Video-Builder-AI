import React from 'react';
import type { WizardStep } from '../../../types/storyVideo';
import { WIZARD_STEPS } from '../../../types/storyVideo';
import { Check, ChevronRight } from 'lucide-react';

interface ProgressTrackerProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  canNavigateTo: (step: WizardStep) => boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStep,
  onStepClick,
  canNavigateTo,
}) => {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);
  const percentComplete = Math.round(((currentIndex + 1) / WIZARD_STEPS.length) * 100);

  return (
    <div className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl p-3.5 sm:p-5 mb-7 shadow-sm">
      {/* ── Desktop Stepper (md+) ── */}
      <div className="hidden md:flex items-center justify-between gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = canNavigateTo(step.key);

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                  isCurrent
                    ? "bg-yellow-500/10 border-yellow-500"
                    : isCompleted
                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                    : "bg-[#1e293b] border-transparent text-slate-500 opacity-60"
                } ${isClickable ? "cursor-pointer hover:border-yellow-500/50" : "cursor-default"}`}
              >
                {/* Step Number Circle: ONLY contains the number or checkmark — NO long text inside! */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                    isCurrent
                      ? "bg-yellow-500 text-[#090d16] scale-105"
                      : isCompleted
                      ? "bg-emerald-500 text-black font-extrabold"
                      : "bg-[#090d16] text-slate-400 border border-slate-700"
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
                </div>

                {/* Step Label in its own dedicated block — completely separate from circle */}
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-bold truncate ${
                    isCurrent ? "text-yellow-500" : isCompleted ? "text-emerald-300" : "text-slate-400"
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {isCompleted ? "সম্পন্ন" : isCurrent ? "চলমান ধাপ" : "পরবর্তী"}
                  </div>
                </div>
              </button>

              {/* Connector Chevron between steps */}
              {index < WIZARD_STEPS.length - 1 && (
                <div className="text-slate-600 px-0.5 shrink-0">
                  <ChevronRight size={14} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Mobile Stepper (< md) ── */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-yellow-500 text-[#090d16] text-[11px] font-black flex items-center justify-center">
              {currentIndex + 1}
            </span>
            <span className="text-xs font-bold text-white">
              {WIZARD_STEPS[currentIndex]?.label || "গল্পের ধারণা"}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
            ধাপ {currentIndex + 1}/৫ ({percentComplete}%)
          </span>
        </div>

        {/* 5-segment progress bar */}
        <div className="grid grid-cols-5 gap-1.5">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <div
                key={step.key}
                className={`h-1.5 rounded-full transition-all ${
                  isCompleted ? "bg-emerald-400" : isCurrent ? "bg-yellow-500" : "bg-[#1e293b]"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
