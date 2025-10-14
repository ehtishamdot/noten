"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      setCaseData(JSON.parse(storedData));
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
    setCaseData(caseData);
    setIsSidebarOpen(false);
  };

  // Use backend recommendations if available
  const backendSuggestions = caseData?.recommendations?.subsections || [];
  
  const suggestions: Suggestion[] = backendSuggestions.length > 0 
    ? backendSuggestions.map((sub: any, idx: number) => ({
        id: sub.title.toLowerCase().replace(/\s+/g, '-'),
        title: sub.title,
        description: sub.description,
        exercises: sub.exercises || [],
        cptCodes: sub.exercises?.flatMap((ex: any) => ex.cpt_codes || []) || []
      }))
    : [];

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

  const openFeedbackModal = (title: string, type: string) => {
    setFeedbackContext({ title, type });
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

  const submitFeedback = () => {
    console.log("Feedback submitted:", {
      context: feedbackContext,
      rating: feedbackRating,
      comments: feedbackComments,
    });
    closeFeedbackModal();
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
            <h3 className="text-xl font-semibold text-gray-900 text-center">
              Specific Techniques to Consider
            </h3>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-2 mb-6"></div>
          </div>

          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 hover:border-purple-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {suggestion.title}
                </h3>
                <div
                  className="text-gray-600 text-sm leading-relaxed"
                  onClick={(e) => handleExerciseClick(e, suggestion)}
                  dangerouslySetInnerHTML={{
                    __html: renderDescriptionWithClickableExercises(suggestion),
                  }}
                />
              </div>
            ))}
          </div>

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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Exercise
                      </h3>
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
                            <li key={index} className="flex items-start gap-2">
                              <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span className="text-gray-700 flex-1">{cue}</span>
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
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <span className="text-sm font-medium text-purple-600 block mb-2">
                                Example {index + 1}
                              </span>
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
                              className="bg-green-50 rounded-lg p-4 border border-green-200"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-green-800 text-lg">
                                  CPT {billing.code}
                                </span>
                                <span className="text-green-700 font-medium">
                                  {billing.description}
                                </span>
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
        </div>
      </main>
    </>
  );
}
