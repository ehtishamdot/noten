"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientData } from "@/app/lib/patientData";

interface Treatment {
  sessionNumber: number;
  week: number;
  sessionInWeek: number;
  date: string;
  subjective: string;
  objective: {
    rom: string[];
    strength: string[];
    specialTests: string;
  };
  interventions: {
    code: string;
    description: string;
    duration: number;
    notes: string;
  }[];
  assessment: string;
  plan: string[];
  notesRecommendation: string;
  insuranceNotes: string;
}

const generateTreatments = (
  patientId: string,
  totalVisits: number,
  weeksPerVisit: number
): Treatment[] => {
  const treatments: Treatment[] = [];
  const startDate = new Date();

  for (let i = 1; i <= totalVisits; i++) {
    const week = Math.ceil(i / weeksPerVisit);
    const sessionInWeek = ((i - 1) % weeksPerVisit) + 1;
    const dayOffset =
      Math.floor((i - 1) / weeksPerVisit) * 7 +
      (sessionInWeek - 1) * Math.floor(7 / weeksPerVisit);
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() + dayOffset);

    treatments.push({
      sessionNumber: i,
      week,
      sessionInWeek,
      date: sessionDate.toLocaleDateString(),
      subjective: generateSubjective(i, patientId),
      objective: generateObjective(i, patientId),
      interventions: generateInterventions(i, patientId),
      assessment: generateAssessment(i, patientId),
      plan: generatePlan(i, patientId, totalVisits),
      notesRecommendation: generateNotesRecommendation(i, patientId),
      insuranceNotes: "", // Will be populated after treatment is created
    });
  }

  return treatments;
};

const generateSubjective = (session: number, patientId: string): string => {
  if (patientId === "john-doe") {
    if (session <= 3)
      return `Patient reports right shoulder pain ${Math.max(
        6 - session,
        3
      )}/10, improving with treatment. Sleep quality improving, able to lie on right side for longer periods.`;
    if (session <= 9)
      return `Shoulder pain now ${Math.max(
        4 - Math.floor(session / 3),
        2
      )}/10. Returning to some work activities with modifications. Compliance with HEP excellent.`;
    return `Minimal pain (1-2/10) with daily activities. Able to perform most work tasks without significant discomfort. Ready for discharge planning.`;
  }
  if (patientId === "emily-smith") {
    if (session <= 4)
      return `Left knee pain ${Math.max(
        7 - session,
        4
      )}/10. Some swelling after activity. Eager to return to soccer.`;
    if (session <= 10)
      return `Knee pain reduced to ${Math.max(
        4 - Math.floor(session / 4),
        2
      )}/10. Beginning light jogging. No episodes of giving way.`;
    return `Minimal knee discomfort. Successfully completed return-to-sport protocol. Cleared for full soccer participation.`;
  }
  // Maria Garcia
  if (session <= 6)
    return `Lower back pain ${Math.max(
      8 - session,
      5
    )}/10. Balance concerns continue. Using walker for safety.`;
  if (session <= 15)
    return `Back pain improving to ${Math.max(
      6 - Math.floor(session / 3),
      3
    )}/10. Balance confidence increasing. Walking with cane.`;
  return `Back pain manageable (2-3/10). Walking independently short distances. Confidence with mobility much improved.`;
};

