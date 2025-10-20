"use client";

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import TypewriterText from './TypewriterText';

interface AnimatedCardProps {
  title: string;
  description: string;
  index: number;
  startAnimation: boolean;
  onAnimationComplete: () => void;
  onFeedbackClick: () => void;
  onDescriptionClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  renderDescription: () => string;
  skipTypewriter?: boolean;
  fastMode?: boolean;
  streamComplete?: boolean;
}

const AnimatedCard = memo(function AnimatedCard({
  title,
  description,
  index,
  startAnimation,
  onAnimationComplete,
  onFeedbackClick,
  onDescriptionClick,
  renderDescription,
  skipTypewriter = false,
  fastMode = false,
  streamComplete = false
}: AnimatedCardProps) {
  const hasCompletedRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Start animation immediately when startAnimation becomes true
  const showCard = startAnimation;
  const startTypewriter = startAnimation && !skipTypewriter;

  useEffect(() => {
    // Reset completion state when animation restarts
    if (!startAnimation) {
      hasCompletedRef.current = false;
      hasStartedRef.current = false;
    } else {
      hasStartedRef.current = true;
      
      // If skipping typewriter, immediately mark as complete
      if (skipTypewriter && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onAnimationComplete();
      }
    }
  }, [startAnimation, skipTypewriter, onAnimationComplete]);

  const handleTypewriterComplete = useCallback(() => {
    if (!hasCompletedRef.current && hasStartedRef.current) {
      hasCompletedRef.current = true;
      onAnimationComplete();
    }
  }, [onAnimationComplete]);

  // Simple approach - no glass effect, just normal cards

  return (
    <div
      className={`
        bg-white
        p-6 rounded-lg shadow-md border border-gray-200 
        transform transition-all duration-500 ease-out
        ${showCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-semibold text-gray-800 transition-opacity duration-300 ${showCard ? 'opacity-100' : 'opacity-0'}`}>
          {title}
        </h3>
        <button
          onClick={onFeedbackClick}
          className={`text-gray-400 hover:text-gray-600 transition-all duration-300 ${showCard ? 'opacity-100' : 'opacity-0'}`}
          title="Provide feedback"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
      
      <div 
        className="text-gray-600 leading-relaxed min-h-[100px]"
        onClick={onDescriptionClick}
      >
        {(skipTypewriter || fastMode) && showCard ? (
          // Show content immediately without typewriter effect when fastMode or skipTypewriter
          <div dangerouslySetInnerHTML={{ __html: renderDescription() }} />
        ) : startTypewriter ? (
          // Show with typewriter effect
          <TypewriterText 
            text={description}
            speed={30}
            onComplete={handleTypewriterComplete}
            renderAsHtml={true}
            htmlContent={renderDescription()}
            fastMode={fastMode}
          />
        ) : (
          // Show loading skeleton
          <div className="space-y-2">
            <div className="h-4 animate-pulse bg-gray-100 rounded w-full" />
            <div className="h-4 animate-pulse bg-gray-100 rounded w-5/6" />
            <div className="h-4 animate-pulse bg-gray-100 rounded w-4/6" />
          </div>
        )}
      </div>
    </div>
  );
});

export default AnimatedCard;
