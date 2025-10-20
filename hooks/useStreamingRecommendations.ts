import { useState } from 'react';

interface SubsectionData {
  title: string;
  description: string;
  rationale?: string;
  exercises?: any[];
  isComplete?: boolean; // Track if all data is complete
}

interface UseStreamingOptions {
  onUpdate: (subsection: SubsectionData, index: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export function useStreamingRecommendations() {
  const [isStreaming, setIsStreaming] = useState(false);
  
  const startStreaming = async (
    patientCondition: string,
    desiredOutcome: string,
    sessionId: string,
    options: UseStreamingOptions
  ) => {
    setIsStreaming(true);
    const { onUpdate, onComplete, onError } = options;
    
    try {
      // Start all 6 subsections in parallel
      const promises = Array.from({ length: 6 }, (_, index) =>
        streamSingleSubsection(index, patientCondition, desiredOutcome, sessionId, onUpdate)
      );
      
      await Promise.all(promises);
      onComplete();
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsStreaming(false);
    }
  };
  
  return { isStreaming, startStreaming };
}

async function streamSingleSubsection(
  index: number,
  patientCondition: string,
  desiredOutcome: string,
  sessionId: string,
  onUpdate: (subsection: SubsectionData, index: number) => void
) {
  console.log(`🚀 Starting stream for subsection ${index}`);
  
  const response = await fetch('/api/generate-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientCondition,
      desiredOutcome,
      sessionId,
      subsectionIndex: index
    }),
  });

  console.log(`📡 Response for subsection ${index}:`, response.status, response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Error response for subsection ${index}:`, errorText);
    throw new Error(`Failed to stream subsection ${index}: ${response.status} - ${errorText}`);
  }
  
  if (!response.body) {
    throw new Error(`No response body for subsection ${index}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = '';
  let lastValidData: SubsectionData | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log(`✅ Stream complete for subsection ${index}`);
        // Parse final complete JSON
        const finalParsed = parseJSON(accumulatedText);
        if (finalParsed) {
          onUpdate(finalParsed, index);
        }
        break;
      }
      
      // Decode the streamed chunk
      const chunk = decoder.decode(value, { stream: true });
      accumulatedText += chunk;
      
      // Try to extract partial data immediately as it streams
      const partialData = extractPartialData(accumulatedText);
      if (partialData && partialData.title) {
        // Only update if we have new content
        if (!lastValidData || partialData.title !== lastValidData.title || partialData.description !== lastValidData.description) {
          lastValidData = partialData;
          console.log(`🔄 Streaming update for subsection ${index}:`, partialData.title?.substring(0, 30));
          onUpdate(partialData, index);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error streaming subsection ${index}:`, error);
    throw error;
  }
}

function extractPartialData(text: string): SubsectionData | null {
  try {
    // Remove markdown code blocks and clean up
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Look for partial JSON fields as they stream in
    const titleMatch = cleaned.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const descMatch = cleaned.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    
    if (titleMatch) {
      return {
        title: titleMatch[1],
        description: descMatch ? descMatch[1] : "Generating description...",
        exercises: [],
        isComplete: false
      };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function parseJSON(text: string): any | null {
  try {
    // Remove markdown code blocks and clean up
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Try to parse the JSON
    const parsed = JSON.parse(cleaned);
    
    // Validate that we have the essential fields
    if (parsed && typeof parsed === 'object' && parsed.title && parsed.description) {
      // Check if we have complete data (exercises array with content)
      const isComplete = parsed.exercises && Array.isArray(parsed.exercises) && parsed.exercises.length > 0;
      return {
        ...parsed,
        isComplete
      };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

