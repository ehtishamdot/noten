"use client";

import { useState, useEffect } from "react";
import { noteNinjasAPI } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CaseHistory {
  id: string;
  name: string;
  timestamp: number;
  caseData: any;
}

export default function EmbedPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientCondition: "",
    desiredOutcome: "",
    treatmentProgression: "",
    // Detailed mode fields
    age: "",
    gender: "",
    diagnosis: "",
    comorbidities: "",
    severity: "",
    dateOfOnset: "",
    priorLevelOfFunction: "",
    workLifeRequirements: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<"simple" | "detailed">("simple");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create case in database
      const caseData = {
        patientCondition: formData.patientCondition,
        desiredOutcome: formData.desiredOutcome,
        treatmentProgression: formData.treatmentProgression,
        inputMode,
        detailedFields: inputMode === "detailed" ? {
          age: formData.age,
          gender: formData.gender,
          diagnosis: formData.diagnosis,
          comorbidities: formData.comorbidities,
          severity: formData.severity,
          dateOfOnset: formData.dateOfOnset,
          priorLevelOfFunction: formData.priorLevelOfFunction,
          workLifeRequirements: formData.workLifeRequirements,
        } : undefined,
      };

      const response = await noteNinjasAPI.createCase(caseData);
      const caseId = response.id;

      // Navigate to suggestions page with case ID
      router.push(`/embed/suggestions?caseId=${caseId}`);
    } catch (error) {
      console.error("Error creating case:", error);
      alert("Failed to create case. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Note Ninjas</h1>
          <p className="text-gray-600">AI-Powered PT Documentation Assistant</p>
        </div>

        {/* Input Mode Toggle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => setInputMode("simple")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                inputMode === "simple"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Simple Mode
            </button>
            <button
              onClick={() => setInputMode("detailed")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                inputMode === "detailed"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Detailed Mode
            </button>
          </div>
          <p className="text-sm text-gray-600 text-center">
            {inputMode === "simple"
              ? "Quick input with essential patient information"
              : "Comprehensive patient details for more precise recommendations"}
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {inputMode === "simple" ? (
            <>
              {/* Simple Mode Fields */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Patient Condition *
                </label>
                <textarea
                  value={formData.patientCondition}
                  onChange={(e) =>
                    setFormData({ ...formData, patientCondition: e.target.value })
                  }
                  placeholder="Describe the patient's condition, diagnosis, and relevant history..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Desired Outcome *
                </label>
                <textarea
                  value={formData.desiredOutcome}
                  onChange={(e) =>
                    setFormData({ ...formData, desiredOutcome: e.target.value })
                  }
                  placeholder="What are the treatment goals and desired outcomes?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Treatment Progression (Optional)
                </label>
                <textarea
                  value={formData.treatmentProgression}
                  onChange={(e) =>
                    setFormData({ ...formData, treatmentProgression: e.target.value })
                  }
                  placeholder="Any current challenges, stalled progress, or what has been tried so far?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              {/* Detailed Mode Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g., 45"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Primary diagnosis"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comorbidities
                </label>
                <textarea
                  value={formData.comorbidities}
                  onChange={(e) =>
                    setFormData({ ...formData, comorbidities: e.target.value })
                  }
                  placeholder="Any relevant medical conditions or comorbidities"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Severity *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Onset
                  </label>
                  <input
                    type="text"
                    value={formData.dateOfOnset}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfOnset: e.target.value })
                    }
                    placeholder="e.g., 2 weeks ago"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prior Level of Function *
                </label>
                <textarea
                  value={formData.priorLevelOfFunction}
                  onChange={(e) =>
                    setFormData({ ...formData, priorLevelOfFunction: e.target.value })
                  }
                  placeholder="Describe patient's functional status before injury/onset"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work/Life Requirements *
                </label>
                <textarea
                  value={formData.workLifeRequirements}
                  onChange={(e) =>
                    setFormData({ ...formData, workLifeRequirements: e.target.value })
                  }
                  placeholder="Job demands, daily activities, hobbies, goals"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Treatment Progression
                </label>
                <textarea
                  value={formData.treatmentProgression}
                  onChange={(e) =>
                    setFormData({ ...formData, treatmentProgression: e.target.value })
                  }
                  placeholder="Current progress, challenges, or what has been tried"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating Recommendations...
              </span>
            ) : (
              "Generate Treatment Plan"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Powered by Note Ninjas AI</p>
        </div>
      </div>
    </div>
  );
}
