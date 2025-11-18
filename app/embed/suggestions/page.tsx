"use client";

import { useState, useEffect, Suspense } from "react";
import { noteNinjasAPI } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

function SuggestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId");

  const [isLoading, setIsLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    if (caseId) {
      loadCaseAndGenerateRecommendations();
    } else {
      router.push("/embed");
    }
  }, [caseId]);

  const loadCaseAndGenerateRecommendations = async () => {
    try {
      setIsLoading(true);

      // Load case data
      const response = await noteNinjasAPI.getCase(caseId!);
      setCaseData(response.case);

      // Generate recommendations
      const recsResponse = await noteNinjasAPI.generateAllRecommendations({
        patientCondition: response.case.patientCondition,
        desiredOutcome: response.case.desiredOutcome,
        treatmentProgression: response.case.treatmentProgression || "",
        sessionId: caseId!,
      });

      setRecommendations(recsResponse);
    } catch (error) {
      console.error("Error loading case:", error);
      alert("Failed to load case. Redirecting...");
      router.push("/embed");
    } finally {
      setIsLoading(false);
    }
  };

  const openExerciseModal = (exercise: any) => {
    setSelectedExercise(exercise);
  };

  const closeExerciseModal = () => {
    setSelectedExercise(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">
            Generating your treatment plan...
          </p>
          <p className="text-gray-600 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Treatment Recommendations</h1>
          <button
            onClick={() => router.push("/embed")}
            className="text-teal-600 hover:text-teal-700 font-semibold"
          >
            ← New Case
          </button>
        </div>

        {/* Case Summary */}
        {caseData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Case Summary</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Condition:</span> {caseData.patientCondition}
              </p>
              <p>
                <span className="font-semibold">Goals:</span> {caseData.desiredOutcome}
              </p>
              {caseData.treatmentProgression && (
                <p>
                  <span className="font-semibold">Progression:</span>{" "}
                  {caseData.treatmentProgression}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Progression Overview */}
        {recommendations?.progression_overview && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Progression Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              {recommendations.progression_overview}
            </p>
          </div>
        )}

        {/* Subsections */}
        {recommendations?.subsections?.map((subsection: any, idx: number) => (
          <div key={idx} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-teal-600 mb-3">{subsection.title}</h2>

            {subsection.description && (
              <p className="text-gray-700 mb-4">{subsection.description}</p>
            )}

            {subsection.rationale && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Rationale:</span> {subsection.rationale}
                </p>
              </div>
            )}

            {/* Exercises */}
            <div className="space-y-4">
              {subsection.exercises?.map((exercise: any, exIdx: number) => (
                <div
                  key={exIdx}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openExerciseModal(exercise)}
                >
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{exercise.name}</h3>
                  <p className="text-gray-700 text-sm mb-3">{exercise.description}</p>

                  {/* CPT Code Preview */}
                  {exercise.cpt_codes && exercise.cpt_codes.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold">CPT:</span>
                      <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded">
                        {exercise.cpt_codes[0].code}
                      </span>
                    </div>
                  )}

                  <p className="text-teal-600 text-sm font-semibold mt-2">
                    Click to view details →
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeExerciseModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedExercise.name}
                  </h2>
                  <p className="text-gray-700">{selectedExercise.description}</p>
                </div>
                <button
                  onClick={closeExerciseModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Cues */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Therapeutic Cues</h3>

                {selectedExercise.cues?.verbal && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Verbal Cues:</h4>
                    <p className="text-gray-700">{selectedExercise.cues.verbal}</p>
                  </div>
                )}

                {selectedExercise.cues?.tactile && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Tactile Cues:</h4>
                    <p className="text-gray-700">{selectedExercise.cues.tactile}</p>
                  </div>
                )}

                {selectedExercise.cues?.visual && (
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h4 className="font-semibold text-teal-900 mb-2">Visual Cues:</h4>
                    <p className="text-gray-700">{selectedExercise.cues.visual}</p>
                  </div>
                )}
              </div>

              {/* Documentation Examples */}
              {selectedExercise.documentation_examples &&
                selectedExercise.documentation_examples.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Documentation Examples
                    </h3>
                    <div className="space-y-3">
                      {selectedExercise.documentation_examples.map(
                        (example: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <p className="text-gray-700 text-sm leading-relaxed">{example}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* CPT Codes */}
              {selectedExercise.cpt_codes && selectedExercise.cpt_codes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">CPT Codes</h3>
                  <div className="space-y-3">
                    {selectedExercise.cpt_codes.map((cpt: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-teal-50 rounded-lg border border-teal-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-teal-900 text-lg">{cpt.code}</p>
                            <p className="text-gray-700">{cpt.description}</p>
                            {cpt.notes && (
                              <p className="text-sm text-gray-600 mt-1">{cpt.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Notes */}
              {selectedExercise.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Clinical Notes:</h4>
                  <p className="text-yellow-800 text-sm">{selectedExercise.notes}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeExerciseModal}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmbedSuggestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600"></div>
        </div>
      }
    >
      <SuggestionsContent />
    </Suspense>
  );
}
