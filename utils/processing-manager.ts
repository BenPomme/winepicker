/**
 * Processing manager to keep track of wine analysis status and progress
 */

import { ProcessingState, ProcessingStep } from './types';

// Processing step configuration
const STEP_CONFIG: Record<ProcessingStep, { weight: number; avgDuration: number }> = {
  [ProcessingStep.UPLOADING]: { weight: 10, avgDuration: 2 }, // 10% of total progress, ~2 seconds
  [ProcessingStep.ANALYZING]: { weight: 40, avgDuration: 8 }, // 40% of total progress, ~8 seconds
  [ProcessingStep.GENERATING]: { weight: 40, avgDuration: 10 }, // 40% of total progress, ~10 seconds
  [ProcessingStep.FORMATTING]: { weight: 10, avgDuration: 2 }, // 10% of total progress, ~2 seconds
  [ProcessingStep.COMPLETED]: { weight: 0, avgDuration: 0 }, // Not used in calculations
  [ProcessingStep.FAILED]: { weight: 0, avgDuration: 0 }, // Not used in calculations
};

// Get total expected duration for all steps
const TOTAL_DURATION = Object.values(STEP_CONFIG).reduce((sum, step) => sum + step.avgDuration, 0);

// For smooth progress, set step transitions slightly before actual completion
const TRANSITION_THRESHOLD = 0.9;

/**
 * Initialize a new processing state
 */
export function initProcessingState(jobId?: string): ProcessingState {
  return {
    isProcessing: true,
    currentStep: ProcessingStep.UPLOADING,
    progress: 0,
    stepProgress: 0,
    startTime: new Date(),
    estimatedTimeRemaining: TOTAL_DURATION,
    statusMessage: 'Preparing to upload your image...',
    error: null,
    jobId
  };
}

/**
 * Update processing state based on backend status
 */
