"use client";

import SimpleCard from './SimpleCard';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  exercises?: any[];
  cptCodes: any[];
}

interface CardGridProps {
  suggestions: Suggestion[];
  isLoadingStream: boolean;
  onFeedbackClick: (index: number) => void;
  onDescriptionClick: (index: number, e: React.MouseEvent<HTMLDivElement>) => void;
  renderDescription?: (index: number) => string;
}

// Predefined subsection titles that match the backend
const EXPECTED_TITLES = [
  "Manual Therapy Techniques",
  "Progressive Strengthening Protocol",
  "Neuromuscular Re-education",
  "Work-Specific Functional Training",
  "Pain Management Modalities",
  "Home Exercise Program"
];

export default function AnimatedCardGrid({
  suggestions,
  isLoadingStream,
  onFeedbackClick,
  onDescriptionClick,
  renderDescription,
}: CardGridProps) {
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

  // Create a consistent 6-card grid - always show all 6 positions
  const displayCards = EXPECTED_TITLES.map((expectedTitle, index) => {
    // Find the matching suggestion by index (since suggestions array indices match)
    const suggestion = suggestions[index];
    
    // If we have a real suggestion with data, use it
    if (suggestion && suggestion.title && suggestion.description) {
      return suggestion;
    }
    
    // Otherwise, return a skeleton placeholder
    return {
      id: `skeleton-${index}`,
      title: expectedTitle,
      description: '',
      exercises: [],
      cptCodes: [],
      isLoading: true
    } as Suggestion & { isLoading?: boolean };
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayCards.map((card, index) => {
          const isLoading = 'isLoading' in card && card.isLoading;
          
          return (
            <div key={card.id} className="min-h-[200px]">
              {isLoading ? (
                // Skeleton loading state
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              ) : (
                // Real card with data
                <SimpleCard
                  title={card.title}
                  description={card.description}
                  index={index}
                  onFeedbackClick={() => onFeedbackClick(index)}
                  onDescriptionClick={(e) => onDescriptionClick(index, e)}
                  renderDescription={() => renderDescription?.(index) || card.description}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
