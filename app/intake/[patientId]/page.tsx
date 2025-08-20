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
    // Save form data to sessionStorage for persistence across pages
    sessionStorage.setItem(`patient-${patientId}`, JSON.stringify(formData));
    // Navigate to insurance information page
    router.push(`/insurance/${patientId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading patient data...</div>
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
              Step 1 of 2: Complete Intake Form
            </div>
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
            {renderFormSection(formData)}

            {/* Navigation Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleNext}
                className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center sm:ml-auto"
              >
                Next: Insurance Information
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
  );
}