const generateObjective = (session: number, patientId: string) => {
  if (patientId === "john-doe") {
    const baseFlexion = 130 + Math.min(session * 3, 40);
    const baseAbduction = 120 + Math.min(session * 3, 50);
    return {
      rom: [
        `Shoulder Flexion: ${baseFlexion}°`,
        `Shoulder Abduction: ${baseAbduction}°`,
        `External Rotation: ${60 + Math.min(session * 2, 30)}°`,
      ],
      strength: [
        `Supraspinatus: ${Math.min(4 + Math.floor(session / 4), 5)}/5`,
        `External Rotators: ${Math.min(4 + Math.floor(session / 3), 5)}/5`,
        `Scapular Stabilizers: ${Math.min(4 + Math.floor(session / 5), 5)}/5`,
      ],
      specialTests:
        session <= 6
          ? "Hawkins-Kennedy (+), Neer (+)"
          : session <= 12
          ? "Hawkins-Kennedy (-), Neer (+/-)"
          : "All impingement tests negative",
    };
  }
  if (patientId === "emily-smith") {
    return {
      rom: [
        `Knee Flexion: ${Math.min(110 + session * 2, 135)}°`,
        `Knee Extension: ${Math.max(5 - Math.floor(session / 2), 0)}° deficit`,
      ],
      strength: [
        `Quadriceps: ${Math.min(3 + Math.floor(session / 3), 5)}/5`,
        `Hamstrings: ${Math.min(4 + Math.floor(session / 4), 5)}/5`,
      ],
      specialTests:
        session <= 8
          ? "Lachman (-), McMurray (+)"
          : "All ligament tests (-), McMurray (-)",
    };
  }
  // Maria Garcia
  return {
    rom: [
      `Lumbar Flexion: ${Math.min(30 + session, 60)}°`,
      `Lumbar Extension: ${Math.min(10 + Math.floor(session / 2), 25)}°`,
    ],
    strength: [
      `Hip Abductors: ${Math.min(3 + Math.floor(session / 4), 5)}/5`,
      `Core Stability: ${Math.min(3 + Math.floor(session / 3), 4)}/5`,
    ],
    specialTests: `Timed Up & Go: ${Math.max(
      18 - Math.floor(session / 2),
      11
    )} seconds`,
  };
};

const generateInterventions = (session: number, patientId: string) => {
  const baseInterventions = [
    {
      code: "97140",
      description: "Manual Therapy",
      duration: 15,
      notes: "Joint mobilizations and soft tissue work",
    },
    {
      code: "97110",
      description: "Therapeutic Exercise",
      duration: 15,
      notes: "Strengthening and ROM exercises",
    },
    {
      code: "97112",
      description: "Neuromuscular Re-education",
      duration: 15,
      notes: "Balance and coordination training",
    },
  ];

  if (session > 6) {
    baseInterventions.push({
      code: "97530",
      description: "Therapeutic Activities",
      duration: 15,
      notes: "Functional task training",
    });
  }

  return baseInterventions;
};

const generateAssessment = (session: number, patientId: string): string => {
  if (session <= 6)
    return "Patient showing good progress with treatment. Pain levels decreasing and function improving. Continue current plan.";
  if (session <= 12)
    return "Excellent progress noted. Patient meeting short-term goals. Advancing to functional activities.";
  return "Patient ready for discharge. Goals met. Independent with home program.";
};

const generatePlan = (
  session: number,
  patientId: string,
  totalVisits: number
): string[] => {
  if (session >= totalVisits - 2) {
    return [
      "Prepare for discharge",
      "Finalize home exercise program",
      "Provide activity guidelines",
      "Schedule follow-up as needed",
    ];
  }

  return [
    "Continue current treatment plan",
    "Progress exercises as tolerated",
    "Monitor pain and function",
    "Update home exercise program",
  ];
};

const generateNotesRecommendation = (
  session: number,
  patientId: string
): string => {
  const insuranceInfo = JSON.parse(
    sessionStorage.getItem(`insurance-${patientId}`) || '{"provider": "Aetna"}'
  );
  const provider = insuranceInfo.provider;

  if (provider === "Aetna") {
    if (session <= 6) {
      return "For Aetna documentation: Focus on measurable progress indicators (ROM degrees, strength grades, pain scores). Include specific skilled interventions and patient response. Emphasize functional improvements and medical necessity to prevent further disability.";
    } else if (session <= 12) {
      return "For Aetna mid-treatment: Document objective improvements from initial evaluation. Show progress toward functional goals. If approaching 60-day limit, justify continued need with specific deficits and treatment modifications.";
    } else {
      return "For Aetna discharge planning: Document achievement of functional goals, independence with HEP, and readiness for discharge. Include any remaining deficits and home program for maintenance.";
    }
  } else if (provider === "Cigna") {
    return "For Cigna documentation: Ensure total treatment time doesn't exceed 4 timed units (60 minutes). Document each intervention with specific time spent. Include objective measures and functional progress. Submit progress notes every 10 visits.";
  } else if (provider === "UnitedHealthcare") {
    return "For UHC documentation: Include GP modifier for PT services. Focus on functional outcomes and return-to-work/activity goals. Document medical necessity and skilled nature of interventions. Include physician communication if plan changes.";
  } else {
    return "For Medi-Cal documentation: Ensure all services are medically necessary to prevent significant disability. Include TAR justification if extending beyond initial authorization. Document physician communication and prescription updates.";
  }
};

