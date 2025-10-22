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
  // Only show suggestions that have loaded
  const loadedSuggestions = suggestions.filter(s => s && s.title && s.description);
  
  // Don't render anything while loading - let MultiStepLoader handle it
  if (isLoadingStream || loadedSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
        {loadedSuggestions.map((card, index) => (
          <div key={card.id} className="flex">
            <SimpleCard
              title={card.title}
              description={card.description}
              index={index}
              onFeedbackClick={() => onFeedbackClick(index)}
              onDescriptionClick={(e) => onDescriptionClick(index, e)}
              renderDescription={() => renderDescription?.(index) || card.description}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
