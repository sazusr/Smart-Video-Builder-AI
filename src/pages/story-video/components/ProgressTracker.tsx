import React from 'react';
import { motion } from 'framer-motion';
import type { WizardStep } from '../../../types/storyVideo';
import { WIZARD_STEPS } from '../../../types/storyVideo';
import { Check } from 'lucide-react';

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
  const currentStepObj = WIZARD_STEPS[currentIndex] || WIZARD_STEPS[0];
  const percentComplete = Math.round(((currentIndex + 1) / WIZARD_STEPS.length) * 100);

  return (
    <div
      style={{
        width: '100%',
        padding: '12px 14px',
        border: '1px solid var(--border-light)',
        background: 'var(--bg-panel)',
        borderRadius: '16px',
        marginBottom: '14px',
      }}
    >
      {/* ── Mobile Compact View (< 640px) ──────────────────────────────── */}
      <div className="block sm:hidden">
        {/* Top Info Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>{currentStepObj.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              ধাপ {currentIndex + 1}/৫: {currentStepObj.label}
            </span>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: 99,
            background: 'rgba(108, 71, 255, 0.15)',
            color: '#a78bfa',
            border: '1px solid rgba(108, 71, 255, 0.3)',
          }}>
            {percentComplete}% সম্পন্ন
          </span>
        </div>

        {/* 5 Segmented Progress Bars (Instagram / Duolingo style) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isClickable = canNavigateTo(step.key);

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                title={step.label}
                style={{
                  height: 6,
                  borderRadius: 99,
                  border: 'none',
                  cursor: isClickable ? 'pointer' : 'default',
                  background: isCompleted
                    ? '#22d3a0'
                    : isCurrent
                    ? 'linear-gradient(90deg, #6c47ff, #a78bfa)'
                    : 'var(--border-light)',
                  boxShadow: isCurrent ? '0 0 8px rgba(108, 71, 255, 0.6)' : 'none',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Desktop Full Stepper (>= 640px) ────────────────────────────── */}
      <div className="hidden sm:block">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            justifyContent: 'space-between',
            padding: '8px 8px 4px',
          }}
        >
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isClickable = canNavigateTo(step.key);

            return (
              <React.Fragment key={step.key}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: isClickable || isCurrent ? 1 : 0.45,
                    position: 'relative',
                    zIndex: 2,
                    gap: 6,
                    minWidth: 70,
                  }}
                  onClick={() => isClickable && onStepClick(step.key)}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.08 : 1,
                      backgroundColor: isCompleted
                        ? '#22d3a0'
                        : isCurrent
                        ? 'var(--accent-primary)'
                        : 'var(--bg-secondary)',
                      borderColor: isCurrent || isCompleted ? 'transparent' : 'var(--border)',
                    }}
                    transition={{ duration: 0.25 }}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid',
                      color: '#fff',
                      boxShadow: isCurrent ? '0 0 14px rgba(108, 71, 255, 0.4)' : 'none',
                      background: isCurrent ? 'var(--gradient-brand)' : undefined,
                    }}
                  >
                    {isCompleted ? (
                      <Check size={16} color="#000" strokeWidth={3} />
                    ) : (
                      <span style={{ fontSize: 15 }}>{step.icon}</span>
                    )}
                  </motion.div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {step.label}
                  </div>
                </div>

                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: 'var(--border)',
                      position: 'relative',
                      marginTop: -20,
                      zIndex: 1,
                    }}
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        width: isCompleted ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{
                        height: '100%',
                        backgroundColor: '#22d3a0',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
