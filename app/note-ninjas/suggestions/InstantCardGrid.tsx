"use client";

import { useEffect, useState } from 'react';
import SkeletonCard from './SkeletonCard';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  exercises?: any[];
  loading?: boolean;
  cptCodes: {
    code: string;
    description: string;
    notes: string;
  }[];
}

interface InstantCardGridProps {
  suggestions: Suggestion[];
  isLoadingStream: boolean;
  streamComplete: boolean;
  streamedSubsectionsCount: number;
  onFeedbackClick: (title: string, scope: string) => void;
  onDescriptionClick: (e: React.MouseEvent<HTMLDivElement>, suggestion: Suggestion) => void;
  renderDescription: (suggestion: Suggestion) => string;
}

// Predefined card titles - show these INSTANTLY
const INSTANT_CARDS = [
  { id: 'skeleton-0', title: 'Manual Therapy Techniques', loading: true },
  { id: 'skeleton-1', title: 'Progressive Strengthening Protocol', loading: true },
  { id: 'skeleton-2', title: 'Neuromuscular Re-education', loading: true },
  { id: 'skeleton-3', title: 'Work-Specific Functional Training', loading: true },
  { id: 'skeleton-4', title: 'Pain Management Modalities', loading: true },
  { id: 'skeleton-5', title: 'Home Exercise Program', loading: true }
];

export default function InstantCardGrid({
  suggestions,
  isLoadingStream,
  streamComplete,
  streamedSubsectionsCount,
  onFeedbackClick,
  onDescriptionClick,
  renderDescription
}: InstantCardGridProps) {
  const [cards, setCards] = useState<any[]>(INSTANT_CARDS);

  // Update cards as real data arrives
  useEffect(() => {
    if (suggestions.length > 0) {
      setCards(prevCards => {
        const updatedCards = [...INSTANT_CARDS];
        suggestions.forEach((suggestion, index) => {
          if (index < updatedCards.length) {
            updatedCards[index] = {
              ...suggestion,
              loading: false
            };
          }
        });
        return updatedCards;
      });
    } else if (!isLoadingStream) {
      // Reset to skeleton cards when starting new
      setCards(INSTANT_CARDS);
    }
  }, [suggestions, isLoadingStream]);

  return (
    <div className="space-y-6">
      {/* Progress bar instead of loading text */}
      {isLoadingStream && !streamComplete && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Generating recommendations...</span>
            <span>{suggestions.length}/6 complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(suggestions.length / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Instant grid - all 6 cards shown immediately */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <SkeletonCard
            key={card.id}
            title={card.title}
            description={card.description}
            isLoading={card.loading}
            onFeedbackClick={() => onFeedbackClick(card.title, "suggestion")}
            onDescriptionClick={(e) => onDescriptionClick(e, card)}
            renderDescription={() => card.description ? renderDescription(card) : ''}
          />
        ))}
      </div>
    </div>
  );
}
