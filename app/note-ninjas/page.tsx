"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { noteNinjasAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import LoginPage from "../components/LoginPage";
import HistorySidebar from "../components/HistorySidebar";
import Logo from "../components/Logo";
import {
  getAllSectionsForPatientType,
  type VisitType,
  type SectionConfig
} from "@/lib/dynamicSections";

// Interface for LLM-evaluated sections
interface EvaluatedSection {
  sectionName: string;
  visibility: string;
  contentGuidelines: string;
  triggerRule: string;
  reasoning?: string;
}

interface CaseHistory {
  id: string;
  name: string;
  timestamp: number;
  caseData: any;
}

export default function NoteNinjas() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [caseHistory, setCaseHistory] = useState<CaseHistory[]>([]);
  const [hasLoadedPrefill, setHasLoadedPrefill] = useState(false);
  const [formData, setFormData] = useState({
    patientCondition: "",
    desiredOutcome: "",
    treatmentProgression: "",
    // Visit Type - PT or OT
    visitType: "" as "" | "PT" | "OT",
    // Detailed mode fields - common
    patientType: "",
    age: "",
    gender: "",
    // Acute injury or trauma fields
    diagnosis: "",
    dateOfInjury: "",
    mechanismOfInjury: "",
    comorbidities: "",
    severity: "",
    priorLevelOfFunction: "",
    workLifeRequirements: "",
    // Post-surgical recovery fields
    typeOfSurgery: "",
    dateOfSurgery: "",
    surgicalIndication: "",
    currentPostOpPhase: "",
    preOperativeFunction: "",
    // Chronic or progressive condition fields
    duration: "",
    progressionPattern: "",
    currentBaselineFunction: "",
    priorBaseline: "",
    // Functional or developmental support fields
    primaryConcern: "",
    currentAbilitiesLimitations: "",
    environmentalContext: "",
    dailyActivityGoals: "",
    // Legacy field for backward compatibility
    dateOfOnset: "",
    // Section selection mode
    sectionSelectionMode: "auto" as "auto" | "manual",
    selectedSections: [] as string[],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAutoFillDropdown, setShowAutoFillDropdown] = useState(false);
  const [inputMode, setInputMode] = useState<"simple" | "detailed">("simple");

  // LLM-based section evaluation state
  const [llmSelectedSections, setLlmSelectedSections] = useState<EvaluatedSection[]>([]);
  const [isEvaluatingSections, setIsEvaluatingSections] = useState(false);
  const [sectionEvaluationReasoning, setSectionEvaluationReasoning] = useState<string>("");

  // Check authentication and load case history on component mount
  useEffect(() => {
    const loadUserData = async () => {
      const userAuth = sessionStorage.getItem("note-ninjas-user");
      if (userAuth) {
        try {
          const userData = JSON.parse(userAuth);
          setUserName(userData.name);
          setIsAuthenticated(true);

          // Load case history from backend
          try {
            const cases = await noteNinjasAPI.getCases();
            const formattedCases = cases.map((c) => ({
              id: c.id,
              name: c.name,
              timestamp: new Date(c.created_at).getTime(),
              caseData: null
            }));
            setCaseHistory(formattedCases);
          } catch (error) {
            console.error('Error loading case history:', error);
            // Fallback to localStorage
            const historyKey = `note-ninjas-history-${userData.email}`;
            const storedHistory = localStorage.getItem(historyKey);
            if (storedHistory) {
              setCaseHistory(JSON.parse(storedHistory));
            }
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
      setIsLoading(false);
    };
    
    loadUserData();
  }, []);

  // Load form data from sessionStorage on component mount
  useEffect(() => {
    const storedFormData = sessionStorage.getItem("note-ninjas-form-data");
    const storedInputMode = sessionStorage.getItem("note-ninjas-input-mode");

    console.log("Loading form data from storage:", storedFormData);
    console.log("Loading input mode:", storedInputMode);

    if (storedFormData) {
      try {
        const parsedData = JSON.parse(storedFormData);
        console.log("Parsed form data:", parsedData);
        setFormData(parsedData);
        setHasLoadedPrefill(true);
      } catch (error) {
        console.error("Error parsing stored form data:", error);
      }
    }

    if (storedInputMode) {
      setInputMode(storedInputMode as "simple" | "detailed");
    }
    if (!storedFormData) {
      setHasLoadedPrefill(true);
    }
  }, []);

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedPrefill) return;
    sessionStorage.setItem("note-ninjas-form-data", JSON.stringify(formData));
  }, [formData, hasLoadedPrefill]);

  // Save input mode to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("note-ninjas-input-mode", inputMode);
  }, [inputMode]);

  const handleLogin = async (email: string) => {
    try {
      // Call backend login API
      const response = await noteNinjasAPI.login(email);

      // Save user data and token
      const userData = {
        id: response.user.id,
        name: response.user.name || email.split('@')[0], // Use email prefix as fallback name
        email: response.user.email
      };
      sessionStorage.setItem("note-ninjas-user", JSON.stringify(userData));
      setUserName(userData.name);
      setIsAuthenticated(true);

      console.log('✅ Logged in successfully:', userData);

      // Load case history from backend
      try {
        const cases = await noteNinjasAPI.getCases();
        const formattedCases = cases.map((c) => ({
          id: c.id,
          name: c.name,
          timestamp: new Date(c.created_at).getTime(),
          caseData: null
        }));
        setCaseHistory(formattedCases);
      } catch (error) {
        console.error('Error loading case history:', error);
        // Fallback to localStorage
        const historyKey = `note-ninjas-history-${email}`;
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
          setCaseHistory(JSON.parse(storedHistory));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const generateCaseName = (caseData: any): string => {
    // Extract age and diagnosis from patient condition
    const condition = caseData.patientCondition || "";

    // Try to extract age
    const ageMatch = condition.match(/(\d+)\s*(?:year|y\/o|yo)/i);
    const age = ageMatch ? ageMatch[1] : "";

    // Helper function to capitalize first letter of each word
    const capitalizeWords = (str: string): string => {
      return str
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    // Try to extract key diagnosis terms
    let diagnosis = "";
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("rotator cuff")) {
      diagnosis = "Rotator Cuff";
    } else if (lowerCondition.includes("knee")) {
      diagnosis = "Knee";
    } else if (lowerCondition.includes("shoulder")) {
      diagnosis = "Shoulder";
    } else if (lowerCondition.includes("back")) {
      diagnosis = "Back";
    } else if (lowerCondition.includes("hip")) {
      diagnosis = "Hip";
    } else if (lowerCondition.includes("ankle")) {
      diagnosis = "Ankle";
    } else {
      // Extract first few words if no specific diagnosis found
      const words = condition.trim().split(/\s+/).slice(0, 3);
      diagnosis = capitalizeWords(words.join(" "));
    }

    if (age && diagnosis) {
      return `${age} Y/o ${diagnosis} Injury`;
    } else if (diagnosis) {
      return `${diagnosis} Injury`;
    } else {
      return "New Case";
    }
  };

  const saveCaseToHistory = (caseData: any) => {
    const userAuth = sessionStorage.getItem("note-ninjas-user");
    if (!userAuth) return;

    try {
      const userData = JSON.parse(userAuth);
      const historyKey = `note-ninjas-history-${userData.email}`;

      const newCase: CaseHistory = {
        id: Date.now().toString(),
        name: generateCaseName(caseData),
        timestamp: Date.now(),
        caseData: caseData,
      };

      const updatedHistory = [newCase, ...caseHistory];
      setCaseHistory(updatedHistory);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error("Error saving case to history:", error);
    }
  };

  const handleSelectCase = async (item: CaseHistory) => {
    // Navigate immediately with case ID in URL params
    setIsSidebarOpen(false);
    router.push(`/note-ninjas/suggestions?caseId=${item.id}`);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAutoFill = () => {
    if (inputMode === "simple") {
      setFormData({
        ...formData,
        patientCondition: "21 year old female with torn rotator cuff",
        desiredOutcome:
          "increase right shoulder abduction painless arc to 150° in 3-4 weeks",
        treatmentProgression:
          "progressed from 130° to 135° in week 1 with resistance band exercises, but progress stalled",
      });
    } else {
      setFormData({
        ...formData,
        patientType: "acute",
        age: "21",
        gender: "Female",
        diagnosis: "Torn rotator cuff",
        dateOfInjury: "3 months ago",
        mechanismOfInjury: "Overhead reaching while playing volleyball",
        comorbidities: "None reported",
        severity: "Moderate - affecting daily activities",
        priorLevelOfFunction: "Full overhead function for work and sports",
        workLifeRequirements:
          "Overhead lifting required for job, recreational volleyball player",
        desiredOutcome:
          "increase right shoulder abduction painless arc to 150° in 3-4 weeks",
        treatmentProgression:
          "progressed from 130° to 135° in week 1 with resistance band exercises, but progress stalled",
      });
    }
    setShowAutoFillDropdown(false);
  };

  // Compute available sections based on current form state
  const availableSections = useMemo(() => {
    if (!formData.visitType || !formData.patientType) {
      return [];
    }

    // Get all sections available for manual selection
    return getAllSectionsForPatientType(formData.patientType, formData.visitType as VisitType);
  }, [formData.visitType, formData.patientType]);

  // Debounce timer ref for LLM section evaluation
  const evaluationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // LLM-based section evaluation - calls API when form data changes
  useEffect(() => {
    // Only evaluate in detailed mode with auto-select and valid patient type
    if (
      inputMode !== "detailed" ||
      formData.sectionSelectionMode !== "auto" ||
      !formData.visitType ||
      !formData.patientType
    ) {
      setLlmSelectedSections([]);
      return;
    }

    // Clear any pending evaluation
    if (evaluationTimeoutRef.current) {
      clearTimeout(evaluationTimeoutRef.current);
    }

    // Debounce the API call by 800ms to avoid too many requests
    evaluationTimeoutRef.current = setTimeout(async () => {
      setIsEvaluatingSections(true);

      try {
        const response = await fetch("/api/evaluate-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientType: formData.patientType,
            visitType: formData.visitType,
            age: formData.age,
            patientCondition: formData.patientCondition,
            desiredOutcome: formData.desiredOutcome,
            treatmentProgression: formData.treatmentProgression,
            diagnosis: formData.diagnosis,
            typeOfSurgery: formData.typeOfSurgery,
            workLifeRequirements: formData.workLifeRequirements,
            comorbidities: formData.comorbidities,
            severity: formData.severity,
            primaryConcern: formData.primaryConcern,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setLlmSelectedSections(data.selectedSections || []);
          setSectionEvaluationReasoning(data.overallReasoning || "");
          console.log("🧠 LLM Section Evaluation:", data);
        } else {
          console.error("Section evaluation failed:", await response.text());
          setLlmSelectedSections([]);
        }
      } catch (error) {
        console.error("Error evaluating sections:", error);
        setLlmSelectedSections([]);
      } finally {
        setIsEvaluatingSections(false);
      }
    }, 800);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (evaluationTimeoutRef.current) {
        clearTimeout(evaluationTimeoutRef.current);
      }
    };
  }, [
    inputMode,
    formData.sectionSelectionMode,
    formData.visitType,
    formData.patientType,
    formData.age,
    formData.patientCondition,
    formData.desiredOutcome,
    formData.treatmentProgression,
    formData.diagnosis,
    formData.typeOfSurgery,
    formData.workLifeRequirements,
    formData.comorbidities,
    formData.severity,
    formData.primaryConcern,
  ]);

  // Convert LLM sections to the format expected by the rest of the app
  const autoSelectedSections: SectionConfig[] = useMemo(() => {
    return llmSelectedSections.map((section) => ({
      sectionName: section.sectionName,
      visibility: section.visibility as "ALWAYS_ON" | "CONDITIONAL" | "TRIGGER" | "HIDDEN",
      discipline: "PT | OT" as const, // Default, actual value comes from API
      ageGroup: "All" as const,
      triggerRule: section.triggerRule,
      contentGuidelines: section.contentGuidelines,
    }));
  }, [llmSelectedSections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Visit type is always required
    if (!formData.visitType) {
      alert("Please select a Visit Type (Physical Therapy or Occupational Therapy).");
      return;
    }

    // Validate based on input mode
    let isValid = false;
    if (inputMode === "simple") {
      isValid = !!(formData.patientCondition && formData.desiredOutcome);
    } else {
      // Common required fields for all detailed paths
      const commonFieldsValid = !!(
        formData.patientType &&
        formData.age &&
        formData.desiredOutcome
      );

      // Path-specific required fields
      let pathFieldsValid = false;
      switch (formData.patientType) {
        case "acute":
          pathFieldsValid = !!(formData.diagnosis && formData.severity);
          break;
        case "post-surgical":
          pathFieldsValid = !!(formData.typeOfSurgery);
          break;
        case "chronic":
          pathFieldsValid = !!(formData.diagnosis);
          break;
        case "functional":
          pathFieldsValid = !!(formData.primaryConcern);
          break;
        case "neurological":
          pathFieldsValid = !!(formData.diagnosis);
          break;
        case "cognitive":
          pathFieldsValid = !!(formData.primaryConcern);
          break;
        default:
          pathFieldsValid = false;
      }

      isValid = commonFieldsValid && pathFieldsValid;
    }

    if (isValid) {
      setIsProcessing(true);

      // Save case data for suggestions page with streaming flag
      let patientConditionFinal = formData.patientCondition;

      if (inputMode === "detailed") {
        const gender = formData.gender?.toLowerCase() || "patient";
        const age = formData.age;

        switch (formData.patientType) {
          case "acute":
            patientConditionFinal = `${age} year old ${gender} with ${formData.diagnosis}${
              formData.dateOfInjury ? `, date of injury: ${formData.dateOfInjury}` : ""
            }${
              formData.mechanismOfInjury ? `, mechanism: ${formData.mechanismOfInjury}` : ""
            }${
              formData.comorbidities ? `, comorbidities: ${formData.comorbidities}` : ""
            }, severity: ${formData.severity}${
              formData.priorLevelOfFunction ? `, prior function: ${formData.priorLevelOfFunction}` : ""
            }${
              formData.workLifeRequirements ? `, work/life needs: ${formData.workLifeRequirements}` : ""
            }`;
            break;

          case "post-surgical":
            patientConditionFinal = `${age} year old ${gender}, post-surgical recovery from ${formData.typeOfSurgery}${
              formData.dateOfSurgery ? `, date of surgery: ${formData.dateOfSurgery}` : ""
            }${
              formData.surgicalIndication ? `, indication: ${formData.surgicalIndication}` : ""
            }${
              formData.comorbidities ? `, comorbidities: ${formData.comorbidities}` : ""
            }${
              formData.currentPostOpPhase ? `, current phase: ${formData.currentPostOpPhase}` : ""
            }${
              formData.preOperativeFunction ? `, pre-op function: ${formData.preOperativeFunction}` : ""
            }${
              formData.workLifeRequirements ? `, work/life needs: ${formData.workLifeRequirements}` : ""
            }`;
            break;

          case "chronic":
            patientConditionFinal = `${age} year old ${gender} with ${formData.diagnosis}${
              formData.duration ? `, duration: ${formData.duration}` : ""
            }${
              formData.progressionPattern ? `, progression: ${formData.progressionPattern}` : ""
            }${
              formData.comorbidities ? `, comorbidities: ${formData.comorbidities}` : ""
            }${
              formData.currentBaselineFunction ? `, current baseline: ${formData.currentBaselineFunction}` : ""
            }${
              formData.priorBaseline ? `, prior baseline: ${formData.priorBaseline}` : ""
            }${
              formData.workLifeRequirements ? `, work/life needs: ${formData.workLifeRequirements}` : ""
            }`;
            break;

          case "functional":
            patientConditionFinal = `${age} year old ${gender}, functional/developmental support needed for: ${formData.primaryConcern}${
              formData.currentAbilitiesLimitations ? `, abilities/limitations: ${formData.currentAbilitiesLimitations}` : ""
            }${
              formData.environmentalContext ? `, environment: ${formData.environmentalContext}` : ""
            }${
              formData.comorbidities ? `, comorbidities: ${formData.comorbidities}` : ""
            }${
              formData.dailyActivityGoals ? `, daily goals: ${formData.dailyActivityGoals}` : ""
            }`;
            break;

          case "neurological":
            patientConditionFinal = `${age} year old ${gender} with ${formData.diagnosis} (neurological rehabilitation)${
              formData.dateOfOnset ? `, onset: ${formData.dateOfOnset}` : ""
            }${
              formData.comorbidities ? `, comorbidities: ${formData.comorbidities}` : ""
            }${
              formData.severity ? `, severity: ${formData.severity}` : ""
            }${
              formData.priorLevelOfFunction ? `, prior function: ${formData.priorLevelOfFunction}` : ""
            }${
              formData.workLifeRequirements ? `, work/life needs: ${formData.workLifeRequirements}` : ""
            }`;
            break;

          case "cognitive":
            patientConditionFinal = `${age} year old ${gender}, cognitive & safety management needed for: ${formData.primaryConcern}${
              formData.currentAbilitiesLimitations ? `, cognitive status: ${formData.currentAbilitiesLimitations}` : ""
            }${
              formData.environmentalContext ? `, environment: ${formData.environmentalContext}` : ""
            }${
              formData.comorbidities ? `, comorbidities: ${formData.comorbidities}` : ""
            }${
              formData.dailyActivityGoals ? `, safety/daily goals: ${formData.dailyActivityGoals}` : ""
            }`;
            break;
        }
      }
      
      // Determine which sections to use
      const sectionsToUse = formData.sectionSelectionMode === "manual" && formData.selectedSections.length > 0
        ? availableSections.filter(s => formData.selectedSections.includes(s.sectionName))
        : autoSelectedSections;

      const caseData = {
        isStreaming: true,
        sessionId: `session_${Date.now()}`,
        // Store data for UI
        patientCondition: patientConditionFinal,
        desiredOutcome: formData.desiredOutcome,
        treatmentProgression: formData.treatmentProgression,
        inputMode,
        visitType: formData.visitType,
        patientType: formData.patientType,
        // Store sections for API
        sections: sectionsToUse.map(s => ({
          sectionName: s.sectionName,
          contentGuidelines: s.contentGuidelines,
          triggerRule: s.triggerRule,
        })),
        // Store userInput for API (snake_case format for DB)
        userInput: {
          patient_condition: patientConditionFinal,
          desired_outcome: formData.desiredOutcome,
          treatment_progression: formData.treatmentProgression || "",
          input_mode: inputMode,
          visit_type: formData.visitType,
          patient_type: formData.patientType,
          session_id: `session_${Date.now()}`,
          // Include detailed fields if available
          age: formData.age,
          gender: formData.gender,
          diagnosis: formData.diagnosis,
          comorbidities: formData.comorbidities,
          severity: formData.severity,
          date_of_onset: formData.dateOfOnset,
          prior_level_of_function: formData.priorLevelOfFunction,
          work_life_requirements: formData.workLifeRequirements,
          type_of_surgery: formData.typeOfSurgery,
          // Include sections info
          sections: sectionsToUse.map(s => s.sectionName),
          section_selection_mode: formData.sectionSelectionMode,
        },
      };

      sessionStorage.setItem("note-ninjas-case", JSON.stringify(caseData));

      // Save to case history
      saveCaseToHistory(caseData);

      // Navigate immediately - streaming will happen on suggestions page
      router.push("/note-ninjas/suggestions");
    } else {
      alert("Please fill in the required fields.");
    }
  };


  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent"></div>
      </main>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
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
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="bg-teal-50 rounded-lg shadow-sm p-4 mb-6 border border-teal-100">
            <div className="text-center">
              <Logo size="sm" className="mb-2" />
              <p className="text-gray-700 text-sm">
                The PT/OT Brainstorming Partner
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Auto-fill Button */}
            <div className="flex justify-end mb-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAutoFillDropdown(!showAutoFillDropdown)}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Quick fill demo case
                </button>

                {/* Auto-fill Dropdown */}
                {showAutoFillDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                        Fill with example case:
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        className="w-full text-left px-3 py-3 hover:bg-teal-50 rounded-md transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          Shoulder Impingement Case
                        </div>
                        <div className="text-xs text-gray-500">
                          21yo female with rotator cuff tear, stalled progress
                          example
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Share Your Case Details
              </h2>
              <p className="text-gray-600">
                Provide information about your patient and treatment goals for
                personalized brainstorming suggestions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Visit Type Toggle - FIRST in the form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Visit Type *
                </label>
                <div className="inline-flex bg-teal-100 rounded-lg p-1 border border-teal-200">
                  <button
                    type="button"
                    onClick={() => handleInputChange("visitType", "PT")}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      formData.visitType === "PT"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    Physical Therapy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange("visitType", "OT")}
                    className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      formData.visitType === "OT"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    Occupational Therapy
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Select the type of therapy visit to customize the exercise sections
                </p>
              </div>

              {/* Input Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Patient Condition Input Mode
                </label>
                <div className="inline-flex bg-teal-100 rounded-lg p-1 border border-teal-200">
                  <button
                    type="button"
                    onClick={() => setInputMode("simple")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      inputMode === "simple"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("detailed")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      inputMode === "detailed"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    Detailed
                  </button>
                </div>
              </div>

              {/* Patient Condition - Simple Mode */}
              {inputMode === "simple" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Condition and Details *
                  </label>
                  <textarea
                    value={formData.patientCondition}
                    onChange={(e) =>
                      handleInputChange("patientCondition", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    rows={3}
                    placeholder="21 year old female with torn rotator cuff"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Include age, gender, diagnosis, and relevant details about
                    the condition
                  </p>
                </div>
              )}

              {/* Patient Condition - Detailed Mode */}
              {inputMode === "detailed" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Patient Details
                  </h3>

                  {/* Patient Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Type *
                    </label>
                    <select
                      value={formData.patientType}
                      onChange={(e) =>
                        handleInputChange("patientType", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      required
                    >
                      <option value="">Select patient type</option>
                      <option value="acute">Acute injury or trauma</option>
                      <option value="post-surgical">Post-surgical recovery</option>
                      <option value="chronic">Chronic or progressive condition (Neuro/Ortho)</option>
                      <option value="functional">Functional or developmental support (Pediatrics)</option>
                      <option value="neurological">Neurological rehabilitation (Stroke/TBI)</option>
                      <option value="cognitive">Cognitive &amp; Safety Management</option>
                    </select>
                  </div>

                  {/* Common Fields - Age and Gender */}
                  {formData.patientType && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Age */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Age *
                        </label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) =>
                            handleInputChange("age", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="21"
                          min="1"
                          max="120"
                          required
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            handleInputChange("gender", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Acute Injury or Trauma Path */}
                  {formData.patientType === "acute" && (
                    <>
                      {/* Primary Diagnosis */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Diagnosis *
                        </label>
                        <input
                          type="text"
                          value={formData.diagnosis}
                          onChange={(e) =>
                            handleInputChange("diagnosis", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="Torn rotator cuff"
                          required
                        />
                      </div>

                      {/* Date of Injury */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Injury
                        </label>
                        <input
                          type="text"
                          value={formData.dateOfInjury}
                          onChange={(e) =>
                            handleInputChange("dateOfInjury", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="3 months ago"
                        />
                      </div>

                      {/* Mechanism of Injury */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mechanism of Injury
                        </label>
                        <textarea
                          value={formData.mechanismOfInjury}
                          onChange={(e) =>
                            handleInputChange("mechanismOfInjury", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Fall during sports, motor vehicle accident, etc."
                        />
                      </div>

                      {/* Co-morbidities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Co-morbidities
                        </label>
                        <textarea
                          value={formData.comorbidities}
                          onChange={(e) =>
                            handleInputChange("comorbidities", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Diabetes, hypertension, previous injuries, etc."
                        />
                      </div>

                      {/* Severity/Functional Impact */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severity/Functional Impact *
                        </label>
                        <select
                          value={formData.severity}
                          onChange={(e) =>
                            handleInputChange("severity", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          required
                        >
                          <option value="">Select severity level</option>
                          <option value="Mild - minimal impact on daily activities">
                            Mild - minimal impact on daily activities
                          </option>
                          <option value="Moderate - affecting daily activities">
                            Moderate - affecting daily activities
                          </option>
                          <option value="Severe - significantly limiting function">
                            Severe - significantly limiting function
                          </option>
                          <option value="Complete loss of function">
                            Complete loss of function
                          </option>
                        </select>
                      </div>

                      {/* Prior Level of Function */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prior Level of Function
                        </label>
                        <textarea
                          value={formData.priorLevelOfFunction}
                          onChange={(e) =>
                            handleInputChange("priorLevelOfFunction", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Full overhead function for work and sports"
                        />
                      </div>

                      {/* Work/Life Requirements */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Work/Life Requirements
                        </label>
                        <textarea
                          value={formData.workLifeRequirements}
                          onChange={(e) =>
                            handleInputChange("workLifeRequirements", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Overhead lifting required for job, recreational volleyball player"
                        />
                      </div>
                    </>
                  )}

                  {/* Post-Surgical Recovery Path */}
                  {formData.patientType === "post-surgical" && (
                    <>
                      {/* Type of Surgery/Procedure */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type of Surgery/Procedure *
                        </label>
                        <input
                          type="text"
                          value={formData.typeOfSurgery}
                          onChange={(e) =>
                            handleInputChange("typeOfSurgery", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="Total knee replacement, ACL reconstruction, etc."
                          required
                        />
                      </div>

                      {/* Date of Surgery */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Surgery
                        </label>
                        <input
                          type="text"
                          value={formData.dateOfSurgery}
                          onChange={(e) =>
                            handleInputChange("dateOfSurgery", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="2 weeks ago"
                        />
                      </div>

                      {/* Surgical Indication */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Surgical Indication
                        </label>
                        <textarea
                          value={formData.surgicalIndication}
                          onChange={(e) =>
                            handleInputChange("surgicalIndication", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Reason for surgery, pre-operative diagnosis"
                        />
                      </div>

                      {/* Co-morbidities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Co-morbidities
                        </label>
                        <textarea
                          value={formData.comorbidities}
                          onChange={(e) =>
                            handleInputChange("comorbidities", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Diabetes, hypertension, previous surgeries, etc."
                        />
                      </div>

                      {/* Current Post-Op Phase */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Post-Op Phase
                        </label>
                        <select
                          value={formData.currentPostOpPhase}
                          onChange={(e) =>
                            handleInputChange("currentPostOpPhase", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">Select phase</option>
                          <option value="Protection">Protection</option>
                          <option value="Early mobilization">Early mobilization</option>
                          <option value="Strengthening">Strengthening</option>
                          <option value="Return to function">Return to function</option>
                        </select>
                      </div>

                      {/* Pre-operative Function */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pre-operative Function
                        </label>
                        <textarea
                          value={formData.preOperativeFunction}
                          onChange={(e) =>
                            handleInputChange("preOperativeFunction", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Functional status before surgery"
                        />
                      </div>

                      {/* Work/Life Requirements */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Work/Life Requirements
                        </label>
                        <textarea
                          value={formData.workLifeRequirements}
                          onChange={(e) =>
                            handleInputChange("workLifeRequirements", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Activities patient needs to return to"
                        />
                      </div>
                    </>
                  )}

                  {/* Chronic or Progressive Condition Path */}
                  {formData.patientType === "chronic" && (
                    <>
                      {/* Primary Diagnosis */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Diagnosis *
                        </label>
                        <input
                          type="text"
                          value={formData.diagnosis}
                          onChange={(e) =>
                            handleInputChange("diagnosis", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="Parkinson's disease, multiple sclerosis, etc."
                          required
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={formData.duration}
                          onChange={(e) =>
                            handleInputChange("duration", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="5 years, 18 months, etc."
                        />
                      </div>

                      {/* Progression Pattern */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Progression Pattern
                        </label>
                        <select
                          value={formData.progressionPattern}
                          onChange={(e) =>
                            handleInputChange("progressionPattern", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">Select pattern</option>
                          <option value="Rapidly declining">Rapidly declining</option>
                          <option value="Slowly worsening">Slowly worsening</option>
                          <option value="Stable">Stable</option>
                          <option value="Slowly improving">Slowly improving</option>
                          <option value="Rapidly improving">Rapidly improving</option>
                          <option value="Fluctuating">Fluctuating</option>
                        </select>
                      </div>

                      {/* Co-morbidities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Co-morbidities
                        </label>
                        <textarea
                          value={formData.comorbidities}
                          onChange={(e) =>
                            handleInputChange("comorbidities", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Related conditions, complications, etc."
                        />
                      </div>

                      {/* Current Baseline Function */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Baseline Function
                        </label>
                        <textarea
                          value={formData.currentBaselineFunction}
                          onChange={(e) =>
                            handleInputChange("currentBaselineFunction", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Current functional abilities and limitations"
                        />
                      </div>

                      {/* Prior Baseline */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prior Baseline
                        </label>
                        <textarea
                          value={formData.priorBaseline}
                          onChange={(e) =>
                            handleInputChange("priorBaseline", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Previous level of function for comparison"
                        />
                      </div>

                      {/* Work/Life Requirements */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Work/Life Requirements
                        </label>
                        <textarea
                          value={formData.workLifeRequirements}
                          onChange={(e) =>
                            handleInputChange("workLifeRequirements", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Important activities and roles in daily life"
                        />
                      </div>
                    </>
                  )}

                  {/* Functional or Developmental Support Path */}
                  {formData.patientType === "functional" && (
                    <>
                      {/* Primary Concern */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Concern *
                        </label>
                        <textarea
                          value={formData.primaryConcern}
                          onChange={(e) =>
                            handleInputChange("primaryConcern", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Main functional limitation or developmental need"
                          required
                        />
                      </div>

                      {/* Current Abilities and Limitations */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Abilities and Limitations
                        </label>
                        <textarea
                          value={formData.currentAbilitiesLimitations}
                          onChange={(e) =>
                            handleInputChange("currentAbilitiesLimitations", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={3}
                          placeholder="What the patient can and cannot do currently"
                        />
                      </div>

                      {/* Environmental Context */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Environmental Context
                        </label>
                        <textarea
                          value={formData.environmentalContext}
                          onChange={(e) =>
                            handleInputChange("environmentalContext", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={3}
                          placeholder="Home setup, support system, assistive devices currently used"
                        />
                      </div>

                      {/* Co-morbidities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Co-morbidities
                        </label>
                        <textarea
                          value={formData.comorbidities}
                          onChange={(e) =>
                            handleInputChange("comorbidities", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Related conditions or concerns"
                        />
                      </div>

                      {/* Daily Activity Goals */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Daily Activity Goals
                        </label>
                        <textarea
                          value={formData.dailyActivityGoals}
                          onChange={(e) =>
                            handleInputChange("dailyActivityGoals", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Specific daily activities patient wants to improve"
                        />
                      </div>
                    </>
                  )}

                  {/* Neurological Rehabilitation (Stroke/TBI) Path */}
                  {formData.patientType === "neurological" && (
                    <>
                      {/* Primary Diagnosis */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Diagnosis *
                        </label>
                        <input
                          type="text"
                          value={formData.diagnosis}
                          onChange={(e) =>
                            handleInputChange("diagnosis", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="CVA (stroke), TBI, etc."
                          required
                        />
                      </div>

                      {/* Date of Onset */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Onset
                        </label>
                        <input
                          type="text"
                          value={formData.dateOfOnset}
                          onChange={(e) =>
                            handleInputChange("dateOfOnset", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="2 weeks ago, 6 months ago, etc."
                        />
                      </div>

                      {/* Co-morbidities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Co-morbidities
                        </label>
                        <textarea
                          value={formData.comorbidities}
                          onChange={(e) =>
                            handleInputChange("comorbidities", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Hypertension, diabetes, etc."
                        />
                      </div>

                      {/* Severity/Functional Impact */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severity/Functional Impact
                        </label>
                        <select
                          value={formData.severity}
                          onChange={(e) =>
                            handleInputChange("severity", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          <option value="">Select severity level</option>
                          <option value="Mild - minimal impact on daily activities">
                            Mild - minimal impact on daily activities
                          </option>
                          <option value="Moderate - affecting daily activities">
                            Moderate - affecting daily activities
                          </option>
                          <option value="Severe - significantly limiting function">
                            Severe - significantly limiting function
                          </option>
                        </select>
                      </div>

                      {/* Prior Level of Function */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prior Level of Function (PLOF)
                        </label>
                        <textarea
                          value={formData.priorLevelOfFunction}
                          onChange={(e) =>
                            handleInputChange("priorLevelOfFunction", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Independent with all ADLs, community ambulation, etc."
                        />
                      </div>

                      {/* Work/Life Requirements */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Work/Life Requirements
                        </label>
                        <textarea
                          value={formData.workLifeRequirements}
                          onChange={(e) =>
                            handleInputChange("workLifeRequirements", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Return to work, driving, caregiving responsibilities, etc."
                        />
                      </div>
                    </>
                  )}

                  {/* Cognitive & Safety Management Path */}
                  {formData.patientType === "cognitive" && (
                    <>
                      {/* Primary Concern */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Concern *
                        </label>
                        <textarea
                          value={formData.primaryConcern}
                          onChange={(e) =>
                            handleInputChange("primaryConcern", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Dementia, safety awareness deficits, fall risk, etc."
                          required
                        />
                      </div>

                      {/* Current Cognitive Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Cognitive Status
                        </label>
                        <textarea
                          value={formData.currentAbilitiesLimitations}
                          onChange={(e) =>
                            handleInputChange("currentAbilitiesLimitations", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={3}
                          placeholder="Memory, attention, judgment, safety awareness, etc."
                        />
                      </div>

                      {/* Environmental Context */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Environmental Context
                        </label>
                        <textarea
                          value={formData.environmentalContext}
                          onChange={(e) =>
                            handleInputChange("environmentalContext", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={3}
                          placeholder="Home setup, caregiver support, supervision needs, etc."
                        />
                      </div>

                      {/* Co-morbidities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Co-morbidities
                        </label>
                        <textarea
                          value={formData.comorbidities}
                          onChange={(e) =>
                            handleInputChange("comorbidities", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Related conditions or concerns"
                        />
                      </div>

                      {/* Safety/Daily Activity Goals */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Safety/Daily Activity Goals
                        </label>
                        <textarea
                          value={formData.dailyActivityGoals}
                          onChange={(e) =>
                            handleInputChange("dailyActivityGoals", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          rows={2}
                          placeholder="Medication management, safe transfers, wandering prevention, etc."
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Desired Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Outcome *
                </label>
                <textarea
                  value={formData.desiredOutcome}
                  onChange={(e) =>
                    handleInputChange("desiredOutcome", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  rows={3}
                  placeholder="increase right shoulder abduction painless arc to 150° in 3-4 weeks"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Describe specific, measurable goals and desired timeframe
                </p>
              </div>

              {/* Treatment Progression */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Treatment Progression (Optional)
                </label>
                <textarea
                  value={formData.treatmentProgression}
                  onChange={(e) =>
                    handleInputChange("treatmentProgression", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  rows={4}
                  placeholder="progressed from 130° to 135° in week 1 with resistance band exercises, but progress stalled"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Include what&apos;s been tried, what worked, what didn&apos;t, and where
                  you&apos;re stuck
                </p>
              </div>

              {/* Section Selection - Only show in Detailed mode */}
              {/* {inputMode === "detailed" && formData.patientType && formData.visitType && ( */}
                <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Section Selection
                  </label>

                  <div className="inline-flex bg-teal-100 rounded-lg p-1 mb-4 border border-teal-200">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, sectionSelectionMode: "auto", selectedSections: [] }));
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        formData.sectionSelectionMode === "auto"
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-teal-600 hover:bg-teal-50"
                      }`}
                    >
                      Auto-Select Sections
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sectionSelectionMode: "manual" }))}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        formData.sectionSelectionMode === "manual"
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-teal-600 hover:bg-teal-50"
                      }`}
                    >
                      Manually Choose Sections
                    </button>
                  </div>

                  {formData.sectionSelectionMode === "auto" ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        AI-powered section selection based on clinical context:
                      </p>
                      {isEvaluatingSections ? (
                        <div className="flex items-center text-sm text-teal-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent mr-2"></div>
                          Analyzing patient data to determine relevant sections...
                        </div>
                      ) : autoSelectedSections.length > 0 ? (
                        <div>
                          <ul className="space-y-2">
                            {autoSelectedSections.map((section, idx) => {
                              const llmSection = llmSelectedSections.find(s => s.sectionName === section.sectionName);
                              return (
                                <li key={idx} className="text-sm text-gray-700">
                                  <div className="flex items-start">
                                    <svg className="w-4 h-4 text-teal-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <div>
                                      <span className="font-medium">{section.sectionName}</span>
                                      {llmSection?.reasoning && (
                                        <p className="text-xs text-gray-500 mt-0.5">{llmSection.reasoning}</p>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          {sectionEvaluationReasoning && (
                            <div className="mt-3 p-2 bg-white rounded border border-teal-100">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium text-teal-700">Clinical reasoning:</span> {sectionEvaluationReasoning}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Fill in patient details to see AI-recommended sections.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Select the sections you want to include:
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto bg-white rounded-lg p-2 border border-teal-100">
                        {availableSections.map((section, idx) => (
                          <label key={idx} className="flex items-start p-2 hover:bg-teal-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.selectedSections.includes(section.sectionName)}
                              onChange={(e) => {
                                const newSections = e.target.checked
                                  ? [...formData.selectedSections, section.sectionName]
                                  : formData.selectedSections.filter(s => s !== section.sectionName);
                                setFormData({ ...formData, selectedSections: newSections });
                              }}
                              className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-medium text-gray-900">{section.sectionName}</span>
                              <p className="text-xs text-gray-500">{section.contentGuidelines}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      {formData.selectedSections.length === 0 && (
                        <p className="text-sm text-amber-600 mt-2">
                          Please select at least one section.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              {/* // )} */}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Generating Suggestions...
                    </>
                  ) : (
                    <>
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
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Get Brainstorming Suggestions
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-teal-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-teal-900">
                  What Planwise will help with:
                </h3>
                <div className="mt-2 text-sm text-teal-800">
                  <p className="mb-2">Get personalized suggestions for:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Alternative treatment approaches when progress stalls
                    </li>
                    <li>
                      Creative exercise modifications for challenging cases
                    </li>
                    <li>Documentation strategies for complex conditions</li>
                    <li>Evidence-based interventions for specific goals</li>
                    <li>Problem-solving for treatment plateaus</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
