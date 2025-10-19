"use client";

import { useEffect, useState, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  renderAsHtml?: boolean;
  htmlContent?: string;
}

export default function TypewriterText({ 
  text, 
  speed = 20, 
  onComplete,
  renderAsHtml = false,
  htmlContent
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (renderAsHtml && htmlContent) {
      // For HTML content, we'll reveal it character by character
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      if (currentIndex < plainText.length) {
        const timeout = setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timeout);
      } else if (onComplete && currentIndex === plainText.length && plainText.length > 0) {
        onComplete();
      }
    } else {
      // Regular text typewriter effect
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timeout);
      } else if (onComplete && currentIndex === text.length && text.length > 0) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, onComplete, renderAsHtml, htmlContent]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text, htmlContent]);

  // For HTML content, we need to progressively reveal it
  useEffect(() => {
    if (renderAsHtml && htmlContent && contentRef.current) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Create a version with only the visible characters
      if (currentIndex > 0) {
        const visibleText = plainText.substring(0, currentIndex);
        
        // Find and replace text in HTML while preserving tags
        let processedHtml = htmlContent;
        let textIndex = 0;
        
        // Simple approach: wrap visible content in a span and hide the rest
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const walker = document.createTreeWalker(
          doc.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        let node;
        let totalLength = 0;
        const nodes: { node: Text; start: number; end: number }[] = [];
        
        while (node = walker.nextNode()) {
          const textNode = node as Text;
          const start = totalLength;
          const end = totalLength + textNode.textContent!.length;
          nodes.push({ node: textNode, start, end });
          totalLength = end;
        }

        // Update text nodes based on current index
        nodes.forEach(({ node, start, end }) => {
          if (start >= currentIndex) {
            // Hide text that comes after current index
            node.textContent = '';
          } else if (end > currentIndex) {
            // Partially show text
            node.textContent = node.textContent!.substring(0, currentIndex - start);
          }
          // Text before current index remains unchanged
        });

        contentRef.current.innerHTML = doc.body.innerHTML;
      } else {
        contentRef.current.innerHTML = '';
      }
    }
  }, [currentIndex, renderAsHtml, htmlContent]);

  if (renderAsHtml && htmlContent) {
    return <span ref={contentRef} />;
  }

  return <span>{displayedText}</span>;
}
