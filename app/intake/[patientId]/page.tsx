"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientData } from "@/app/lib/patientData";
import FormField from "@/app/components/FormField";

export default function IntakeForm() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [insuranceData, setInsuranceData] = useState<any>(null);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [memberId, setMemberId] = useState("");
  const [processingMemberId, setProcessingMemberId] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAutoFillDropdown, setShowAutoFillDropdown] = useState(false);

  useEffect(() => {
    if (patientId && patientData[patientId as keyof typeof patientData]) {
      const originalData = patientData[patientId as keyof typeof patientData];

      // Start with basic patient info but empty injury fields
      setFormData({
        Name: originalData.Name,
        Age: "", // Start empty
        PlanStartDate: originalData.PlanStartDate,
        patientInjury: "", // Start empty
        injuryDescription: "", // Start empty
      });

      // Auto-populate insurance info
      const patientInsurance = generateInsuranceInfo(patientId);
      setInsuranceProvider(patientInsurance.provider);
      setMemberId(patientInsurance.memberId);

      setLoading(false);
    } else {
      // Redirect to home if patient not found
      router.push("/");
    }
  }, [patientId, router]);

  const updateFormData = (path: string[], value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const renderFormSection = (data: any, path: string[] = []) => {
    return Object.entries(data).map(([key, value]) => {
      const currentPath = [...path, key];

      // Skip InsuranceProvider field as it will be on the next page
      if (key === "InsuranceProvider") {
        return null;
      }

      if (value === null || value === undefined) {
        return null;
      }

      // Skip rendering complex nested structures as single fields
      if (typeof value === "object" && !Array.isArray(value)) {
        return (
          <div key={currentPath.join(".")} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </h3>
            <div className="pl-4">{renderFormSection(value, currentPath)}</div>
          </div>
        );
      }

      // Determine field type
      let fieldType: "text" | "number" | "textarea" | "array" = "text";
      if (Array.isArray(value)) {
        fieldType = "array";
      } else if (typeof value === "number") {
        fieldType = "number";
      } else if (typeof value === "string" && value.length > 100) {
        fieldType = "textarea";
      }

      return (
        <FormField
          key={currentPath.join(".")}
          label={key}
          value={value}
          onChange={(newValue) => updateFormData(currentPath, newValue)}
          type={fieldType}
        />
      );
    });
  };

  const handleProcessMemberId = () => {
    if (insuranceProvider && memberId) {
      setProcessingMemberId(true);

      // Simulate processing member ID
      setTimeout(() => {
        const planInfo = generatePlanInfo(
          patientId,
          insuranceProvider,
          memberId
        );
        setInsuranceData({
          provider: insuranceProvider,
          memberId: memberId,
          ...planInfo,
        });
        setProcessingMemberId(false);
      }, 1500);
    }
  };

  const generateInsuranceInfo = (patientId: string) => {
    const insuranceMap: { [key: string]: any } = {
      "john-doe": {
        provider: "Aetna",
        memberId: "AET123456789",
      },
      "emily-smith": {
        provider: "Blue Cross Blue Shield",
        memberId: "BCBS987654321",
      },
      "maria-garcia": {
        provider: "Medi-Cal",
        memberId: "MED555123456",
      },
    };
    return insuranceMap[patientId] || insuranceMap["john-doe"];
  };

  const generatePlanInfo = (
    patientId: string,
    provider: string,
    memberId: string
  ) => {
    const planMap: { [key: string]: any } = {
      "john-doe": {
        planName: "AETNA_BETTER_HEALTH",
        status: "ACTIVE",
      },
      "emily-smith": {
        planName: "BCBS_SILVER_PLAN",
        status: "ACTIVE",
      },
      "maria-garcia": {
        planName: "MEDI_CAL_MANAGED",
        status: "ACTIVE",
      },
    };
    return planMap[patientId] || planMap["john-doe"];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleAutoFillPatient = (demoPatientId: string) => {
    const demoPatients = {
      "john-doe": {
        patientInjury: "Right shoulder pain",
        injuryDescription:
          "Gradual onset right shoulder pain over 3 months, worse with overhead activities at work (carpentry). Sharp pinch at top of shoulder when lifting arm overhead, ache at rest. Difficulty with hammering above shoulder height.",
        Age: 45,
      },
      "emily-smith": {
        patientInjury: "Left knee pain and instability",
        injuryDescription:
          "Soccer injury 4 weeks ago: planted left foot and twisted, felt 'pop' with immediate pain. MRI confirmed medial meniscus tear. Intermittent sharp pain with twisting, occasional knee giving way.",
        Age: 17,
      },
      "maria-garcia": {
        patientInjury: "Chronic low back pain",
        injuryDescription:
          "10-year history of low back pain from degenerative disc disease, worsened after lifting heavy box. Constant dull ache with sharp pains into right buttock. Balance feels off, has stumbled recently.",
        Age: 60,
      },
    };

    const demoData = demoPatients[demoPatientId as keyof typeof demoPatients];
    if (demoData) {
      setFormData({
        ...formData,
        ...demoData,
      });
    }
    setShowAutoFillDropdown(false);
  };

  const handleNext = () => {
    setIsProcessing(true);

    // Save simplified form data
    const planData = {
      Name: formData.Name,
      Age: formData.Age,
      patientInjury: formData.patientInjury || "",
      injuryDescription: formData.injuryDescription || "",
      PlanStartDate: formData.PlanStartDate,
      insuranceData: insuranceData,
      uploadedFile: uploadedFile?.name || null,
    };

    sessionStorage.setItem(`patient-${patientId}`, JSON.stringify(planData));

    // Simulate processing time
    setTimeout(() => {
      router.push(`/cpt-selection/${patientId}`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading patient data...</div>
      </div>
    );
  }

  return (
    <>
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Creating Treatment Plan
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Generating comprehensive treatment plan based on assessment...
              </p>
            </div>
          </div>
        </div>
      )}
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
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
                Input Patient Information
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Treatment Plan Generation
            </h1>
            <div className="w-20 h-1 bg-primary-500 mb-4"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg mr-4">
                  {formData.Name?.split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {formData.Name}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">
                  Plan Start Date
                </div>
                <input
                  type="date"
                  value={formData.PlanStartDate || ""}
                  onChange={(e) =>
                    updateFormData(["PlanStartDate"], e.target.value)
                  }
                  className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Auto-fill Demo Cases */}
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

                {/* Demo Cases Dropdown */}
                {showAutoFillDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                        Select a demo case:
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoFillPatient("john-doe")}
                        className="w-full text-left px-3 py-3 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          John Doe - Right Shoulder Pain
                        </div>
                        <div className="text-xs text-gray-500">
                          45yo carpenter, overhead work injury, impingement
                          syndrome
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoFillPatient("emily-smith")}
                        className="w-full text-left px-3 py-3 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          Emily Smith - Left Knee Injury
                        </div>
                        <div className="text-xs text-gray-500">
                          17yo soccer player, meniscal tear, sports injury
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutoFillPatient("maria-garcia")}
                        className="w-full text-left px-3 py-3 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          Maria Garcia - Chronic Low Back Pain
                        </div>
                        <div className="text-xs text-gray-500">
                          60yo retiree, degenerative disc disease, balance
                          issues
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              {/* Basic Patient Info */}
              <div className="space-y-6">
                {/* Patient Name */}
                <FormField
                  label="Name"
                  value={formData.Name || ""}
                  onChange={(newValue) => updateFormData(["Name"], newValue)}
                  type="text"
                />

                {/* Patient Injury */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Injury *
                  </label>
                  <input
                    type="text"
                    value={formData.patientInjury || ""}
                    onChange={(e) =>
                      updateFormData(["patientInjury"], e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Right shoulder pain"
                    required
                  />
                </div>

                {/* Injury Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Injury Description *
                  </label>
                  <textarea
                    value={formData.injuryDescription || ""}
                    onChange={(e) =>
                      updateFormData(["injuryDescription"], e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    placeholder="Provide a short description of the patient's present injury and details like severity, incident date, pre-existing conditions, life impact"
                    required
                  />
                </div>

                {/* Age */}
                <FormField
                  label="Age"
                  value={formData.Age || ""}
                  onChange={(newValue) => updateFormData(["Age"], newValue)}
                  type="number"
                />

                {/* Insurance Details */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-4">
                      Insurance Information
                    </h4>

                    <div className="space-y-4">
                      {/* Provider Input */}
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Insurance Provider *
                        </label>
                        <input
                          type="text"
                          value={insuranceProvider}
                          onChange={(e) => setInsuranceProvider(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Enter insurance provider"
                          required
                        />
                      </div>

                      {/* Member ID Input */}
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Member ID *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                            placeholder="Enter member ID"
                            required
                          />
                          <button
                            type="button"
                            onClick={handleProcessMemberId}
                            disabled={
                              !insuranceProvider ||
                              !memberId ||
                              processingMemberId
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {processingMemberId ? "Processing..." : "Process"}
                          </button>
                        </div>
                      </div>

                      {/* Plan Details (after processing) */}
                      {processingMemberId && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
                          <span className="ml-2 text-sm text-blue-700">
                            Verifying member ID...
                          </span>
                        </div>
                      )}

                      {insuranceData && !processingMemberId && (
                        <div className="bg-white border border-blue-200 rounded-md p-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-blue-800">
                                Plan:
                              </span>
                              <span className="ml-2 text-blue-700">
                                {insuranceData.planName}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">
                                Status:
                              </span>
                              <span className="ml-2 text-green-600 font-medium">
                                {insuranceData.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Injury Overview Document (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, TXT up to 10MB
                      </p>
                    </div>
                  </div>
                  {uploadedFile && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      File uploaded: {uploadedFile.name}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Uploading a detailed diagnosis can improve plan and code
                    specificity.
                  </p>
                </div>
              </div>

              {/* Navigation Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleNext}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center sm:ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Continue to CPT Selection"}
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
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
