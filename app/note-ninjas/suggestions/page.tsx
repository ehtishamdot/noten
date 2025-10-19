"use client";

import { useState, useEffect, useMemo } from "react";
import AnimatedCardGrid from "./AnimatedCardGrid";

import { useRouter } from "next/navigation";
import { noteNinjasAPI } from "@/lib/api";
import HistorySidebar from "../../components/HistorySidebar";

interface CaseHistory {
  id: string;
  name: string;
  timestamp: number;
  caseData: any;
}

interface Exercise {
  name: string;
  description: string;
  cues: string[];
  documentation_examples: string[];
  cpt_codes: {
    code: string;
    description: string;
    notes: string;
  }[];
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
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamedSubsections, setStreamedSubsections] = useState<any[]>([]);
  const [streamComplete, setStreamComplete] = useState(false);
  const [isTyping, setIsTyping] = useState<{[key: number]: boolean}>({});
  const [showCard, setShowCard] = useState<{[key: number]: boolean}>({});
  const [typewriterTexts, setTypewriterTexts] = useState<{[key: string]: string}>({});

  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isCaseDetailsExpanded, setIsCaseDetailsExpanded] = useState(false);
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

  useEffect(() => {
    // Get case data from sessionStorage
    const storedData = sessionStorage.getItem("note-ninjas-case");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log("Loaded case data:", parsedData);
      console.log("Is streaming?", parsedData.isStreaming);
      setCaseData(parsedData);
      
      // Start streaming immediately if needed
      if (parsedData.isStreaming && parsedData.sessionId && parsedData.userInput) {
        console.log("🚀🚀🚀 STARTING STREAMING IMMEDIATELY! 🚀🚀🚀");
        setIsLoadingStream(true);
        
        const collectedSubsections: any[] = [];
        
        noteNinjasAPI.generateRecommendationsStream(
          parsedData.userInput,
          {},
          parsedData.sessionId,
          (subsection, index) => {
            console.log(`✅ Received subsection ${index}:`, subsection.title);
            collectedSubsections.push(subsection);
            setStreamedSubsections([...collectedSubsections]);
            
            // Trigger card appearance animation
            setTimeout(() => {
              console.log(`🎬 Showing card ${index}`);
              setShowCard(prev => ({...prev, [index]: true}));
              // Start typewriter after card appears
              setTimeout(() => {
                console.log(`⌨️ Starting typewriter for card ${index}`);
                setIsTyping(prev => ({...prev, [index]: true}));
              }, 300);
            }, 100);
          },
          () => {
            console.log('✅ Streaming complete!', collectedSubsections.length, 'subsections');
            setStreamComplete(true);
            setIsLoadingStream(false);
            
            const updatedCaseData = {
              ...parsedData,
              isStreaming: false,
              recommendations: {
                subsections: collectedSubsections,
                high_level: [
                  `Focus on progressive treatment for ${parsedData.patientCondition}`,
                  `Incorporate activities to achieve: ${parsedData.desiredOutcome}`
                ],
                confidence: "high"
              }
            };
            sessionStorage.setItem("note-ninjas-case", JSON.stringify(updatedCaseData));
            setCaseData(updatedCaseData);
          },
          (error) => {
            console.error('❌ Streaming error:', error);
            setIsLoadingStream(false);
            setStreamComplete(true);
          }
        );
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

        // Load case history
        const historyKey = `note-ninjas-history-${userData.email}`;
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
          setCaseHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [router]);

  const handleSelectCase = (caseData: any) => {
    sessionStorage.setItem("note-ninjas-case", JSON.stringify(caseData));

  // Streaming effect
  useEffect(() => {
    console.log('🔥 STREAMING USEEFFECT RUNNING!');
    console.log('Streaming useEffect triggered, caseData:', caseData);
    console.log('isStreaming:', caseData?.isStreaming, 'streamComplete:', streamComplete);
    
    // Debug alert
    if (caseData?.isStreaming) {
      console.log('✅✅✅ ABOUT TO START STREAMING! ✅✅✅');
    } else {
      console.log('❌ NOT STREAMING - isStreaming is', caseData?.isStreaming);
    }
    
    if (caseData?.isStreaming && !streamComplete) {
      setIsLoadingStream(true);
      console.log('Starting streaming for session:', caseData.sessionId);
      
      const collectedSubsections: any[] = [];
      
      noteNinjasAPI.generateRecommendationsStream(
        caseData.userInput,
        {},
        caseData.sessionId,
        (subsection, index) => {
          // Add subsection as it arrives
          console.log(`Received subsection ${index}:`, subsection.title);
          collectedSubsections.push(subsection);
          setStreamedSubsections([...collectedSubsections]);
        },
        () => {
          // Streaming complete
          console.log('Streaming complete, total subsections:', collectedSubsections.length);
          setStreamComplete(true);
          setIsLoadingStream(false);
          
          // Update caseData with final recommendations
          const updatedCaseData = {
            ...caseData,
            isStreaming: false,
            recommendations: {
              subsections: collectedSubsections,
              high_level: [
                `Focus on progressive treatment for ${caseData.patientCondition}`,
                `Incorporate activities to achieve: ${caseData.desiredOutcome}`
              ],
              confidence: "high"
            }
          };
          sessionStorage.setItem("note-ninjas-case", JSON.stringify(updatedCaseData));
          setCaseData(updatedCaseData);
        },
        (error) => {
          // Error handling
          console.error('Streaming error:', error);
          setIsLoadingStream(false);

  const handleCreateNewCase = () => {
    // Extract current case data and prepare for new case creation
    const newCaseData = {
      patientCondition: caseData.patientCondition || "",
      desiredOutcome: caseData.desiredOutcome || "",
      treatmentProgression: caseData.treatmentProgression || "",
      // Copy detailed mode fields if available
      age: caseData.age || "",
      gender: caseData.gender || "",
      diagnosis: caseData.diagnosis || "",
      comorbidities: caseData.comorbidities || "",
      severity: caseData.severity || "",
      dateOfOnset: caseData.dateOfOnset || "",
      priorLevelOfFunction: caseData.priorLevelOfFunction || "",
      workLifeRequirements: caseData.workLifeRequirements || "",
      inputMode: caseData.inputMode || "simple"
    };
    
    // Save the case data to session storage for the form to pick up
    sessionStorage.setItem("note-ninjas-form-data", JSON.stringify(newCaseData));
    sessionStorage.setItem("note-ninjas-input-mode", newCaseData.inputMode);
    
    // Navigate to the main form
    router.push("/note-ninjas");
  };
          setStreamComplete(true);
        }
      );
    }
  }, [caseData, streamComplete]);  // Watch entire caseData object


    setCaseData(caseData);
    setIsSidebarOpen(false);
  };

  // Use backend recommendations if available
  const backendSuggestions = useMemo(() => {
    return (caseData?.isStreaming && !streamComplete)
      ? streamedSubsections
      : (caseData?.recommendations?.subsections || []);
  }, [caseData, streamComplete]);
  
  console.log('Backend suggestions:', backendSuggestions);
  console.log('Streamed subsections:', streamedSubsections);
  console.log('Is streaming:', caseData?.isStreaming, 'Stream complete:', streamComplete);
  
  const suggestions: Suggestion[] = useMemo(() => {
    if (!backendSuggestions || backendSuggestions.length === 0) return [];
    
    return backendSuggestions
      .filter((sub: any) => sub.title && sub.description && sub.title !== "Loading..." && sub.description !== "Generating recommendations...")
      .map((sub: any, idx: number) => ({
        id: sub.title?.toLowerCase().replace(/\s+/g, "-") || `subsection-${idx}`,
        title: sub.title,
        description: sub.description,
        exercises: sub.exercises || [],
        cptCodes: sub.exercises?.flatMap((ex: any) => ex.cpt_codes || []) || []
      }));
  }, [backendSuggestions.length]);
  
  console.log('Mapped suggestions count:', suggestions.length);
  console.log('Suggestions:', suggestions);
  
  // Typewriter effect
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    suggestions.forEach((suggestion, idx) => {
      if (isTyping[idx] && suggestion.title) {
        let currentIndex = 0;
        const fullText = suggestion.title;
        const key = `title-${idx}`;
        
        const interval = setInterval(() => {
          if (currentIndex <= fullText.length) {
            setTypewriterTexts(prev => ({
              ...prev,
              [key]: fullText.substring(0, currentIndex)
            }));
            currentIndex++;
          } else {
            clearInterval(interval);
          }
        }, 30);
        
        intervals.push(interval);
      }
      
      if (isTyping[idx] && suggestion.description) {
        let currentIndex = 0;
        const fullText = suggestion.description;
        const key = `desc-${idx}`;
        
        const interval = setInterval(() => {
          if (currentIndex <= fullText.length) {
            setTypewriterTexts(prev => ({
              ...prev,
              [key]: fullText.substring(0, currentIndex)
            }));
            currentIndex++;
          } else {
            clearInterval(interval);
          }
        }, 15);
        
        intervals.push(interval);
      }
    });
    
    return () => intervals.forEach(clearInterval);
  }, [isTyping, suggestions]);


  const handleCreateNewCase = () => {
    sessionStorage.removeItem("note-ninjas-case");
    setCaseData(null);
    setStreamComplete(false);
    setStreamedSubsections([]);
    router.push('/note-ninjas');
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

    try {
      // Get case ID from stored case data
      const caseId = (caseData as any)?.caseId;
      
      // Build comprehensive feedback data with hierarchy
      const feedbackPayload = {
        case_id: caseId,
        feedback_type: feedbackRating,
        feedback_data: {
          // Basic info
          scope: feedbackContext?.type || "",
          item_title: feedbackContext?.title || "",
          rating: feedbackRating,
          
          // Hierarchy - which exercise this belongs to
          exercise_name: selectedExercise?.name || null,
          exercise_description: selectedExercise?.description || null,
          
          // Full item content (the actual cue text, doc text, etc.)
          item_content: feedbackContext?.content || null,
          
          // Case context
          case_data: {
            patient_condition: caseData?.patientCondition || null,
            desired_outcome: caseData?.desiredOutcome || null,
            input_mode: caseData?.inputMode || null,
          },
          
          // Timestamp
          submitted_at: new Date().toISOString(),
        },
        comment: feedbackComments || undefined,
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

    // Replace exercise names with clickable spans
    exercises.forEach((exercise) => {
      const regex = new RegExp(
        `\\b${exercise.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      description = description.replace(
        regex,
        `<span class="exercise-link cursor-pointer text-purple-600 hover:text-purple-800 font-medium underline decoration-purple-300 hover:decoration-purple-500" data-exercise-id="${exercise.name}">${exercise.name}</span>`
      );
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

  return (
    <>
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

          {/* Case Details - Collapsible */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Case Details
              </h2>
              <button
                onClick={() => setIsCaseDetailsExpanded(!isCaseDetailsExpanded)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    isCaseDetailsExpanded ? "rotate-45" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            </div>

            {isCaseDetailsExpanded && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <span className="font-medium text-gray-700">
                      Condition:
                    </span>
                    <p className="text-gray-600 mt-1">
                      {caseData.patientCondition}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Desired Outcome:
                    </span>
                    <p className="text-gray-600 mt-1">
                      {caseData.desiredOutcome}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Treatment Approach Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Recommended Starting Point & Progression
            </h3>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-2 mb-6"></div>
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-700 text-base leading-relaxed">
                Based on your case, start with gentle range of motion exercises
                and pain-free strengthening. A typical progression begins with
                passive and active-assisted ROM, advances to active ROM with
                resistance band exercises, then progresses to functional
                overhead activities. Since progress has stalled, consider
                modifying exercise parameters (frequency, resistance, range) or
                introducing manual therapy to address underlying restrictions
                before advancing strengthening protocols.
              </p>
            </div>
          </div>

          {/* Techniques Section Title */}
          <div className="mb-6">

                {/* Create New Case from Details Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCreateNewCase}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create New Case from Details
                  </button>
                </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Specific Techniques to Consider
            </h3>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-2 mb-6"></div>
          </div>

          {/* Suggestion Cards */}
          <AnimatedCardGrid
            suggestions={suggestions}
            isLoadingStream={isLoadingStream}
            streamComplete={streamComplete}
            streamedSubsectionsCount={streamedSubsections.length}
            onFeedbackClick={(index) => openFeedbackModal(suggestions[index]?.title || "Suggestion", "suggestion", suggestions[index]?.description)}
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
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedExercise.name}
                    </h2>
                    <button
                      onClick={closeExerciseModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    {selectedExercise.cues && selectedExercise.cues.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Cues
                        </h3>
                        <ul className="space-y-2">
                          {selectedExercise.cues.map((cue, index) => (
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
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Documentation Examples */}
                    {selectedExercise.documentation_examples && selectedExercise.documentation_examples.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Documentation
                        </h3>
                        <div className="space-y-4">
                          {selectedExercise.documentation_examples.map((doc, index) => (
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
                                "{doc}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Billing Codes */}
                    {selectedExercise.cpt_codes && selectedExercise.cpt_codes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Billing Codes
                        </h3>
                        <div className="space-y-3">
                          {selectedExercise.cpt_codes.map((billing, index) => (
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
                    )}

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

          {/* Feedback Modal */}
          {showFeedbackModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