export function updateProcessingState(
  currentState: ProcessingState, 
  backendStatus: string | undefined, 
  error?: string | null,
  isClientUpdate = false // Flag to indicate if this is a client-side progress update
): ProcessingState {
  const now = new Date();
  const elapsedTime = currentState.startTime 
    ? (now.getTime() - currentState.startTime.getTime()) / 1000 
    : 0;

  // If there's an error, update to failed state
  if (error) {
    return {
      ...currentState,
      isProcessing: false,
      currentStep: ProcessingStep.FAILED,
      progress: 100,
      stepProgress: 100,
      estimatedTimeRemaining: 0,
      statusMessage: 'Processing failed',
      error
    };
  }
  
  // For client-side updates (between polling), just increment progress slightly
  if (isClientUpdate && currentState.isProcessing) {
    // Calculate how much to increment for smooth progress
    const currentStep = currentState.currentStep;
    const stepDuration = STEP_CONFIG[currentStep].avgDuration;
    const pollingInterval = 3; // seconds between polls
    const updateInterval = 0.5; // seconds between client updates (500ms)
    
    // Calculate how much progress to add per second for this step (based on weight)
    const progressPerSecond = (STEP_CONFIG[currentStep].weight / 100) * (100 / stepDuration);
    
    // Add a small increment for each update
    // This gives a smoother progress that doesn't jump too fast
    // The smaller the update interval, the smaller each increment should be
    const increment = progressPerSecond * updateInterval * 0.8; // 80% of theoretical increment for smoother appearance
    
    // Calculate new step progress
    const stepIncrement = (100 / stepDuration) * updateInterval * 0.8;
    const newStepProgress = Math.min(95, currentState.stepProgress + stepIncrement);
    
    // Calculate overall progress by adding a small amount
    const newProgress = Math.min(95, currentState.progress + increment);
    
    // Calculate a smooth decrement for estimated time remaining
    const timeDecrease = updateInterval * 0.8; // 80% of update interval for smoother countdown
    
    // Don't round progress for smoother animation (rounding happens in the UI)
    return {
      ...currentState,
      progress: newProgress,
      stepProgress: newStepProgress,
      estimatedTimeRemaining: Math.max(0, (currentState.estimatedTimeRemaining || 10) - timeDecrease)
    };
  }

  // Map backend status to our step
  let updatedStep = currentState.currentStep;
  
  switch (backendStatus) {
    case 'uploading':
      updatedStep = ProcessingStep.UPLOADING;
      break;
    case 'processing':
    case 'processing_started':
      // If we were uploading and now processing, move to analyzing step
      if (currentState.currentStep === ProcessingStep.UPLOADING) {
        updatedStep = ProcessingStep.ANALYZING;
      } 
      // If we've been in analyzing step for a while, transition to generating
      else if (
        currentState.currentStep === ProcessingStep.ANALYZING && 
        elapsedTime > STEP_CONFIG[ProcessingStep.ANALYZING].avgDuration * TRANSITION_THRESHOLD
      ) {
        updatedStep = ProcessingStep.GENERATING;
      }
      break;
    case 'completed':
      return {
        ...currentState,
        isProcessing: false,
        currentStep: ProcessingStep.COMPLETED,
        progress: 100,
        stepProgress: 100,
        estimatedTimeRemaining: 0,
        statusMessage: 'Processing complete'
      };
    case 'failed':
    case 'trigger_failed':
      return {
        ...currentState,
        isProcessing: false,
        currentStep: ProcessingStep.FAILED,
        progress: 100,
        stepProgress: 100,
        estimatedTimeRemaining: 0,
        statusMessage: 'Processing failed',
        error: error || 'An unexpected error occurred during processing.'
      };
    case 'not_found':
      return {
        ...currentState,
        isProcessing: false,
        currentStep: ProcessingStep.FAILED,
        progress: 100,
        stepProgress: 100,
        estimatedTimeRemaining: 0,
        statusMessage: 'Processing job not found',
        error: 'The processing job could not be found or may have expired.'
      };
  }

  // Check if we have partial results for multiple wines
  let partialInfo = null;
  let additionalProgress = 0;
  
  if (backendStatus === 'processing' && backendStatus) {
    partialInfo = backendStatus.partialInfo;
    
    // If we're getting partial results with wine processing progress
    if (partialInfo && partialInfo.processedCount !== undefined && partialInfo.totalCount > 0) {
      console.log(`Processing multiple wines: ${partialInfo.processedCount}/${partialInfo.totalCount}`);
      
      // Calculate additional progress based on wine processing
      if (updatedStep === ProcessingStep.GENERATING || updatedStep === ProcessingStep.ANALYZING) {
        const wineProgressFraction = partialInfo.processedCount / partialInfo.totalCount;
        additionalProgress = wineProgressFraction * 20; // Boost progress by up to 20% based on wine count
      }
    }
  }
  
  // Calculate progress for current step based on elapsed time
  const stepDuration = STEP_CONFIG[updatedStep].avgDuration;
  const stepElapsedTime = updatedStep === currentState.currentStep
    ? elapsedTime - getElapsedTimeForPreviousSteps(updatedStep)
    : 0;
  
  // Cap at 95% for the current step
  let newStepProgress = Math.min(95, (stepElapsedTime / stepDuration) * 100);
  
  // Adjust step progress for wine processing if applicable
  if (partialInfo && (updatedStep === ProcessingStep.GENERATING || updatedStep === ProcessingStep.ANALYZING)) {
    newStepProgress = Math.max(newStepProgress, (partialInfo.processedCount / partialInfo.totalCount) * 95);
  }
  
  // Calculate overall progress based on weights and step progress
  const progressFromPreviousSteps = getProgressForCompletedSteps(updatedStep);
  const stepProgressWeight = STEP_CONFIG[updatedStep].weight / 100;
  let overallProgress = progressFromPreviousSteps + (newStepProgress * stepProgressWeight) + additionalProgress;
  
  // Ensure overall progress doesn't exceed 95% unless completed
  if (backendStatus !== 'completed') {
    overallProgress = Math.min(95, overallProgress);
  }
  
  // Estimate time remaining
  let estimatedTimeRemaining = 0;
  
  if (partialInfo && partialInfo.totalCount > 1) {
    // For multiple wines, estimate based on wines progress
    const winesRemaining = partialInfo.totalCount - partialInfo.processedCount;
    const timePerWine = elapsedTime / (partialInfo.processedCount || 1);
    estimatedTimeRemaining = Math.max(0, winesRemaining * timePerWine);
  } else {
    // Regular estimation
    const totalProgressFraction = overallProgress / 100;
    if (totalProgressFraction > 0.1) { // Only calculate if we have meaningful progress
      const estimatedTotalTime = elapsedTime / totalProgressFraction;
      estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);
    } else {
      estimatedTimeRemaining = TOTAL_DURATION - elapsedTime;
    }
  }
  
  // Step-based status messages
  let statusMessage = 'Processing your wine image...';
  
  // If we have partial info about multiple wines, include it in the status message
  if (partialInfo && partialInfo.totalCount > 1) {
    switch (updatedStep) {
      case ProcessingStep.UPLOADING:
        statusMessage = 'Uploading your image...';
        break;
      case ProcessingStep.ANALYZING:
        statusMessage = `Analyzing ${partialInfo.processedCount}/${partialInfo.totalCount} wine labels...`;
        break;
      case ProcessingStep.GENERATING:
        statusMessage = `Generating details for ${partialInfo.processedCount}/${partialInfo.totalCount} wines...`;
        break;
      case ProcessingStep.FORMATTING:
        statusMessage = 'Preparing your results...';
        break;
    }
  } else {
    // Regular single wine status messages
    switch (updatedStep) {
      case ProcessingStep.UPLOADING:
        statusMessage = 'Uploading your image...';
        break;
      case ProcessingStep.ANALYZING:
        statusMessage = 'Analyzing the wine label...';
        break;
      case ProcessingStep.GENERATING:
        statusMessage = 'Generating wine details and ratings...';
        break;
      case ProcessingStep.FORMATTING:
        statusMessage = 'Preparing your results...';
        break;
    }
  }
  
  return {
    ...currentState,
    currentStep: updatedStep,
    progress: Math.round(overallProgress),
    stepProgress: Math.round(newStepProgress),
    estimatedTimeRemaining: Math.max(0, Math.round(estimatedTimeRemaining)),
    statusMessage
  };
}

/**
 * Get total progress percentage for all steps completed before the current step
 */
function getProgressForCompletedSteps(currentStep: ProcessingStep): number {
  let progress = 0;
  const steps = Object.values(ProcessingStep);
  const currentIndex = steps.indexOf(currentStep);
  
  for (let i = 0; i < currentIndex; i++) {
    const step = steps[i];
    if (step in STEP_CONFIG) {
      progress += STEP_CONFIG[step as keyof typeof STEP_CONFIG].weight;
    }
  }
  
  return progress;
}

/**
 * Get elapsed time for all steps completed before the current step
 */
function getElapsedTimeForPreviousSteps(currentStep: ProcessingStep): number {
  let time = 0;
  const steps = Object.values(ProcessingStep);
  const currentIndex = steps.indexOf(currentStep);
  
  for (let i = 0; i < currentIndex; i++) {
    const step = steps[i];
    if (step in STEP_CONFIG) {
      time += STEP_CONFIG[step as keyof typeof STEP_CONFIG].avgDuration;
    }
  }
  
  return time;
}