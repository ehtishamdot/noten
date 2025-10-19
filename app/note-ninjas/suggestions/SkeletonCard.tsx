"use client";

import { useEffect, useState } from 'react';
import TypewriterText from './TypewriterText';

interface SkeletonCardProps {
  title: string;
  description?: string;
  isLoading: boolean;
  onFeedbackClick: () => void;
  onDescriptionClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  renderDescription?: () => string;
}

export default function SkeletonCard({
  title,
  description,
  isLoading,
  onFeedbackClick,
  onDescriptionClick,
  renderDescription
}: SkeletonCardProps) {
  const [showTypewriter, setShowTypewriter] = useState(false);

  useEffect(() => {
    if (description && description !== '...' && !isLoading) {
      setShowTypewriter(true);
    }
  }, [description, isLoading]);

  // Don't render the card at all if it's loading or has no real content
  if (isLoading || !description || description === '...' || title === 'Loading...' || description === 'Generating recommendations...') {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 transform transition-all duration-500 ease-out">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {title}
        </h3>
        <button
          onClick={onFeedbackClick}
          className="text-gray-400 hover:text-gray-600 transition-all duration-300"
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
        {showTypewriter ? (
          <TypewriterText 
            text={description}
            speed={8}
            renderAsHtml={true}
            htmlContent={renderDescription?.() || description}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: renderDescription?.() || description }} />
        )}
      </div>
    </div>
  );
}
