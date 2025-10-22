"use client";

import { memo } from 'react';

interface SimpleCardProps {
  title: string;
  description: string;
  index: number;
  onFeedbackClick: () => void;
  onDescriptionClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  renderDescription: () => string;
}

const SimpleCard = memo(function SimpleCard({
  title,
  description,
  index,
  onFeedbackClick,
  onDescriptionClick,
  renderDescription,
}: SimpleCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {title}
        </h3>
        <button
          onClick={onFeedbackClick}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          title="Provide feedback"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
      
      <div 
        className="text-gray-600 leading-relaxed flex-grow"
        onClick={onDescriptionClick}
        dangerouslySetInnerHTML={{ __html: renderDescription() }}
      />
    </div>
  );
});

export default SimpleCard;