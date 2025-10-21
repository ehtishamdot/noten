"use client";

import { useState, useEffect } from "react";
import { noteNinjasAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import LoginPage from "../components/LoginPage";
import HistorySidebar from "../components/HistorySidebar";

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
  const [showAutoFillDropdown, setShowAutoFillDropdown] = useState(false);
  const [inputMode, setInputMode] = useState<"simple" | "detailed">("simple");

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

  const handleLogin = async (name: string, email: string) => {
    try {
      // Call backend login API
      const response = await noteNinjasAPI.login(name, email);
      
      // Save user data and token
      const userData = { 
        id: response.user.id,
        name: response.user.name, 
        email: response.user.email 
      };
      sessionStorage.setItem("note-ninjas-user", JSON.stringify(userData));
      setUserName(name);
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
          isStreaming: false
        };
        
        sessionStorage.setItem("note-ninjas-case", JSON.stringify(caseData));
      } else {
        sessionStorage.setItem("note-ninjas-case", JSON.stringify(item.caseData));
      }
      
      setIsSidebarOpen(false);
      // Navigate to suggestions page
      router.push("/note-ninjas/suggestions");
    } catch (error) {
      console.error("Error loading case:", error);
    }
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
        age: "21",
        gender: "Female",
        diagnosis: "Torn rotator cuff",
        comorbidities: "None reported",
        severity: "Moderate - affecting daily activities",
        dateOfOnset: "3 months ago",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on input mode
    let isValid = false;
    if (inputMode === "simple") {
      isValid = !!(formData.patientCondition && formData.desiredOutcome);
    } else {
      isValid = !!(
        formData.age &&
        formData.diagnosis &&
        formData.severity &&
        formData.desiredOutcome
      );
    }

    if (isValid) {
      setIsProcessing(true);

      // Save case data for suggestions page with streaming flag
      const patientConditionFinal = inputMode === "detailed"
        ? `${formData.age} year old ${
            formData.gender?.toLowerCase() || "patient"
          } with ${formData.diagnosis}${
            formData.comorbidities
              ? `, comorbidities: ${formData.comorbidities}`
              : ""
          }, severity: ${formData.severity}${
            formData.dateOfOnset ? `, onset: ${formData.dateOfOnset}` : ""
          }${
            formData.priorLevelOfFunction
              ? `, prior function: ${formData.priorLevelOfFunction}`
              : ""
          }${
            formData.workLifeRequirements
              ? `, work/life needs: ${formData.workLifeRequirements}`
              : ""
          }`
        : formData.patientCondition;
      
      const caseData = {
        isStreaming: true,
        sessionId: `session_${Date.now()}`,
        // Store data for UI
        patientCondition: patientConditionFinal,
        desiredOutcome: formData.desiredOutcome,
        treatmentProgression: formData.treatmentProgression,
        inputMode,
        // Store userInput for API (snake_case format for DB)
        userInput: {
          patient_condition: patientConditionFinal,
          desired_outcome: formData.desiredOutcome,
          treatment_progression: formData.treatmentProgression || "",
          input_mode: inputMode,
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
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
          <div className="bg-purple-50 rounded-lg shadow-sm p-4 mb-6 border border-purple-100">
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
                        className="w-full text-left px-3 py-3 hover:bg-purple-50 rounded-md transition-colors"
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
              {/* Input Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Patient Condition Input Mode
                </label>
                <div className="inline-flex bg-purple-100 rounded-lg p-1 border border-purple-200">
                  <button
                    type="button"
                    onClick={() => setInputMode("simple")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      inputMode === "simple"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("detailed")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      inputMode === "detailed"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-purple-600 hover:bg-purple-50"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Diagnosis */}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Torn rotator cuff"
                      required
                    />
                  </div>

                  {/* Comorbidities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Co-morbidities (comma-separated)
                    </label>
                    <textarea
                      value={formData.comorbidities}
                      onChange={(e) =>
                        handleInputChange("comorbidities", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      rows={2}
                      placeholder="Diabetes, hypertension, previous surgeries, etc."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      List any relevant medical conditions or previous injuries
                    </p>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity/Functional Impact *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) =>
                        handleInputChange("severity", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="3 months ago"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      When did the condition/injury begin?
                    </p>
                  </div>

                  {/* Prior Level of Function */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prior Level of Function
                    </label>
                    <textarea
                      value={formData.priorLevelOfFunction}
                      onChange={(e) =>
                        handleInputChange(
                          "priorLevelOfFunction",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      rows={2}
                      placeholder="Full overhead function for work and sports"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      What was the patient&apos;s function like before this
                      condition?
                    </p>
                  </div>

                  {/* Work/Life Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work/Life Requirements
                    </label>
                    <textarea
                      value={formData.workLifeRequirements}
                      onChange={(e) =>
                        handleInputChange(
                          "workLifeRequirements",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      rows={2}
                      placeholder="Overhead lifting required for job, recreational volleyball player"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      What activities does the patient need to return to?
                    </p>
                  </div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  rows={4}
                  placeholder="progressed from 130° to 135° in week 1 with resistance band exercises, but progress stalled"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Include what&apos;s been tried, what worked, what didn&apos;t, and where
                  you&apos;re stuck
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-purple-600 mt-0.5"
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
                <h3 className="text-sm font-medium text-purple-900">
                  What Note Ninjas will help with:
                </h3>
                <div className="mt-2 text-sm text-purple-800">
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
