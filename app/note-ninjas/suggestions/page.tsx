"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import AnimatedCardGrid from "./AnimatedCardGrid";

import { useRouter } from "next/navigation";
import { noteNinjasAPI } from "@/lib/api";
import HistorySidebar from "../../components/HistorySidebar";
import { MultiStepLoader } from "../../components/MultiStepLoader";

const loadingStates = [
  { text: "Considering patient condition…" },
  { text: "Generating treatment options…" },
  { text: "Finalizing details…" },
];

interface CaseHistory {
  id: string;
  name: string;
  timestamp: number;
  caseData: any;
}

interface Exercise {
  name: string;
  description: string;
  cues: string[] | { verbal: string; tactile: string; visual: string };
  documentation_examples: string[] | string;
  cpt_codes: {
    code: string;
    description: string;
    notes: string;
  }[] | string;
  notes: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  exercises?: Exercise[];
  cptCodes: {
    code: string;
    description: string;
    notes: string;
  }[];
}

export default function BrainstormingSuggestions() {
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0); // Track which loading stage we're on
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [progressionText, setProgressionText] = useState("");
  

  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isCaseDetailsExpanded, setIsCaseDetailsExpanded] = useState(false);
  const [showCaseDetailsModal, setShowCaseDetailsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<{
    title: string;
    type: string;
    content?: string;
  } | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<
    "good" | "needs-work" | null
  >(null);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [caseHistory, setCaseHistory] = useState<CaseHistory[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const hasCalledAPI = useRef(false); // Prevent duplicate API calls

  useEffect(() => {
    // Load case history from backend
    const loadHistory = async () => {
      try {
        const cases = await noteNinjasAPI.getCases();
        const formattedCases = cases.map((c) => ({
          id: c.id,
          name: c.name,
          timestamp: new Date(c.created_at).getTime(),
          caseData: null // Will load on demand
        }));
        setCaseHistory(formattedCases);
      } catch (error) {
        console.error("Error loading case history:", error);
      }
    };
    
    loadHistory();
    
    // Get case data from sessionStorage
    const storedData = sessionStorage.getItem("note-ninjas-case");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setCaseData(parsedData);
      
      // Load progression text if it exists in saved data
      if (parsedData.progressionText) {
        setProgressionText(parsedData.progressionText);
      } else if (parsedData.recommendations?.progression_overview) {
        setProgressionText(parsedData.recommendations.progression_overview);
      }
      
      // Start API calls immediately if needed
      if (parsedData.isStreaming && parsedData.sessionId && parsedData.userInput && !hasCalledAPI.current) {
        hasCalledAPI.current = true; // Mark as called to prevent duplicates
        
        console.log("🚀 Starting unified API call!");
        setIsLoading(true);
        setLoadingStage(0); // Stage 0: Considering patient condition
        
        // Initialize empty recommendations array
        const initialRecommendations = Array(6).fill(null);
        setRecommendations(initialRecommendations);
        
        console.log('🚀 API call params:', {
          patientCondition: parsedData.userInput.patient_condition,
          desiredOutcome: parsedData.userInput.desired_outcome,
          sessionId: parsedData.sessionId
        });
        
        // Single unified API call
        (async () => {
          try {
            // Start API call immediately (don't wait)
            console.log('🔄 Calling API endpoint...');
            const apiPromise = fetch('/api/generate-all-recommendations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientCondition: parsedData.userInput.patient_condition,
                desiredOutcome: parsedData.userInput.desired_outcome,
                treatmentProgression: parsedData.userInput.treatment_progression || '',
                sessionId: parsedData.sessionId
              })
            });
            
            // Stage 0: Show "Considering patient condition" for 5 seconds while API is processing
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            setLoadingStage(1); // Stage 1: Generating treatment options
            
            // Wait for API response
            const response = await apiPromise;
            
            console.log('📡 Response received, status:', response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ API error response:', errorText);
              throw new Error(`API call failed: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ All recommendations received!');
            console.log('📦 Full API response:', data);
            console.log('📦 First subsection:', data.subsections[0]);
            console.log('📦 First exercise of first subsection:', data.subsections[0]?.exercises?.[0]);
            
            setLoadingStage(2); // Move to finalizing
            
            // Wait to show "Finalizing details" stage
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Set progression text
            if (data.progression_overview) {
              setProgressionText(data.progression_overview);
            }
            
            // Set all subsections
            const formattedSubsections = data.subsections.map((sub: any, index: number) => ({
              ...sub,
              id: `subsection-${index}`
            }));
            setRecommendations(formattedSubsections);
            
            // Complete loading
            setIsLoading(false);
            setLoadingStage(0); // Reset for next time
            
            // Save case to backend
            const updatedCaseData = {
              ...parsedData,
              isStreaming: false,
              progressionText: data.progression_overview,
              recommendations: data
            };
            
            // Check if user is logged in before saving
            const userAuth = sessionStorage.getItem("note-ninjas-user");
            if (!userAuth) {
              console.warn('⚠️ User not logged in, skipping backend save');
              sessionStorage.setItem("note-ninjas-case", JSON.stringify(updatedCaseData));
              setCaseData(updatedCaseData);
              return;
            }
            
            // Save to backend async
            noteNinjasAPI.createCase(
              parsedData.userInput,
              updatedCaseData.recommendations
            ).then(caseResponse => {
              console.log('✅ Case saved to backend:', caseResponse.id);
              
              // Update case data with ID
              const finalCaseData = {
                ...updatedCaseData,
                caseId: caseResponse.id,
                caseName: caseResponse.name
              };
              
              sessionStorage.setItem("note-ninjas-case", JSON.stringify(finalCaseData));
              setCaseData(finalCaseData);
            }).catch(error => {
              console.error('❌ Error saving case to backend:', error);
              sessionStorage.setItem("note-ninjas-case", JSON.stringify(updatedCaseData));
              setCaseData(updatedCaseData);
            });
            
          } catch (error) {
            console.error('❌ API call error:', error);
            setIsLoading(false);
            setLoadingStage(0);
            alert('Failed to generate recommendations. Please try again.');
          }
        })();
      }
    } else {
      // Redirect back if no case data
      router.push("/note-ninjas");
    }

    // Get user data from sessionStorage
    const userAuth = sessionStorage.getItem("note-ninjas-user");
    if (userAuth) {
      try {
        const userData = JSON.parse(userAuth);
        setUserName(userData.name);
        setUserEmail(userData.email);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectCase = async (item: CaseHistory) => {
    try {
      // Fetch full case data from backend if not already loaded
      if (!item.caseData) {
        const fullCase = await noteNinjasAPI.getCase(item.id);
        
        // Convert backend case format to frontend format
        const caseData = {
          caseId: fullCase.id,
          caseName: fullCase.name,
          patientCondition: fullCase.input_json.patient_condition,
          desiredOutcome: fullCase.input_json.desired_outcome,
          treatmentProgression: fullCase.input_json.treatment_progression || "",
          inputMode: fullCase.input_json.input_mode || "simple",
          sessionId: fullCase.input_json.session_id || `session_${Date.now()}`,
          userInput: fullCase.input_json,
          recommendations: fullCase.output_json,
          progressionText: fullCase.output_json?.progression_overview || "",
          isStreaming: false
        };
        
        // Load progression text from saved data
        if (caseData.progressionText) {
          setProgressionText(caseData.progressionText);
        } else {
          // Generate progression text if not saved
          fetch('/api/generate-progression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientCondition: caseData.patientCondition,
              desiredOutcome: caseData.desiredOutcome,
              treatmentProgression: caseData.treatmentProgression || ''
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.progression) {
              setProgressionText(data.progression);
            }
          })
          .catch(error => console.error('Error fetching progression text:', error));
        }
        
        sessionStorage.setItem("note-ninjas-case", JSON.stringify(caseData));
        setCaseData(caseData);
      } else {
        sessionStorage.setItem("note-ninjas-case", JSON.stringify(item.caseData));
        setCaseData(item.caseData);
        
        // Load progression text from cached data or generate if not present
        if (item.caseData.progressionText) {
          setProgressionText(item.caseData.progressionText);
        } else if (item.caseData.recommendations?.progression_overview) {
          setProgressionText(item.caseData.recommendations.progression_overview);
        } else {
          // Generate progression text if not saved
          fetch('/api/generate-progression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientCondition: item.caseData.patientCondition,
              desiredOutcome: item.caseData.desiredOutcome,
              treatmentProgression: item.caseData.treatmentProgression || ''
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.progression) {
              setProgressionText(data.progression);
            }
          })
          .catch(error => console.error('Error fetching progression text:', error));
        }
      }
      
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("Error loading first historical case:", error);
      // Try to use cached data if available
      if (item.caseData) {
        sessionStorage.setItem("note-ninjas-case", JSON.stringify(item.caseData));
        setCaseData(item.caseData);
        setIsSidebarOpen(false);
      } else {
        alert("Failed to load case from server. Please try again.");
      }
    }
  };

  // Use recommendations from state or fallback to caseData
  const backendSuggestions = useMemo(() => {
    // Use recommendations from API calls if available, otherwise use caseData
    const validRecommendations = recommendations.filter(Boolean);
    return validRecommendations.length > 0 
      ? validRecommendations 
      : (caseData?.recommendations?.subsections || []);
  }, [recommendations, caseData?.recommendations?.subsections]);
  
  const suggestions: Suggestion[] = useMemo(() => {
    if (!backendSuggestions || backendSuggestions.length === 0) return [];
    
    return backendSuggestions
      .filter((sub: any) => sub && sub.title) // Only filter out null/undefined and missing titles
      .map((sub: any, idx: number) => ({
        id: sub.title?.toLowerCase().replace(/\s+/g, "-") || `subsection-${idx}`,
        title: sub.title,
        description: sub.description || "Loading...",
        exercises: sub.exercises || [],
        cptCodes: sub.exercises?.flatMap((ex: any) => ex.cpt_codes || []) || []
      }));
  }, [backendSuggestions]);


  const handleCreateNewCase = () => {
    // Extract current case data and prepare for new case creation
    const newCaseData = {
      patientCondition: caseData?.patientCondition || "",
      desiredOutcome: caseData?.desiredOutcome || "",
      treatmentProgression: caseData?.treatmentProgression || "",
      // Copy detailed mode fields if available
      age: caseData?.age || "",
      gender: caseData?.gender || "",
      diagnosis: caseData?.diagnosis || "",
      comorbidities: caseData?.comorbidities || "",
      severity: caseData?.severity || "",
      dateOfOnset: caseData?.dateOfOnset || "",
      priorLevelOfFunction: caseData?.priorLevelOfFunction || "",
      workLifeRequirements: caseData?.workLifeRequirements || "",
      inputMode: caseData?.inputMode || "simple"
    };
    
    // Save the case data to session storage for the form to pick up
    sessionStorage.setItem("note-ninjas-form-data", JSON.stringify(newCaseData));
    sessionStorage.setItem("note-ninjas-input-mode", newCaseData.inputMode);
    
    // Navigate to the main form
    router.push("/note-ninjas");
  };

  const openModal = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSuggestion(null);
  };

  const openExerciseModal = (exercise: Exercise) => {
    console.log('Opening exercise modal with data:', {
      name: exercise.name,
      hasDescription: !!exercise.description,
      hasCues: !!exercise.cues,
      cuesIsArray: Array.isArray(exercise.cues),
      cuesCount: Array.isArray(exercise.cues) ? exercise.cues.length : 'N/A',
      hasDocExamples: !!exercise.documentation_examples,
      docExamplesIsArray: Array.isArray(exercise.documentation_examples),
      docExamplesCount: Array.isArray(exercise.documentation_examples) ? exercise.documentation_examples.length : 'N/A',
      hasCPTCodes: !!exercise.cpt_codes,
      cptCodesIsArray: Array.isArray(exercise.cpt_codes),
      cptCodesCount: Array.isArray(exercise.cpt_codes) ? exercise.cpt_codes.length : 'N/A',
      fullExercise: exercise
    });
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setSelectedExercise(null);
  };

  const openFeedbackModal = (title: string, type: string, content?: string) => {
    setFeedbackContext({ title, type, content });
    setFeedbackRating(null);
    setFeedbackComments("");
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackContext(null);
    setFeedbackRating(null);
    setFeedbackComments("");
  };

  const submitFeedback = async () => {
    if (!feedbackRating) {
      alert("Please select a rating");
      return;
    }

    // Check if user is logged in
    const userAuth = sessionStorage.getItem("note-ninjas-user");
    if (!userAuth) {
      alert("Please login to submit feedback");
      router.push("/note-ninjas");
      return;
    }

    try {
      // Get case ID from stored case data
      const caseId = (caseData as any)?.caseId;
      
      // Determine what we're giving feedback on
      const feedbackType = feedbackContext?.type || 'general';
      
      // Extract specific fields based on feedback type
      let exerciseName: string | undefined;
      let cueType: string | undefined;
      let cptCode: string | undefined;
      let exampleNumber: number | undefined;
      
      if (feedbackType === 'exercise') {
        exerciseName = selectedExercise?.name;
      } else if (feedbackType === 'cue') {
        exerciseName = selectedExercise?.name;
        // Extract cue type from title if present (e.g., "Exercise Name - Cue 1" -> "Verbal", "Tactile", or "Visual")
        const titleParts = feedbackContext?.title?.split(' - Cue ');
        if (titleParts && titleParts.length > 1) {
          const cueIndex = parseInt(titleParts[1]) - 1;
          const cueTypes = ['Verbal', 'Tactile', 'Visual'];
          cueType = cueTypes[cueIndex] || 'General';
        }
      } else if (feedbackType === 'documentation') {
        exerciseName = selectedExercise?.name;
        // Extract example number from title
        const match = feedbackContext?.title?.match(/Example (\d+)/);
        if (match) {
          exampleNumber = parseInt(match[1]);
        }
      } else if (feedbackType === 'cpt_code') {
        exerciseName = selectedExercise?.name;
        // Extract CPT code from title or content
        const match = feedbackContext?.title?.match(/CPT (\d+)/);
        if (match) {
          cptCode = match[1];
        }
      }
      
      // Build feedback payload matching backend schema
      const feedbackPayload = {
        case_id: caseId,
        feedback_type: feedbackType,
        exercise_name: exerciseName,
        cue_type: cueType,
        cpt_code: cptCode,
        example_number: exampleNumber,
        rating: feedbackRating,
        comments: feedbackComments || undefined,
        context_json: {
          // Store full context for analysis
          item_title: feedbackContext?.title || '',
          item_content: feedbackContext?.content || '',
          exercise_description: selectedExercise?.description || null,
          case_data: {
            patient_condition: caseData?.patientCondition || null,
            desired_outcome: caseData?.desiredOutcome || null,
            input_mode: caseData?.inputMode || null,
          },
          submitted_at: new Date().toISOString(),
        }
      };
      
      console.log("Submitting feedback:", feedbackPayload);
      
      await noteNinjasAPI.submitFeedback(feedbackPayload);
      
      console.log("Feedback submitted successfully");
      closeFeedbackModal();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    }
  };

  const renderDescriptionWithClickableExercises = (suggestion: Suggestion) => {
    let description = suggestion.description;
    const exercises = suggestion.exercises || [];

    // Clean up extra quotes in description (e.g., 'Exercise Name' '' -> Exercise Name)
    description = description.replace(/['"]([^'"]+)['"][\s]*['"]{2}/g, '$1');
    description = description.replace(/['"]([^'"]+)['"]/g, '$1');

    // Replace exercise names with clickable spans (only if exercise has complete data)
    exercises.forEach((exercise) => {
      if (!exercise || !exercise.name) return;
      
      // Check if exercise has any meaningful data - be more lenient
      const isComplete = exercise.name && exercise.description;
      
      // Debug log (can be removed later)
      if (!isComplete) {
        console.log('Exercise not clickable:', exercise.name, 'description:', !!exercise.description);
      }
      
      const regex = new RegExp(
        `\\b${exercise.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      
      if (isComplete) {
        // Clickable - purple with hover
        description = description.replace(
          regex,
          `<span class="exercise-link cursor-pointer text-purple-600 hover:text-purple-800 font-medium underline decoration-purple-300 hover:decoration-purple-500" data-exercise-id="${exercise.name}" style="pointer-events: auto; position: relative; z-index: 10;">${exercise.name}</span>`
        );
      } else {
        // Not clickable yet - gray with no pointer events
        description = description.replace(
          regex,
          `<span class="text-gray-400 font-medium" style="pointer-events: none; cursor: default;">${exercise.name}</span>`
        );
      }
    });

    return description;
  };

  const handleExerciseClick = (e: React.MouseEvent, suggestion: Suggestion) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("exercise-link")) {
      e.stopPropagation();
      const exerciseName = target.getAttribute("data-exercise-id");
      if (exerciseName) {
        const exercise = suggestion.exercises?.find(ex => ex.name === exerciseName);
        if (exercise) {
          openExerciseModal(exercise);
        }
      }
    }
  };

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading suggestions...</div>
      </div>
    );
  }

  console.log("Case data loaded:", suggestions);
  console.log("First suggestion exercises:", suggestions[0]?.exercises);

  return (
    <>
      <MultiStepLoader loadingStates={loadingStates} loading={isLoading} currentStage={loadingStage} duration={3000} loop={false} />
      <HistorySidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        history={caseHistory}
        onSelect={handleSelectCase}
      />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-purple-50 rounded-lg shadow-sm p-4 mb-6 border border-purple-100">
            <div className="flex items-start justify-between mb-2">
              <button
                onClick={() => router.push("/note-ninjas")}
                className="text-gray-600 hover:text-gray-900 flex items-center text-sm"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl">🥷</span>
                <h1 className="text-2xl font-bold text-gray-900">
                  Note Ninjas App
                </h1>
              </div>
              <p className="text-gray-700 text-sm">
                The Brainstorming Partner for PTs and OTs
              </p>
            </div>
          </div>

          {/* Case Details - Button to open modal */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Case Details
              </h2>
              <button
                onClick={() => setShowCaseDetailsModal(true)}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>

          {/* Treatment Approach Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Recommended Starting Point & Progression
            </h3>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-2 mb-6"></div>
            <div className="max-w-3xl mx-auto">
              {progressionText ? (
                <p className="text-gray-700 text-base leading-relaxed">
                  {progressionText}
                </p>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                  <span className="ml-3 text-gray-600">Generating progression plan...</span>
                </div>
              )}
            </div>
          </div>

          {/* Techniques Section Title */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Specific Techniques to Consider
            </h3>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-2 mb-6"></div>
          </div>

          {/* Suggestion Cards */}
          <AnimatedCardGrid
            suggestions={suggestions}
            isLoadingStream={isLoading}
            onFeedbackClick={(index) => openFeedbackModal(
              suggestions[index]?.title ? `Recommendation: ${suggestions[index]?.title}` : "Title",
              "title",
              suggestions[index]?.title || ""
            )}
            onDescriptionClick={(index, e) => handleExerciseClick(e, suggestions[index])}
            renderDescription={(index) => renderDescriptionWithClickableExercises(suggestions[index])}
          />

          {/* Exercise Modal */}
          {showExerciseModal && selectedExercise && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedExercise.name}
                      </h2>
                      <button
                        onClick={() => openFeedbackModal(`Recommendation: ${selectedExercise.name}`, "title", selectedExercise.name)}
                        className="text-gray-400 hover:text-purple-600 transition-colors"
                        title="Feedback on title"
                        aria-label="Feedback on title"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={closeExerciseModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Exercise Description */}
                    <div>
                  <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Exercise
                        </h3>
                        <button
                          onClick={() => openFeedbackModal(`${selectedExercise.name} - Exercise Description`, "exercise", selectedExercise.description)}
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                          title="Feedback on exercise description"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedExercise.description}
                      </p>
                    </div>

                    {/* Cues Section */}
                    {selectedExercise.cues && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Cues
                        </h3>
                        <ul className="space-y-2">
                          {Array.isArray(selectedExercise.cues) ? (
                            selectedExercise.cues.map((cue, index) => (
                              <li key={index} className="flex items-start justify-between gap-3 group hover:bg-gray-50 p-2 rounded transition-colors">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="text-gray-700 flex-1">{cue}</span>
                                </div>
                                <div className="flex gap-1  transition-opacity">
                                  <button
                                    onClick={() => openFeedbackModal(`${selectedExercise.name} - Cue ${index + 1}`, "cue", cue)}
                                    className="text-gray-400 hover:text-purple-600 transition-colors p-1"
                                    title="Feedback on this cue"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                  </button>
                                </div>
                              </li>
                            ))
                          ) : (
                            // Handle object format {verbal, tactile, visual}
                            Object.entries(selectedExercise.cues as any).map(([type, cue], index) => (
                              <li key={index} className="flex items-start justify-between gap-3 group hover:bg-gray-50 p-2 rounded transition-colors">
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <div className="flex-1">
                                    <span className="font-medium text-purple-600 capitalize">{type}: </span>
                                    <span className="text-gray-700">{cue as string}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1 transition-opacity">
                                  <button
                                    onClick={() => openFeedbackModal(`${selectedExercise.name} - ${type} Cue`, "cue", cue as string)}
                                    className="text-gray-400 hover:text-purple-600 transition-colors p-1"
                                    title="Feedback on this cue"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                  </button>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Documentation Examples */}
                    {selectedExercise.documentation_examples && (() => {
                      let docs;
                      if (typeof selectedExercise.documentation_examples === 'string') {
                        docs = [selectedExercise.documentation_examples];
                      } else if (Array.isArray(selectedExercise.documentation_examples)) {
                        docs = selectedExercise.documentation_examples;
                      } else {
                        docs = [selectedExercise.documentation_examples];
                      }
                      
                      if (docs.length === 0 || (docs.length === 1 && !docs[0])) return null;
                      
                      return (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Documentation
                          </h3>
                          <div className="space-y-4">
                            {docs.map((doc, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4 relative group hover:bg-gray-100 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-purple-600">
                                    Example {index + 1}
                                  </span>
                                  <button
                                    onClick={() => openFeedbackModal(`${selectedExercise.name} - Documentation Example ${index + 1}`, "documentation", doc)}
                                    className="text-gray-400 hover:text-purple-600 transition-colors "
                                    title="Feedback on this example"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed italic">
                                  &quot;{doc}&quot;
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Billing Codes */}
                    {selectedExercise.cpt_codes && (() => {
                      console.log('🔍 CPT Codes raw:', selectedExercise.cpt_codes);
                      
                      let codes;
                      if (typeof selectedExercise.cpt_codes === 'string') {
                        // Parse string format: "97140 - Description text"
                        const match = selectedExercise.cpt_codes.match(/^(\d+)\s*-\s*(.+)$/);
                        if (match) {
                          codes = [{ code: match[1], description: match[2], notes: '' }];
                        } else {
                          codes = [{ code: selectedExercise.cpt_codes, description: '', notes: '' }];
                        }
                      } else if (Array.isArray(selectedExercise.cpt_codes)) {
                        codes = selectedExercise.cpt_codes;
                      } else {
                        codes = [selectedExercise.cpt_codes];
                      }
                      
                      console.log('🔍 CPT Codes processed:', codes);
                      
                      if (codes.length === 0) return null;
                      const validCodes = codes.filter(c => c && (c.code || c.description));
                      console.log('🔍 Valid CPT Codes:', validCodes);
                      if (validCodes.length === 0) return null;
                      
                      return (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Billing Codes
                          </h3>
                          <div className="space-y-3">
                            {validCodes.map((billing, index) => (
                              <div
                                key={index}
                                className="bg-green-50 rounded-lg p-4 border border-green-200 group hover:bg-green-100 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-green-800 text-lg">
                                      CPT {billing.code}
                                    </span>
                                    <span className="text-green-700 font-medium">
                                      {billing.description}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => openFeedbackModal(`CPT ${billing.code} - ${billing.description}`, "cpt_code", `${billing.code}: ${billing.description} - ${billing.notes}`)}
                                    className="text-green-600 hover:text-green-800 transition-colors "
                                    title="Feedback on this CPT code"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-green-700 text-sm">
                                  {billing.notes}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Notes */}
                    {selectedExercise.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2">Clinical Notes:</h4>
                        <p className="text-yellow-800 text-sm">{selectedExercise.notes}</p>
                      </div>
                    )}
                  </div>


                  {/* Modal Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={closeExerciseModal}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Case Details Modal (reverted to simpler design) */}
          {showCaseDetailsModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCaseDetailsModal(false)}
            >
              <div
                className="bg-white rounded-md max-w-2xl w-full shadow-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Case Details</h2>
                    </div>
                    <button
                      onClick={() => setShowCaseDetailsModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-md p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Condition</div>
                          <div className="text-gray-900 mt-1">{caseData.patientCondition}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase">Desired Outcome</div>
                          <div className="text-gray-900 mt-1">{caseData.desiredOutcome}</div>
                        </div>
                      </div>
                    </div>

                    {caseData.treatmentProgression && (
                      <div className="border border-gray-200 rounded-md p-4">
                        <div className="text-xs text-gray-500 uppercase mb-1">Treatment Progression</div>
                        <div className="text-gray-900">{caseData.treatmentProgression}</div>
                      </div>
                    )}

                    {caseData.inputMode === "detailed" && (
                      <div className="border border-gray-200 rounded-md p-4">
                        <div className="text-xs text-gray-500 uppercase mb-2">Additional Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900">
                          {caseData.age && (
                            <div><span className="text-xs text-gray-500 uppercase">Age:</span> <span>{caseData.age}</span></div>
                          )}
                          {caseData.gender && (
                            <div><span className="text-xs text-gray-500 uppercase">Gender:</span> <span>{caseData.gender}</span></div>
                          )}
                          {caseData.severity && (
                            <div><span className="text-xs text-gray-500 uppercase">Severity:</span> <span>{caseData.severity}</span></div>
                          )}
                          {caseData.comorbidities && (
                            <div className="md:col-span-2">
                              <span className="text-xs text-gray-500 uppercase">Comorbidities:</span> <span>{caseData.comorbidities}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Input Mode:</span> {caseData.inputMode === "detailed" ? "Detailed" : "Simple"}
                      </div>
                      {caseData.recommendations?.subsections && (
                        <div>
                          <span className="font-medium">Recommendations:</span> {caseData.recommendations.subsections.length} subsections
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6">
                    <button
                      onClick={() => { handleCreateNewCase(); setShowCaseDetailsModal(false); }}
                      className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-purple-700"
                    >
                      Create New Case from Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {showFeedbackModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
              onClick={closeFeedbackModal}
            >
              <div 
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Provide Feedback
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Help us improve: {feedbackContext?.title}
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you rate this?
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedbackRating("good")}
                      className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                        feedbackRating === "good"
                          ? "bg-green-100 border-green-500 text-green-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      👍 Helpful
                    </button>
                    <button
                      onClick={() => setFeedbackRating("needs-work")}
                      className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                        feedbackRating === "needs-work"
                          ? "bg-red-100 border-red-500 text-red-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      👎 Needs Work
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Tell us more about your experience..."
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={closeFeedbackModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFeedback}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
