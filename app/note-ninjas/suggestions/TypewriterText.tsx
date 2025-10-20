"use client";

import { useEffect, useState, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  renderAsHtml?: boolean;
  htmlContent?: string;
  fastMode?: boolean; // New prop for fast completion
}

export default function TypewriterText({ 
  text, 
  speed = 20, 
  onComplete,
  renderAsHtml = false,
  htmlContent,
  fastMode = false
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Use fast speed when fastMode is enabled
  const currentSpeed = fastMode ? 5 : speed;

  useEffect(() => {
    if (renderAsHtml && htmlContent) {
      // For HTML content, calculate total text length
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      if (currentIndex < plainText.length) {
        const timeout = setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, currentSpeed);

        return () => clearTimeout(timeout);
      } else if (!animationComplete && currentIndex === plainText.length && plainText.length > 0) {
        setAnimationComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    } else {
      // Regular text typewriter effect
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, currentSpeed);

        return () => clearTimeout(timeout);
      } else if (!animationComplete && currentIndex === text.length && text.length > 0) {
        setAnimationComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
    }
  }, [currentIndex, text, currentSpeed, onComplete, renderAsHtml, htmlContent, animationComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setAnimationComplete(false);
  }, [text, htmlContent]);

  // When fastMode is enabled, immediately complete the animation
  useEffect(() => {
    if (fastMode && !animationComplete) {
      if (renderAsHtml && htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        setCurrentIndex(plainText.length);
      } else {
        setDisplayedText(text);
        setCurrentIndex(text.length);
      }
      setAnimationComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [fastMode, animationComplete, renderAsHtml, htmlContent, text, onComplete]);

  // Update overlay position based on current index
  useEffect(() => {
    if (renderAsHtml && htmlContent && contentRef.current && overlayRef.current && !animationComplete) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Calculate what percentage of text is visible
      const percentVisible = (currentIndex / plainText.length) * 100;
      
      // Update overlay to reveal text progressively
      if (percentVisible < 100) {
        overlayRef.current.style.width = `${100 - percentVisible}%`;
      } else {
        overlayRef.current.style.display = 'none';
      }
    }
  }, [currentIndex, renderAsHtml, htmlContent, animationComplete]);

  if (renderAsHtml && htmlContent) {
    // For HTML content with exercise links, always render fully without overlay
    // This ensures exercise links are always clickable
    return (
      <div 
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return <span>{displayedText}</span>;
}
