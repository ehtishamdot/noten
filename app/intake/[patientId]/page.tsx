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
  const [insuranceProvider, setInsuranceProvider] = useState("Aetna");
  const [state, setState] = useState("CA");
  const [memberId, setMemberId] = useState("8AZZ24556");

  useEffect(() => {
    if (patientId && patientData[patientId as keyof typeof patientData]) {
      setFormData(patientData[patientId as keyof typeof patientData]);
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

  const handleNext = () => {
    setIsProcessing(true);

    // Save form data to sessionStorage for persistence across pages
    sessionStorage.setItem(`patient-${patientId}`, JSON.stringify(formData));

    // Save insurance information
    sessionStorage.setItem(
      `insurance-${patientId}`,
      JSON.stringify({ provider: insuranceProvider, state, memberId })
    );

    // Simulate processing time
    setTimeout(() => {
      router.push(`/treatment/${patientId}`);
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
              <div className="text-sm text-gray-500">Complete Intake Form</div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Patient Intake Form
            </h1>
            <div className="w-20 h-1 bg-primary-500 mb-4"></div>

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
                <p className="text-gray-600">
                  {formData.Gender}, {formData.Age} years old •{" "}
                  {formData.Occupation}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Render Patient Details first */}
              {[
                "PatientID",
                "Name",
                "Age",
                "Gender",
                "Occupation",
                "DateOfService",
              ].map((field) => {
                if (formData[field] !== undefined && formData[field] !== null) {
                  let fieldType: "text" | "number" | "textarea" | "array" =
                    "text";
                  const value = formData[field];

                  if (Array.isArray(value)) {
                    fieldType = "array";
                  } else if (typeof value === "number") {
                    fieldType = "number";
                  } else if (typeof value === "string" && value.length > 100) {
                    fieldType = "textarea";
                  }

                  return (
                    <FormField
                      key={field}
                      label={field}
                      value={value}
                      onChange={(newValue) => updateFormData([field], newValue)}
                      type={fieldType}
                    />
                  );
                }
                return null;
              })}

              {/* Insurance Section */}
              <div className="mt-6 mb-6 pt-6 pb-6 border-t border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Insurance
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Provider
                    </label>
                    <select
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Aetna">Aetna</option>
                      <option value="Cigna">Cigna</option>
                      <option value="UnitedHealthcare">UnitedHealthcare</option>
                      <option value="Medi-Cal">Medi-Cal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="TX">Texas</option>
                      <option value="FL">Florida</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance Member ID
                    </label>
                    <input
                      type="text"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter member ID"
                    />
                  </div>
                </div>
              </div>

              {/* Render remaining sections (Subjective, Objective, Assessment) */}
              {Object.entries(formData).map(([key, value]) => {
                // Skip already rendered fields, InsuranceProvider, and Plan
                if (
                  [
                    "PatientID",
                    "Name",
                    "Age",
                    "Gender",
                    "Occupation",
                    "DateOfService",
                    "InsuranceProvider",
                    "Plan",
                  ].includes(key)
                ) {
                  return null;
                }

                if (value === null || value === undefined) {
                  return null;
                }

                // Handle complex nested structures
                if (typeof value === "object" && !Array.isArray(value)) {
                  return (
                    <div key={key} className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </h3>
                      <div className="pl-4">
                        {renderFormSection(value, [key])}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Navigation Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleNext}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center sm:ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? "Processing..."
                    : "Continue to Treatment Plan"}
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