const generateInsuranceNotes = (
  session: number,
  patientId: string,
  currentTreatment: Treatment
): string => {
  const patient = patientId
    .replace("-", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const date = new Date();
  date.setDate(date.getDate() + Math.floor((session - 1) / 3) * 7);

  // Get diagnosis from patient data
  let diagnosis = "";
  if (patientId === "john-doe") {
    diagnosis = "Right Shoulder Impingement Syndrome (M75.4)";
  } else if (patientId === "emily-smith") {
    diagnosis = "Left Knee Meniscal Tear with effusion (S83.242A)";
  } else {
    diagnosis = "Lumbar spinal stenosis with neurogenic claudication (M48.06)";
  }

  // Format interventions for insurance
  const interventionsList = currentTreatment.interventions
    .map(
      (intervention) =>
        `- ${intervention.description} (${intervention.code}): ${intervention.duration} min - ${intervention.notes}`
    )
    .join("\n");

  // Format ROM data
  const romList = currentTreatment.objective.rom
    .map((item) => `- ${item}`)
    .join("\n");

  // Format strength data
  const strengthList = currentTreatment.objective.strength
    .map((item) => `- ${item}`)
    .join("\n");

  // Format plan items
  const planList = currentTreatment.plan.map((item) => `• ${item}`).join("\n");

  // Calculate total treatment time
  const totalTime = currentTreatment.interventions.reduce(
    (sum, intervention) => sum + intervention.duration,
    0
  );

  // Calculate next appointment date (2-3 days later)
  const nextAppointment = new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000);

  return `Date: ${date.toLocaleDateString()}
Patient: ${patient}
Diagnosis: ${diagnosis}
Session ${session} of prescribed treatment plan

SUBJECTIVE: ${currentTreatment.subjective}

OBJECTIVE:
Range of Motion:
${romList}

Strength:
${strengthList}

Special Tests: ${currentTreatment.objective.specialTests}

INTERVENTIONS:
${interventionsList}

ASSESSMENT: ${currentTreatment.assessment}

PLAN:
${planList}

Total treatment time: ${totalTime} minutes
Next appointment: ${nextAppointment.toLocaleDateString()}`;
};

