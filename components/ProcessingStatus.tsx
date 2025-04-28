import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { ProcessingState, ProcessingStep } from '../utils/types';

// Define step durations and weights for progress calculation
const STEP_CONFIG: Record<ProcessingStep, { weight: number; avgDuration: number }> = {
  [ProcessingStep.UPLOADING]: { weight: 10, avgDuration: 2 }, // 10% of total progress, ~2 seconds
  [ProcessingStep.ANALYZING]: { weight: 40, avgDuration: 8 },  // 40% of total progress, ~8 seconds
  [ProcessingStep.GENERATING]: { weight: 40, avgDuration: 10 }, // 40% of total progress, ~10 seconds
  [ProcessingStep.FORMATTING]: { weight: 10, avgDuration: 2 }, // 10% of total progress, ~2 seconds
  [ProcessingStep.COMPLETED]: { weight: 0, avgDuration: 0 }, // Not used in calculations
  [ProcessingStep.FAILED]: { weight: 0, avgDuration: 0 }, // Not used in calculations
};

// Icons for each step
const STEP_ICONS = {
  [ProcessingStep.UPLOADING]: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  [ProcessingStep.ANALYZING]: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  [ProcessingStep.GENERATING]: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  [ProcessingStep.FORMATTING]: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  [ProcessingStep.COMPLETED]: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  [ProcessingStep.FAILED]: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

interface ProcessingStatusProps {
  processingState: ProcessingState;
  onRetry?: () => void;
  onCancel?: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  processingState,
  onRetry,
  onCancel
}) => {
  const { t } = useTranslation('common');
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    if (!processingState.isProcessing) return;
    
    const interval = setInterval(() => {
      if (processingState.startTime) {
        const elapsed = Math.floor((new Date().getTime() - processingState.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [processingState.isProcessing, processingState.startTime]);

  // Initialize animated progress to match initial processing state progress
  useEffect(() => {
    // Set initial animated progress when component mounts
    setAnimatedProgress(processingState.progress);
  }, [processingState.progress]);
  
  // Animate progress bar
  useEffect(() => {
    // Always update animated progress to match processing state progress
    // for smoother animation - round to 1 decimal place for smoother transitions
    const roundedProgress = Math.floor(processingState.progress * 10) / 10;
    
    // Always animate regardless of the difference to ensure continuous animation
    const timer = setTimeout(() => {
      if (animatedProgress < roundedProgress) {
        // Moving up - increase by small increments for smooth animation
        setAnimatedProgress(prev => Math.min(prev + 0.5, roundedProgress));
      } else if (animatedProgress > roundedProgress) {
        // Moving down - decrease by small increments for smooth animation
        setAnimatedProgress(prev => Math.max(prev - 0.5, roundedProgress));
      }
    }, 20); // Shorter timeout for smoother animation
    
    return () => clearTimeout(timer);
  }, [animatedProgress, processingState.progress]);

  // Calculate step completion
  const getStepStatus = (step: ProcessingStep) => {
    if (processingState.currentStep === step) return 'active';
    
    const stepOrder = Object.values(ProcessingStep);
    const currentStepIndex = stepOrder.indexOf(processingState.currentStep);
    const thisStepIndex = stepOrder.indexOf(step);
    
    if (thisStepIndex < currentStepIndex) return 'completed';
    return 'pending';
  };

  // Format time remaining
  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return t('processing.calculating');
    if (seconds < 60) return t('processing.timeRemainingSec', { seconds });
    return t('processing.timeRemainingMin', { minutes: Math.ceil(seconds / 60) });
  };

  // Get CSS classes for step indicator
  const getStepClasses = (step: ProcessingStep) => {
    const status = getStepStatus(step);
    let baseClasses = 'flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300';
    
    if (status === 'active') {
      baseClasses += ' bg-primary text-white';
    } else if (status === 'completed') {
      baseClasses += ' bg-primary/20 text-primary';
    } else {
      baseClasses += ' bg-background-alt text-text-muted';
    }
    
    return baseClasses;
  };

  // Set up steps to display
  const steps = [
    { key: ProcessingStep.UPLOADING, label: t('processing.uploading', 'Uploading') },
    { key: ProcessingStep.ANALYZING, label: t('processing.analyzing', 'Analyzing') },
    { key: ProcessingStep.GENERATING, label: t('processing.generating', 'Generating') },
    { key: ProcessingStep.FORMATTING, label: t('processing.formatting', 'Formatting') },
  ];

  // Calculate overall progress values
  // Properly round the progress percentage for display (not for animation)
  const progressPercentage = `${Math.round(animatedProgress)}%`;
  const timeRemaining = formatTimeRemaining(processingState.estimatedTimeRemaining);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-card">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-text-primary font-medium">
            {processingState.statusMessage}
          </div>
          <div className="text-text-secondary text-sm">
            {progressPercentage}
          </div>
        </div>
        <div className="w-full bg-background-alt rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: progressPercentage }}
          />
        </div>
        
        {/* Time information */}
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <div>
            {t('processing.elapsed', 'Elapsed')}: {elapsedTime}s
          </div>
          <div>
            {t('processing.remaining', 'Remaining')}: {timeRemaining}
          </div>
        </div>
      </div>

      {/* Processing steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            {/* Step icon */}
            <div className={`${getStepClasses(step.key)} ${getStepStatus(step.key) === 'active' ? 'animate-pulse' : ''}`}>
              {STEP_ICONS[step.key]}
            </div>
            
            {/* Step label and progress */}
            <div className="ml-4 flex-grow">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium ${
                  getStepStatus(step.key) === 'active' 
                    ? 'text-primary' 
                    : getStepStatus(step.key) === 'completed'
                      ? 'text-text-primary'
                      : 'text-text-muted'
                }`}>
                  {step.label}
                </span>
                
                {getStepStatus(step.key) === 'active' && (
                  <span className="text-xs text-text-secondary">
                    {Math.round(processingState.stepProgress)}%
                  </span>
                )}
              </div>
              
              {/* Step progress for active step */}
              {getStepStatus(step.key) === 'active' && (
                <div className="w-full bg-background-alt/50 rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full bg-primary/60 transition-all duration-300 rounded-full"
                    style={{ width: `${processingState.stepProgress}%` }}
                  />
                </div>
              )}
            </div>
            
            {/* Completion indicator */}
            {getStepStatus(step.key) === 'completed' && (
              <div className="ml-2 text-success">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error state & controls */}
      {processingState.currentStep === ProcessingStep.FAILED && processingState.error && (
        <div className="mt-6">
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">{t('processing.error', 'Processing Error')}</p>
                <p className="mt-1 text-sm">{processingState.error}</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {onRetry && (
              <button 
                className="btn btn-primary btn-sm flex-1"
                onClick={onRetry}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('processing.retry', 'Retry')}
              </button>
            )}
            
            {onCancel && (
              <button 
                className="btn btn-outline btn-sm flex-1"
                onClick={onCancel}
              >
                {t('processing.cancel', 'Cancel')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;