"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface CPTCode {
  code: string;
  description: string;
  duration: number;
  category: string;
  notes: string;
}

interface SelectedTreatment {
  id: string;
  code: string;
  description: string;
  duration: number;
  notes: string;
}

export default function CPTSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [treatmentOptions, setTreatmentOptions] = useState<CPTCode[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<
    SelectedTreatment[]
  >([]);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Load patient data from sessionStorage
    const storedData = sessionStorage.getItem(`patient-${patientId}`);
    if (storedData) {
      const patientData = JSON.parse(storedData);
      setPatientInfo(patientData);

      // Generate treatment options based on injury
      const options = generateTreatmentOptions(patientData.patientInjury || "");
      setTreatmentOptions(options);
      setLoading(false);
    } else {
      router.push("/");
    }
  }, [patientId, router]);

  const generateTreatmentOptions = (injury: string): CPTCode[] => {
    // Generate CPT codes based on injury type
    const injuryLower = injury.toLowerCase();

    if (injuryLower.includes("shoulder") || injuryLower.includes("arm")) {
      return [
        {
          code: "97140",
          description: "Manual Therapy",
          duration: 15,
          category: "Manual",
          notes: "Glenohumeral joint mobilizations posterior glides",
        },
        {
          code: "97140",
          description: "Manual Therapy",
          duration: 15,
          category: "Manual",
          notes: "Soft tissue mobilization pectoralis minor release",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Rotator cuff strengthening with resistance bands",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Scapular stabilization wall slides and retractions",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Posterior capsule stretching and flexibility exercises",
        },
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          duration: 15,
          category: "Neuro",
          notes: "Scapular setting and postural awareness training",
        },
        {
          code: "97530",
          description: "Therapeutic Activities",
          duration: 15,
          category: "Functional",
          notes: "Overhead reaching simulation work tasks",
        },
        {
          code: "97530",
          description: "Therapeutic Activities",
          duration: 15,
          category: "Functional",
          notes: "Functional lifting mechanics training overhead",
        },
        {
          code: "97035",
          description: "Ultrasound",
          duration: 10,
          category: "Modality",
          notes: "Thermal ultrasound to rotator cuff tendons",
        },
        {
          code: "97032",
          description: "Electrical Stimulation",
          duration: 15,
          category: "Modality",
          notes: "NMES to deltoid and supraspinatus activation",
        },
      ];
    } else if (injuryLower.includes("knee") || injuryLower.includes("leg")) {
      return [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Quadriceps strengthening straight leg raises",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Hamstring flexibility and strengthening exercises",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Knee range of motion heel slides",
        },
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          duration: 15,
          category: "Neuro",
          notes: "Single leg balance proprioception training",
        },
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          duration: 15,
          category: "Neuro",
          notes: "Dynamic knee stability valgus control",
        },
        {
          code: "97116",
          description: "Gait Training",
          duration: 15,
          category: "Mobility",
          notes: "Normal gait pattern weight bearing progression",
        },
        {
          code: "97140",
          description: "Manual Therapy",
          duration: 15,
          category: "Manual",
          notes: "Knee joint mobilizations patellar glides",
        },
        {
          code: "97530",
          description: "Therapeutic Activities",
          duration: 15,
          category: "Functional",
          notes: "Sport specific cutting and jumping drills",
        },
        {
          code: "97032",
          description: "Electrical Stimulation",
          duration: 15,
          category: "Modality",
          notes: "NMES quadriceps muscle re education",
        },
        {
          code: "97010",
          description: "Hot/Cold Packs",
          duration: 10,
          category: "Modality",
          notes: "Ice application post exercise swelling control",
        },
      ];
    } else if (injuryLower.includes("back") || injuryLower.includes("spine")) {
      return [
        {
          code: "97140",
          description: "Manual Therapy",
          duration: 15,
          category: "Manual",
          notes: "Lumbar spine mobilizations grade II",
        },
        {
          code: "97140",
          description: "Manual Therapy",
          duration: 15,
          category: "Manual",
          notes: "Soft tissue mobilization paraspinal muscles",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Core stabilization transverse abdominis activation",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Lumbar flexibility stretching hip flexors",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Gluteal strengthening hip abductor exercises",
        },
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          duration: 15,
          category: "Neuro",
          notes: "Balance training fall prevention exercises",
        },
        {
          code: "97116",
          description: "Gait Training",
          duration: 15,
          category: "Mobility",
          notes: "Upright posture gait mechanics training",
        },
        {
          code: "97530",
          description: "Therapeutic Activities",
          duration: 15,
          category: "Functional",
          notes: "Lifting mechanics body mechanics education",
        },
        {
          code: "97010",
          description: "Hot/Cold Packs",
          duration: 10,
          category: "Modality",
          notes: "Moist heat lumbar region pain relief",
        },
        {
          code: "97032",
          description: "Electrical Stimulation",
          duration: 15,
          category: "Modality",
          notes: "TENS unit lumbar pain management",
        },
      ];
    } else {
      // Default general PT codes
      return [
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Strengthening exercises targeted muscle groups",
        },
        {
          code: "97110",
          description: "Therapeutic Exercise",
          duration: 15,
          category: "Exercise",
          notes: "Range of motion flexibility exercises",
        },
        {
          code: "97140",
          description: "Manual Therapy",
          duration: 15,
          category: "Manual",
          notes: "Joint mobilizations grade III techniques",
        },
        {
          code: "97140",
          description: "Manual Therapy",
          duration: 15,
          category: "Manual",
          notes: "Soft tissue mobilization trigger point release",
        },
        {
          code: "97112",
          description: "Neuromuscular Re-education",
          duration: 15,
          category: "Neuro",
          notes: "Balance and coordination proprioception training",
        },
        {
          code: "97530",
          description: "Therapeutic Activities",
          duration: 15,
          category: "Functional",
          notes: "Functional movement patterns task training",
        },
        {
          code: "97116",
          description: "Gait Training",
          duration: 15,
          category: "Mobility",
          notes: "Normal gait pattern biomechanics training",
        },
        {
          code: "97535",
          description: "Self-care Training",
          duration: 15,
          category: "ADL",
          notes: "Activities of daily living independence training",
        },
        {
          code: "97032",
          description: "Electrical Stimulation",
          duration: 15,
          category: "Modality",
          notes: "Neuromuscular electrical stimulation muscle activation",
        },
        {
          code: "97035",
          description: "Ultrasound",
          duration: 15,
          category: "Modality",
          notes: "Therapeutic ultrasound tissue healing promotion",
        },
      ];
    }
  };

  const addTreatment = (cptCode: CPTCode) => {
    const newTreatment: SelectedTreatment = {
      id: `${cptCode.code}-${Date.now()}`,
      code: cptCode.code,
      description: cptCode.description,
      duration: cptCode.duration,
      notes: cptCode.notes,
    };
    setSelectedTreatments([...selectedTreatments, newTreatment]);
  };

  const addCustomTreatment = () => {
    const newTreatment: SelectedTreatment = {
      id: `custom-${Date.now()}`,
      code: "",
      description: "",
      duration: 15,
      notes: "",
    };
    setSelectedTreatments([...selectedTreatments, newTreatment]);
  };

  const removeTreatment = (id: string) => {
    setSelectedTreatments(selectedTreatments.filter((t) => t.id !== id));
  };

  const updateTreatment = (id: string, field: string, value: any) => {
    setSelectedTreatments(
      selectedTreatments.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const validateTreatmentPlan = () => {
    setIsValidating(true);

    // Get patient's insurance provider
    const insuranceProvider = patientInfo?.insuranceData?.provider || "Aetna";
    const patientCondition = patientInfo?.patientInjury?.toLowerCase() || "";

    // Simulate validation delay
    setTimeout(() => {
      const validation = performValidation(
        selectedTreatments,
        insuranceProvider,
        patientCondition
      );
      setValidationResults(validation);
      setIsValidating(false);
    }, 2000);
  };

  const performValidation = (
    treatments: SelectedTreatment[],
    provider: string,
    condition: string
  ) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Calculate total session time
    const totalTime = treatments.reduce((sum, t) => sum + t.duration, 0);

    // Valid CPT code format check (5 digits)
    const isValidCPTFormat = (code: string) => {
      return /^\d{5}$/.test(code);
    };

    // Provider-specific approved CPT codes
    const approvedCodes = {
      aetna: [
        "97110",
        "97112",
        "97116",
        "97140",
        "97530",
        "97535",
        "97750",
        "97161",
        "97162",
        "97163",
        "97164",
        "97165",
        "97166",
        "97167",
        "97168",
        "97032",
        "97035",
        "97010",
        "97012",
        "97018",
        "97022",
        "97024",
        "97026",
        "97028",
        "97033",
        "97034",
        "97036",
        "97039",
        "97124",
        "97139",
      ],
      cigna: [
        "97110",
        "97112",
        "97116",
        "97140",
        "97530",
        "97535",
        "97750",
        "97161",
        "97162",
        "97163",
        "97164",
        "97165",
        "97166",
        "97167",
        "97168",
        "97032",
        "97035",
        "97010",
        "97012",
        "97018",
        "97022",
        "97024",
        "97033",
        "97034",
        "97036",
        "97039",
        "97124",
        "97139",
        // Note: Cigna excludes 97016, 97026, 97028
      ],
      united: [
        "97110",
        "97112",
        "97116",
        "97140",
        "97530",
        "97535",
        "97750",
        "97161",
        "97162",
        "97163",
        "97164",
        "97165",
        "97166",
        "97167",
        "97168",
        "97032",
        "97035",
        "97010",
        "97012",
        "97016",
        "97018",
        "97022",
        "97024",
        "97026",
        "97028",
        "97033",
        "97034",
        "97036",
        "97039",
        "97124",
        "97139",
      ],
      medical: [
        // Medi-Cal
        "97110",
        "97112",
        "97116",
        "97140",
        "97530",
        "97535",
        "97750",
        "97161",
        "97162",
        "97163",
        "97164",
        "97165",
        "97166",
        "97167",
        "97168",
        "97032",
        "97035",
        "97018",
        "97022",
        "97024",
        "97033",
        "97034",
        "97036",
        // Note: Medi-Cal may bundle 97010, 97014
      ],
    };

    // Get provider key
    let providerKey = "aetna";
    if (provider.toLowerCase().includes("cigna")) providerKey = "cigna";
    else if (provider.toLowerCase().includes("united")) providerKey = "united";
    else if (provider.toLowerCase().includes("medi-cal"))
      providerKey = "medical";

    const providerApprovedCodes =
      approvedCodes[providerKey as keyof typeof approvedCodes];

    // Validate CPT code format and provider coverage
    treatments.forEach((t) => {
      // Check CPT code format
      if (t.code && !isValidCPTFormat(t.code)) {
        errors.push(
          `"${t.code}" is not a valid CPT code format (must be 5 digits)`
        );
      }

      // Check if code is approved by provider
      if (
        t.code &&
        isValidCPTFormat(t.code) &&
        !providerApprovedCodes.includes(t.code)
      ) {
        errors.push(
          `CPT ${t.code} is not covered by ${provider} for physical therapy services`
        );
      }
    });

    // Provider-specific validation
    if (provider.toLowerCase().includes("aetna")) {
      // Aetna validation rules

      // Check for investigational treatments
      if (condition.includes("shoulder")) {
        treatments.forEach((t) => {
          if (
            t.notes.toLowerCase().includes("kinesio") ||
            t.notes.toLowerCase().includes("taping")
          ) {
            errors.push(
              "Kinesiology taping is considered investigational by Aetna for shoulder conditions"
            );
          }
        });
      }

      // Check 8-minute rule
      treatments.forEach((t) => {
        if (
          t.duration < 8 &&
          ["97110", "97112", "97140", "97530"].includes(t.code)
        ) {
          errors.push(
            `CPT ${t.code} requires minimum 8 minutes for billing (currently ${t.duration} min)`
          );
        }
      });

      // Check total time reasonableness (Aetna expects reasonable session lengths)
      if (totalTime > 90) {
        warnings.push(
          "Session exceeds 90 minutes - may require additional justification"
        );
      }
    } else if (provider.toLowerCase().includes("cigna")) {
      // Cigna validation rules

      // Check 4-unit maximum per day
      const timedUnits = treatments.filter((t) =>
        [
          "97110",
          "97112",
          "97140",
          "97530",
          "97116",
          "97535",
          "97032",
          "97035",
        ].includes(t.code)
      ).length;

      if (timedUnits > 4) {
        errors.push(
          `Cigna limits sessions to 4 timed units maximum (currently ${timedUnits} units)`
        );
      }

      // Check for taping
      treatments.forEach((t) => {
        if (t.notes.toLowerCase().includes("taping")) {
          errors.push("Cigna does not reimburse for therapeutic taping");
        }
      });
    } else if (provider.toLowerCase().includes("united")) {
      // UnitedHealthcare validation rules

      // Check for GP modifier requirement
      warnings.push(
        "Remember to include GP modifier for PT services with UnitedHealthcare"
      );

      // Check total time
      if (totalTime > 75) {
        warnings.push(
          "Sessions over 75 minutes may require additional documentation"
        );
      }
    } else if (provider.toLowerCase().includes("medi-cal")) {
      // Medi-Cal validation rules

      // Check for prior authorization
      if (treatments.length > 0) {
        warnings.push(
          "Medi-Cal requires Treatment Authorization Request (TAR) for all PT services"
        );
      }

      // Check for physician prescription requirement
      warnings.push(
        "Medi-Cal requires written physician prescription updated every 30 days"
      );

      // Check bundled codes
      const bundledCodes = ["97010", "97014"];
      treatments.forEach((t) => {
        if (bundledCodes.includes(t.code)) {
          warnings.push(
            `CPT ${t.code} may be bundled and not separately reimbursed by Medi-Cal`
          );
        }
      });

      // Check medical necessity
      if (!condition.includes("pain") && !condition.includes("disability")) {
        warnings.push(
          "Medi-Cal requires documentation that treatment prevents significant disability"
        );
      }
    }

    // General validation rules

    // Check for duplicate codes in same session
    const codeCounts: { [key: string]: number } = {};
    treatments.forEach((t) => {
      codeCounts[t.code] = (codeCounts[t.code] || 0) + 1;
    });

    Object.entries(codeCounts).forEach(([code, count]) => {
      if (count > 3 && code !== "") {
        warnings.push(
          `CPT ${code} appears ${count} times - verify medical necessity for multiple units`
        );
      }
    });

    // Check for empty codes
    const emptyCodes = treatments.filter((t) => !t.code || !t.description);
    if (emptyCodes.length > 0) {
      errors.push(
        `${emptyCodes.length} treatment(s) missing CPT code or description`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalTime,
      provider,
    };
  };

  const handleNext = () => {
    // Save selected treatments and navigate to treatment plan
    const treatmentData = {
      ...patientInfo,
      selectedTreatments,
    };
    sessionStorage.setItem(
      `patient-${patientId}`,
      JSON.stringify(treatmentData)
    );
    router.push(`/treatment/${patientId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading CPT selection...</div>
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
              onClick={() => router.push(`/intake/${patientId}`)}
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
              Back to Patient Information
            </button>
            <div className="text-sm text-gray-500">Select Treatment Codes</div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CPT Code Selection
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
                <p className="text-gray-600">{patientInfo?.patientInjury}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Treatment Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Treatment Options
            </h3>

            <div className="space-y-2">
              {treatmentOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        {option.code}
                      </span>
                      <span className="text-gray-700">
                        {option.description}
                      </span>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {option.duration} min
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {option.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      {option.notes}
                    </p>
                  </div>
                  <button
                    onClick={() => addTreatment(option)}
                    className="ml-3 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              ))}

              {/* Custom Option */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">
                        Custom
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      Add your own CPT code and details
                    </p>
                  </div>
                  <button
                    onClick={addCustomTreatment}
                    className="ml-3 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Treatments */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected Treatments
              </h3>
              <div className="text-sm text-gray-600">
                {selectedTreatments.length} treatment
                {selectedTreatments.length !== 1 ? "s" : ""} selected
              </div>
            </div>

            {selectedTreatments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
                <p>No treatments selected yet</p>
                <p className="text-sm">
                  Add treatments from the options on the left
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedTreatments.map((treatment) => (
                  <div
                    key={treatment.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="space-y-3">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPT Code
                          </label>
                          <input
                            type="text"
                            value={treatment.code}
                            onChange={(e) =>
                              updateTreatment(
                                treatment.id,
                                "code",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                          />
                        </div>
                        <div className="flex-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={treatment.description}
                            onChange={(e) =>
                              updateTreatment(
                                treatment.id,
                                "description",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
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
                            value={treatment.duration}
                            onChange={(e) =>
                              updateTreatment(
                                treatment.id,
                                "duration",
                                parseInt(e.target.value) || 15
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                          />
                        </div>
                        <button
                          onClick={() => removeTreatment(treatment.id)}
                          className="mt-6 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={treatment.notes}
                          onChange={(e) =>
                            updateTreatment(
                              treatment.id,
                              "notes",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                          rows={2}
                          placeholder="Add treatment notes..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Time */}
            {selectedTreatments.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Total Treatment Time:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {selectedTreatments.reduce((sum, t) => sum + t.duration, 0)}{" "}
                    minutes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Results */}
        {validationResults && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              {validationResults.isValid ? (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold">
                    Treatment Plan Approved
                  </h3>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold">
                    Treatment Plan Rejected
                  </h3>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Validation for <strong>{validationResults.provider}</strong> •
                Total Time: {validationResults.totalTime} minutes
              </p>
            </div>

            {validationResults.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-700 mb-2">
                  Errors (Must Fix):
                </h4>
                <ul className="space-y-1">
                  {validationResults.errors.map(
                    (error: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-red-600 flex items-start"
                      >
                        <span className="text-red-500 mr-2">•</span>
                        {error}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {validationResults.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700 mb-2">
                  Warnings (Review Recommended):
                </h4>
                <ul className="space-y-1">
                  {validationResults.warnings.map(
                    (warning: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-yellow-600 flex items-start"
                      >
                        <span className="text-yellow-500 mr-2">•</span>
                        {warning}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => router.push(`/intake/${patientId}`)}
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

          <div className="flex gap-3">
            <button
              onClick={validateTreatmentPlan}
              disabled={selectedTreatments.length === 0 || isValidating}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Validating...
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Validate Plan
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={selectedTreatments.length === 0}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              Continue to Treatment Plan
              <svg
                className="w-5 h-5 ml-2"
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
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
