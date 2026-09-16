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

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: '24px 16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        marginBottom: '24px',
      }}
      className="progress-tracker-container"
    >
      <style>{`
        .progress-tracker-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 'max-content',
          margin: '0 auto',
          position: 'relative',
          justifyContent: 'space-between',
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
                  opacity: isClickable || isCurrent ? 1 : 0.5,
                  position: 'relative',
                  zIndex: 2,
                  gap: '8px',
                  width: '90px',
                }}
                onClick={() => {
                  if (isClickable) {
                    onStepClick(step.key);
                  }
                }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? '#22d3a0'
                      : isCurrent
                      ? 'var(--accent-primary)'
                      : 'var(--bg-secondary)',
                    borderColor: isCurrent || isCompleted ? 'transparent' : 'var(--border)',
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    color: '#fff',
                    boxShadow: isCurrent ? '0 0 15px rgba(108, 71, 255, 0.4)' : 'none',
                    background: isCurrent ? 'var(--gradient-brand)' : undefined,
                  }}
                >
                  {isCompleted ? (
                    <Check size={20} color="#000" />
                  ) : (
                    <span style={{ fontSize: '18px' }}>{step.icon}</span>
                  )}
                </motion.div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: isCurrent ? 600 : 400,
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
                    height: '2px',
                    backgroundColor: 'var(--border)',
                    position: 'relative',
                    minWidth: '40px',
                    marginTop: '-24px',
                    zIndex: 1,
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      width: isCompleted ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
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
  );
};
