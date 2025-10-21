import { useState } from 'react';

interface SubsectionData {
  title: string;
  description: string;
  rationale?: string;
  exercises?: any[];
}

interface UseParallelOptions {
  onUpdate: (subsection: SubsectionData, index: number) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export function useStreamingRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  
  const startStreaming = async (
    patientCondition: string,
    desiredOutcome: string,
    sessionId: string,
    options: UseParallelOptions
  ) => {
    setIsLoading(true);
    const { onUpdate, onComplete, onError } = options;
    
    try {
      // Start all 6 subsections in parallel
      const promises = Array.from({ length: 6 }, (_, index) =>
        fetchSingleSubsection(index, patientCondition, desiredOutcome, sessionId, onUpdate)
      );
      
      await Promise.all(promises);
      onComplete();
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { isStreaming: isLoading, startStreaming };
}

async function fetchSingleSubsection(
  index: number,
  patientCondition: string,
  desiredOutcome: string,
  sessionId: string,
  onUpdate: (subsection: SubsectionData, index: number) => void
) {
  console.log(`🚀 Starting API call for subsection ${index}`);
  
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
    throw new Error(`Failed to fetch subsection ${index}: ${response.status} - ${errorText}`);
  }
  
  try {
    const data = await response.json();
    console.log(`✅ Data received for subsection ${index}:`, data.title);
    onUpdate(data, index);
  } catch (error) {
    console.error(`❌ Error parsing response for subsection ${index}:`, error);
    throw error;
  }
}