export default function TreatmentPlanPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState(1);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [editingSections, setEditingSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [editedTreatment, setEditedTreatment] = useState<Treatment | null>(
    null
  );

  useEffect(() => {
    if (patientId && patientData[patientId as keyof typeof patientData]) {
      const originalData = patientData[patientId as keyof typeof patientData];
      const storedData = sessionStorage.getItem(`patient-${patientId}`);
      const patientFormData = storedData
        ? JSON.parse(storedData)
        : originalData;

      setPatientInfo(patientFormData);

      // Determine total visits based on patient
      let totalVisits = 18;
      let sessionsPerWeek = 3;

      if (patientId === "emily-smith") {
        totalVisits = 16;
        sessionsPerWeek = 2;
      } else if (patientId === "maria-garcia") {
        totalVisits = 24;
        sessionsPerWeek = 2;
      }

      const generatedTreatments = generateTreatments(
        patientId,
        totalVisits,
        sessionsPerWeek
      );

      // Generate insurance notes for each treatment using the treatment data
      const treatmentsWithNotes = generatedTreatments.map((treatment) => ({
        ...treatment,
        insuranceNotes: generateInsuranceNotes(
          treatment.sessionNumber,
          patientId,
          treatment
        ),
      }));

      setTreatments(treatmentsWithNotes);
      setLoading(false);
    } else {
      router.push("/");
    }
  }, [patientId, router]);

  const currentTreatment = treatments[currentSession - 1];
  const displayTreatment = editedTreatment ? editedTreatment : currentTreatment;

  // Popular CPT codes for quick addition
  const popularCodes = [
    { code: "97110", description: "Therapeutic Exercise" },
    { code: "97112", description: "Neuromuscular Re-education" },
    { code: "97140", description: "Manual Therapy" },
    { code: "97530", description: "Therapeutic Activities" },
    { code: "97116", description: "Gait Training" },
    { code: "97535", description: "Self-care/Home Management Training" },
    { code: "97750", description: "Physical Performance Test" },
    { code: "97161", description: "PT Evaluation Low Complexity" },
    { code: "97162", description: "PT Evaluation Moderate Complexity" },
    { code: "97163", description: "PT Evaluation High Complexity" },
  ];

  const handleSectionEditStart = (section: string) => {
    if (!editedTreatment) {
      setEditedTreatment({ ...currentTreatment });
    }
    setEditingSections({ ...editingSections, [section]: true });
  };

  const handleSectionEditSave = (section: string) => {
    if (editedTreatment) {
      const updatedTreatments = [...treatments];
      updatedTreatments[currentSession - 1] = {
        ...editedTreatment,
        insuranceNotes: generateInsuranceNotes(
          currentSession,
          patientId,
          editedTreatment
        ),
      };
      setTreatments(updatedTreatments);
      setEditingSections({ ...editingSections, [section]: false });

      // If no sections are being edited, clear the edited treatment
      const stillEditing = Object.values({
        ...editingSections,
        [section]: false,
      }).some(Boolean);
      if (!stillEditing) {
        setEditedTreatment(null);
      }
    }
  };

  const handleSectionEditCancel = (section: string) => {
    setEditingSections({ ...editingSections, [section]: false });

    // If no sections are being edited, reset to original treatment
    const stillEditing = Object.values({
      ...editingSections,
      [section]: false,
    }).some(Boolean);
    if (!stillEditing) {
      setEditedTreatment(null);
    }
  };

  const updateEditedTreatment = (field: string, value: any) => {
    if (editedTreatment) {
      setEditedTreatment({ ...editedTreatment, [field]: value });
    }
  };

  const addIntervention = (code: string, description: string) => {
    if (editedTreatment) {
      const newIntervention = {
        code,
        description,
        duration: 15,
        notes: "",
      };
      setEditedTreatment({
        ...editedTreatment,
        interventions: [...editedTreatment.interventions, newIntervention],
      });
    }
  };

  const removeIntervention = (index: number) => {
    if (editedTreatment) {
      const newInterventions = editedTreatment.interventions.filter(
        (_, i) => i !== index
      );
      setEditedTreatment({
        ...editedTreatment,
        interventions: newInterventions,
      });
    }
  };

  const updateIntervention = (index: number, field: string, value: any) => {
    if (editedTreatment) {
      const newInterventions = [...editedTreatment.interventions];
      newInterventions[index] = { ...newInterventions[index], [field]: value };
      setEditedTreatment({
        ...editedTreatment,
        interventions: newInterventions,
      });
    }
  };

  const updateObjectiveField = (
    category: "rom" | "strength",
    index: number,
    value: string
  ) => {
    if (editedTreatment) {
      const newObjective = { ...editedTreatment.objective };
      newObjective[category] = [...newObjective[category]];
      newObjective[category][index] = value;
      setEditedTreatment({
        ...editedTreatment,
        objective: newObjective,
      });
    }
  };

  const addObjectiveField = (category: "rom" | "strength") => {
    if (editedTreatment) {
      const newObjective = { ...editedTreatment.objective };
      newObjective[category] = [...newObjective[category], ""];
      setEditedTreatment({
        ...editedTreatment,
        objective: newObjective,
      });
    }
  };

  const removeObjectiveField = (
    category: "rom" | "strength",
    index: number
  ) => {
    if (editedTreatment) {
      const newObjective = { ...editedTreatment.objective };
      newObjective[category] = newObjective[category].filter(
        (_, i) => i !== index
      );
      setEditedTreatment({
        ...editedTreatment,
        objective: newObjective,
      });
    }
  };

  const updatePlanItem = (index: number, value: string) => {
    if (editedTreatment) {
      const newPlan = [...editedTreatment.plan];
      newPlan[index] = value;
      setEditedTreatment({
        ...editedTreatment,
        plan: newPlan,
      });
    }
  };

  const addPlanItem = () => {
    if (editedTreatment) {
      setEditedTreatment({
        ...editedTreatment,
        plan: [...editedTreatment.plan, ""],
      });
    }
  };

  const removePlanItem = (index: number) => {
    if (editedTreatment) {
      const newPlan = editedTreatment.plan.filter((_, i) => i !== index);
      setEditedTreatment({
        ...editedTreatment,
        plan: newPlan,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading treatment plan...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/")}
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
              Back to Patient Selection
            </button>
            <div className="text-sm text-gray-500">
              Session {currentSession} of {treatments.length}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Physical Therapy Treatment Plan
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
                  {patientInfo?.Assessment?.Diagnosis?.split("(")[0]} • Total
                  Sessions: {treatments.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Treatment Sessions
            </h3>
            <div className="text-sm text-gray-600">
              Week {currentTreatment?.week} • Session{" "}
              {currentTreatment?.sessionInWeek}
            </div>
          </div>

          {/* Session Navigation */}
          <div className="flex flex-wrap gap-2">
            {treatments.map((treatment) => (
              <button
                key={treatment.sessionNumber}
                onClick={() => setCurrentSession(treatment.sessionNumber)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  currentSession === treatment.sessionNumber
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {treatment.sessionNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Current Session Content */}
        {displayTreatment && (
          <>
            {/* Session Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Session {displayTreatment.sessionNumber}
                  </h2>
                  <p className="text-gray-600">
                    Week {displayTreatment.week}, Session{" "}
                    {displayTreatment.sessionInWeek} • {displayTreatment.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentSession(Math.max(1, currentSession - 1))
                    }
                    disabled={currentSession === 1}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentSession(
                        Math.min(treatments.length, currentSession + 1)
                      )
                    }
                    disabled={currentSession === treatments.length}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* SOAP Note Sections */}
            <div className="space-y-6">
              {/* Subjective and Objective - 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subjective */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Subjective
                    </h3>
                    {editingSections.subjective ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSectionEditCancel("subjective")}
                          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSectionEditSave("subjective")}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSectionEditStart("subjective")}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingSections.subjective ? (
                    <textarea
                      value={displayTreatment.subjective}
                      onChange={(e) =>
                        updateEditedTreatment("subjective", e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      rows={4}
                      placeholder="Enter subjective findings..."
                    />
                  ) : (
                    <p className="text-gray-700">
                      {displayTreatment.subjective}
                    </p>
                  )}
                </div>

                {/* Objective */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Objective
                    </h3>
                    {editingSections.objective ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSectionEditCancel("objective")}
                          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSectionEditSave("objective")}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSectionEditStart("objective")}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        Range of Motion:
                      </p>
                      {editingSections.objective ? (
                        <div className="space-y-2">
                          {displayTreatment.objective.rom.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={item}
                                onChange={(e) =>
                                  updateObjectiveField(
                                    "rom",
                                    idx,
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="ROM measurement..."
                              />
                              <button
                                onClick={() => removeObjectiveField("rom", idx)}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addObjectiveField("rom")}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm"
                          >
                            + Add ROM measurement
                          </button>
                        </div>
                      ) : (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {displayTreatment.objective.rom.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        Strength:
                      </p>
                      {editingSections.objective ? (
                        <div className="space-y-2">
                          {displayTreatment.objective.strength.map(
                            (item, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) =>
                                    updateObjectiveField(
                                      "strength",
                                      idx,
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                  placeholder="Strength measurement..."
                                />
                                <button
                                  onClick={() =>
                                    removeObjectiveField("strength", idx)
                                  }
                                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                >
                                  Remove
                                </button>
                              </div>
                            )
                          )}
                          <button
                            onClick={() => addObjectiveField("strength")}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm"
                          >
                            + Add strength measurement
                          </button>
                        </div>
                      ) : (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {displayTreatment.objective.strength.map(
                            (item, idx) => (
                              <li key={idx}>• {item}</li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        Special Tests:
                      </p>
                      {editingSections.objective ? (
                        <input
                          type="text"
                          value={displayTreatment.objective.specialTests}
                          onChange={(e) => {
                            if (editedTreatment) {
                              setEditedTreatment({
                                ...editedTreatment,
                                objective: {
                                  ...editedTreatment.objective,
                                  specialTests: e.target.value,
                                },
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Special test results..."
                        />
                      ) : (
                        <p className="text-sm text-gray-600">
                          {displayTreatment.objective.specialTests}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interventions - Full width */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interventions
                  </h3>
                  {editingSections.interventions ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSectionEditCancel("interventions")}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSectionEditSave("interventions")}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSectionEditStart("interventions")}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {displayTreatment.interventions.map((intervention, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      {editingSections.interventions ? (
                        <div className="space-y-3">
                          <div className="flex gap-3 items-start">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                CPT Code
                              </label>
                              <input
                                type="text"
                                value={intervention.code}
                                onChange={(e) =>
                                  updateIntervention(
                                    idx,
                                    "code",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="CPT code..."
                              />
                            </div>
                            <div className="flex-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={intervention.description}
                                onChange={(e) =>
                                  updateIntervention(
                                    idx,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Intervention description..."
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Minutes
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={intervention.duration}
                                onChange={(e) =>
                                  updateIntervention(
                                    idx,
                                    "duration",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            <button
                              onClick={() => removeIntervention(idx)}
                              className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                            >
                              Remove
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={intervention.notes}
                              onChange={(e) =>
                                updateIntervention(idx, "notes", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              rows={2}
                              placeholder="Intervention notes..."
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-semibold text-gray-900">
                                CPT {intervention.code}
                              </span>
                              <span className="ml-2 text-gray-700">
                                {intervention.description}
                              </span>
                            </div>
                            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {intervention.duration} min
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {intervention.notes}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {editingSections.interventions && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Add CPT Code:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularCodes.map((code) => (
                        <button
                          key={code.code}
                          onClick={() =>
                            addIntervention(code.code, code.description)
                          }
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                        >
                          {code.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assessment and Plan - 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assessment */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assessment
                    </h3>
                    {editingSections.assessment ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSectionEditCancel("assessment")}
                          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSectionEditSave("assessment")}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSectionEditStart("assessment")}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingSections.assessment ? (
                    <textarea
                      value={displayTreatment.assessment}
                      onChange={(e) =>
                        updateEditedTreatment("assessment", e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      rows={4}
                      placeholder="Enter assessment..."
                    />
                  ) : (
                    <p className="text-gray-700">
                      {displayTreatment.assessment}
                    </p>
                  )}
                </div>

                {/* Plan */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Plan
                    </h3>
                    {editingSections.plan ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSectionEditCancel("plan")}
                          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSectionEditSave("plan")}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSectionEditStart("plan")}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingSections.plan ? (
                    <div className="space-y-2">
                      {displayTreatment.plan.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) =>
                              updatePlanItem(idx, e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Plan item..."
                          />
                          <button
                            onClick={() => removePlanItem(idx)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addPlanItem}
                        className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm"
                      >
                        + Add plan item
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-1 text-gray-700">
                      {displayTreatment.plan.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance Notes Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Insurance Documentation Notes
              </h3>

              {/* Notes Recommendation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Documentation Recommendation
                </h4>
                <p className="text-sm text-blue-800">
                  {displayTreatment.notesRecommendation}
                </p>
              </div>

              {/* Insurance Notes Output */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Notes for Insurance Submission
                </h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {displayTreatment.insuranceNotes}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
