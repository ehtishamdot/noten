"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  cptCodes: {
    code: string;
    description: string;
    notes: string;
  }[];
}

export default function BrainstormingSuggestions() {
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Get case data from sessionStorage
    const storedData = sessionStorage.getItem("note-ninjas-case");
    if (storedData) {
      setCaseData(JSON.parse(storedData));
    } else {
      // Redirect back if no case data
      router.push("/note-ninjas");
    }
  }, [router]);

  const suggestions: Suggestion[] = [
    {
      id: "manual-therapy",
      title: "Manual Therapy Techniques",
      description:
        "Posterior capsule mobilization and glenohumeral joint mobilizations can help restore shoulder mechanics. Focus on grade III posterior glides to increase internal rotation and address capsular restrictions. Cross-friction massage to supraspinatus tendon may help with tissue healing and pain reduction.",
      cptCodes: [
        {
          code: "97140",
          description: "Manual Therapy",
          notes:
            "Joint mobilizations and soft tissue techniques - 15 minute increments",
        },
      ],
    },
    {
      id: "progressive-strengthening",
      title: "Progressive Strengthening Protocol",
      description:
        "Advance from isometric holds to isotonic exercises using resistance bands. Start with pain-free arcs and gradually increase range. Include scapular stabilization exercises like wall slides and prone T's. Progress to functional overhead reaching patterns as tolerance improves.",
      cptCodes: [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          notes: "Strengthening and ROM exercises - each 15 minute unit",
        },
      ],
    },
    {
      id: "neuromuscular-training",
      title: "Neuromuscular Re-education",
      description:
        "Proprioceptive training using unstable surfaces and closed-chain exercises. Focus on scapulohumeral rhythm retraining and postural awareness. Include rhythmic stabilization exercises and perturbation training to improve dynamic shoulder control and prevent re-injury.",
      cptCodes: [
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          notes:
            "Balance, coordination, and movement pattern training - 15 minute increments",
        },
      ],
    },
    {
      id: "functional-activities",
      title: "Work-Specific Functional Training",
      description:
        "Simulate job-related overhead activities with proper biomechanics. Practice lifting techniques, reaching patterns, and sustained overhead positioning. Use weighted objects to replicate work demands while maintaining proper scapular control and avoiding impingement positions.",
      cptCodes: [
        {
          code: "97530",
          description: "Therapeutic Activities",
          notes: "Functional task-oriented training - 15 minute increments",
        },
      ],
    },
    {
      id: "modality-interventions",
      title: "Adjunctive Modality Options",
      description:
        "Consider ultrasound for thermal effects to improve tissue extensibility before stretching. Electrical stimulation can help with muscle re-education if weakness persists. Ice application post-exercise to manage any inflammatory response from increased activity levels.",
      cptCodes: [
        {
          code: "97035",
          description: "Ultrasound",
          notes:
            "Thermal or non-thermal ultrasound - constant attendance required",
        },
        {
          code: "97032",
          description: "Electrical Stimulation",
          notes:
            "Attended electrical stimulation for muscle re-education or pain management",
        },
      ],
    },
    {
      id: "home-program-advancement",
      title: "Advanced Home Exercise Program",
      description:
        "Develop a progressive home program with resistance band exercises, postural correction techniques, and self-mobilization strategies. Include pain monitoring guidelines and activity modification principles. Provide clear progression criteria for advancing exercise difficulty.",
      cptCodes: [
        {
          code: "97535",
          description: "Self-care/Home Management Training",
          notes:
            "Patient education and home program instruction - not always separately billable",
        },
      ],
    },
  ];

  const openModal = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSuggestion(null);
  };

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading suggestions...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/note-ninjas")}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
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
              Back to Case Input
            </button>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🥷
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Brainstorming Suggestions
            </h1>
            <div className="w-20 h-1 bg-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Personalized treatment ideas for your case
            </p>
          </div>
        </div>

        {/* Case Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Your Case
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Condition:</span>
              <p className="text-gray-600 mt-1">{caseData.patientCondition}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Desired Outcome:
              </span>
              <p className="text-gray-600 mt-1">{caseData.desiredOutcome}</p>
            </div>
            {caseData.treatmentProgression && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">
                  Treatment Progression:
                </span>
                <p className="text-gray-600 mt-1">
                  {caseData.treatmentProgression}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Starting Exercise & Progression Overview */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            Recommended Starting Point & Progression
          </h3>
          <p className="text-purple-800">
            Based on your case, start with gentle range of motion exercises and
            pain-free strengthening. A typical progression begins with passive
            and active-assisted ROM, advances to active ROM with resistance band
            exercises, then progresses to functional overhead activities. Since
            progress has stalled, consider modifying exercise parameters
            (frequency, resistance, range) or introducing manual therapy to
            address underlying restrictions before advancing strengthening
            protocols.
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => openModal(suggestion)}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 hover:border-purple-300"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {suggestion.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {suggestion.description}
              </p>
              <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                <span>View Details & Billing</span>
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && selectedSuggestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedSuggestion.title}
                  </h2>
                  <button
                    onClick={closeModal}
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

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Treatment Approach
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedSuggestion.description}
                  </p>
                </div>

                {/* Billing Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    How to Bill
                  </h3>
                  <div className="space-y-4">
                    {selectedSuggestion.cptCodes.map((cpt, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            CPT {cpt.code}
                          </span>
                          <span className="text-gray-700">
                            {cpt.description}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{cpt.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={closeModal}
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
  );
}
