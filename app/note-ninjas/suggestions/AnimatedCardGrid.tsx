"use client";

import { useState, useEffect, useRef } from 'react';
import AnimatedCard from './AnimatedCard';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  exercises?: any[];
  cptCodes: any[];
}

interface AnimatedCardGridProps {
  suggestions: Suggestion[];
  isLoadingStream: boolean;
  streamComplete: boolean;
  streamedSubsectionsCount: number;
  onFeedbackClick: (index: number) => void;
  onDescriptionClick: (index: number, e: React.MouseEvent<HTMLDivElement>) => void;
  isFirstTimeGeneration?: boolean;
  renderDescription?: (index: number) => string;
  fastMode?: boolean;
}

export default function AnimatedCardGrid({
  suggestions,
  isLoadingStream,
  streamComplete,
  streamedSubsectionsCount,
  onFeedbackClick,
  onDescriptionClick,
  renderDescription,
  isFirstTimeGeneration = false,
  fastMode = false,
}: AnimatedCardGridProps) {
  const [animatedCards, setAnimatedCards] = useState<Set<string>>(new Set());
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Always show all cards immediately to prevent hiding/reappearing
    const allSuggestionIds = new Set(suggestions.map(s => s.id));
    if (allSuggestionIds.size > 0) {
      setAnimatedCards(allSuggestionIds);
    }
  }, [suggestions.length]); // Only depend on length to prevent unnecessary re-renders

  const handleCardAnimationComplete = (suggestionId: string) => {
    setCompletedCards(prev => new Set([...prev, suggestionId]));
  };

  // Show initial loading only when no suggestions are available yet
  if (isLoadingStream && suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-800">Analyzing your case...</h3>
          <p className="text-gray-600">Generating personalized treatment recommendations</p>
        </div>
      </div>
    );
  }

  // Keep all suggestions visible, including placeholders
  const validSuggestions = suggestions.filter(suggestion => 
    suggestion.title && suggestion.description
  );

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {validSuggestions.map((suggestion, index) => (
          <AnimatedCard
            key={suggestion.id}
            title={suggestion.title}
            description={suggestion.description}
            index={index}
            startAnimation={animatedCards.has(suggestion.id)}
            onAnimationComplete={() => handleCardAnimationComplete(suggestion.id)}
            onFeedbackClick={() => onFeedbackClick(index)}
            onDescriptionClick={(e) => onDescriptionClick(index, e)}
            renderDescription={() => renderDescription?.(index) || suggestion.description}
            skipTypewriter={!isFirstTimeGeneration}
            fastMode={fastMode}
          />
        ))}
      </div>

      {/* Show a simple completion message when all done */}
      {streamComplete && validSuggestions.length > 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            All recommendations ready!
          </div>
        </div>
      )}
    </div>
  );
}
