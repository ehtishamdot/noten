"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientData } from "@/app/lib/patientData";

interface Intervention {
  code: string;
  description: string;
  duration: number;
  notes: string;
  hasError?: boolean;
  errorMessage?: string;
  recommendedFix?: string;
}

const initialInterventions: Intervention[] = [
  {
    code: "97140",
    description: "Manual Therapy",
    duration: 15,
    notes:
      "Grade III posterior glides to right glenohumeral joint, soft tissue mobilization to pectoralis minor",
  },
  {
    code: "97110",
    description: "Therapeutic Exercise",
    duration: 7, // ERROR: Less than 8 minutes
    notes:
      "Rotator cuff strengthening with theraband (3x10 ER/IR), scapular wall slides",
    hasError: true,
    errorMessage: "Duration is less than 8 minutes - Aetna will deny this code",
    recommendedFix: "Increase duration to at least 8 minutes",
  },
  {
    code: "97112",
    description: "Neuromuscular Re-education",
    duration: 15,
    notes:
      "Scapular stabilization exercises, proprioceptive training for overhead reaching",
  },
  {
    code: "97545", // ERROR: Work hardening code
    description: "Work Conditioning",
    duration: 15,
    notes: "Simulated overhead hammering activities",
    hasError: true,
    errorMessage:
      "Work hardening codes (97545/97546) are not covered by Aetna for this condition",
    recommendedFix: "Change to 97530 (Therapeutic Activities)",
  },
  {
    code: "Taping", // ERROR: Kinesiology taping
    description: "Kinesiology Taping",
    duration: 7,
    notes: "Applied kinesiology tape to right shoulder for postural support",
    hasError: true,
    errorMessage:
      "Aetna considers kinesiology taping investigational for shoulder conditions",
    recommendedFix:
      "Remove this intervention and redistribute time to billable codes",
  },
];

export default function Week1PlanPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] =
    useState<Intervention[]>(initialInterventions);
  const [showErrors, setShowErrors] = useState(true);

  useEffect(() => {
    if (patientId && patientData[patientId as keyof typeof patientData]) {
      const originalData = patientData[patientId as keyof typeof patientData];
      const storedData = sessionStorage.getItem(`patient-${patientId}`);
      const patientFormData = storedData
        ? JSON.parse(storedData)
        : originalData;

      setPatientInfo(patientFormData);
      setLoading(false);
    } else {
      router.push("/");
    }
  }, [patientId, router]);

  const handleFixError = (index: number, fixType: string) => {
    const newInterventions = [...interventions];

    if (fixType === "duration") {
      newInterventions[index].duration = 8;
      newInterventions[index].hasError = false;
    } else if (fixType === "code") {
      newInterventions[index].code = "97530";
      newInterventions[index].description = "Therapeutic Activities";
      newInterventions[index].hasError = false;
    } else if (fixType === "remove") {
      // When removing taping, redistribute the 7 minutes to therapeutic exercise (97110)
      const tapingDuration = newInterventions[index].duration;
      const therapeuticExerciseIndex = newInterventions.findIndex(
        (intervention) => intervention.code === "97110"
      );
      if (therapeuticExerciseIndex !== -1) {
        newInterventions[therapeuticExerciseIndex].duration += tapingDuration;
      }
      newInterventions.splice(index, 1);
    }

    setInterventions(newInterventions);
  };

  const handleBack = () => {
    router.push(`/recommendation/${patientId}`);
  };

  const getTotalMinutes = () => {
    return interventions
      .filter((i) => i.code !== "Taping")
      .reduce((sum, i) => sum + i.duration, 0);
  };

  const getErrorCount = () => {
    return interventions.filter((i) => i.hasError).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading week 1 plan...</div>
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
              onClick={handleBack}
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
              Back to Recommendation
            </button>
            <div className="text-sm text-gray-500">Week 1 - Session 1</div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Physical Therapy Session Plan
          </h1>
          <div className="w-20 h-1 bg-primary-500 mb-4"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg mr-4">
                {patientInfo?.Name?.split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {patientInfo?.Name}
                </h2>
                <p className="text-gray-600">
                  Right Shoulder Impingement • Session Date:{" "}
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            {getErrorCount() > 0 && (
              <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-700">
                  {getErrorCount()} Insurance Compliance{" "}
                  {getErrorCount() === 1 ? "Issue" : "Issues"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subjective Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Subjective
          </h3>
          <p className="text-gray-700">
            Patient reports continued right shoulder pain (5/10 today, down from
            6/10 at eval). States pain is worse with overhead activities at
            work. Compliance with HEP has been good - performing exercises
            2x/day as instructed. Sleep improved, able to lie on right side for
            short periods without pain.
          </p>
        </div>

        {/* Objective Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Objective
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">ROM Measurements:</p>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Flexion: 135° (↑5° from eval)</li>
                <li>• Abduction: 125° (↑5° from eval)</li>
                <li>• ER at 90°: 65° (↑5° from eval)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700">Strength:</p>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Supraspinatus: 4/5</li>
                <li>• External rotators: 4/5</li>
                <li>• Scapular stabilizers: 4-/5</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 text-gray-700">
            Special Tests: Hawkins-Kennedy (+), Neer (+), Empty Can (+) for pain
          </p>
        </div>

        {/* Interventions Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Interventions
            </h3>
            <div className="text-sm text-gray-600">
              Total Treatment Time: {getTotalMinutes()} minutes
            </div>
          </div>

          <div className="space-y-3">
            {interventions.map((intervention, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  intervention.hasError
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-semibold text-gray-900">
                        CPT {intervention.code}
                      </span>
                      <span className="text-gray-700">
                        {intervention.description}
                      </span>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {intervention.duration} min
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {intervention.notes}
                    </p>

                    {intervention.hasError && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-red-600 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-700">
                              {intervention.errorMessage}
                            </p>
                            <p className="text-sm text-red-600 mt-1">
                              Recommended Fix: {intervention.recommendedFix}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (intervention.code === "97110") {
                              handleFixError(index, "duration");
                            } else if (intervention.code === "97545") {
                              handleFixError(index, "code");
                            } else if (intervention.code === "Taping") {
                              handleFixError(index, "remove");
                            }
                          }}
                          className="ml-7 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Apply Fix
                        </button>
                      </div>
                    )}
                  </div>

                  {!intervention.hasError && (
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Assessment
          </h3>
          <p className="text-gray-700">
            Patient demonstrating good progress with 5° improvement in shoulder
            flexion and abduction ROM. Pain levels decreasing. Strength remains
            limited in rotator cuff and scapular stabilizers. Patient tolerating
            manual therapy and exercises well. Continue with current treatment
            plan focusing on improving ROM, strength, and functional overhead
            activities.
          </p>
        </div>

        {/* Plan Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan</h3>
          <ul className="space-y-1 text-gray-700">
            <li>• Continue PT 2-3x/week for next 2 weeks</li>
            <li>• Progress strengthening exercises as tolerated</li>
            <li>• Add functional overhead reaching activities</li>
            <li>• Update HEP with new exercises demonstrated today</li>
            <li>• Re-assess in 2 weeks for progress toward goals</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center"
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
              Back
            </button>

            <div className="flex items-center gap-4">
              {getErrorCount() === 0 ? (
                <>
                  <div className="flex items-center text-green-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">
                      All compliance issues resolved!
                    </span>
                  </div>
                  <button
                    onClick={() => alert("Session plan saved successfully!")}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    Save Compliant Plan
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-600">
                  Fix all {getErrorCount()} compliance issues to save the plan
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
