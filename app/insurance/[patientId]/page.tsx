"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientData } from "@/app/lib/patientData";

export default function InsuranceInformation() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [state, setState] = useState("California");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId && patientData[patientId as keyof typeof patientData]) {
      // Get patient data from the original data source
      const originalData = patientData[patientId as keyof typeof patientData];

      // Try to get updated data from sessionStorage (from intake form)
      const storedData = sessionStorage.getItem(`patient-${patientId}`);
      const patientFormData = storedData
        ? JSON.parse(storedData)
        : originalData;

      setPatientInfo(patientFormData);
      setInsuranceProvider(originalData.InsuranceProvider || "");
      setLoading(false);
    } else {
      // Redirect to home if patient not found
      router.push("/");
    }
  }, [patientId, router]);

  const handleContinue = () => {
    // Save insurance information
    const insuranceData = {
      insuranceProvider,
      state,
    };
    sessionStorage.setItem(
      `insurance-${patientId}`,
      JSON.stringify(insuranceData)
    );

    // Navigate to recommendation page
    router.push(`/recommendation/${patientId}`);
  };

  const handleBack = () => {
    router.push(`/intake/${patientId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading insurance information...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
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
              Back to Intake Form
            </button>
            <div className="text-sm text-gray-500">
              Step 2 of 2: Insurance Information
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Insurance Information
          </h1>
          <div className="w-20 h-1 bg-primary-500 mb-4"></div>

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
                {patientInfo?.Gender}, {patientInfo?.Age} years old •{" "}
                {patientInfo?.Occupation}
              </p>
            </div>
          </div>
        </div>

        {/* Insurance Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-6">
              {/* Insurance Provider Dropdown */}
              <div>
                <label
                  htmlFor="insurance-provider"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Insurance Provider
                </label>
                <select
                  id="insurance-provider"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  required
                >
                  <option value={insuranceProvider}>{insuranceProvider}</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Provider information from patient records
                </p>
              </div>

              {/* State Dropdown */}
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  State
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  required
                >
                  <option value="California">California</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">Treatment location</p>
              </div>
            </div>

            {/* Information Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Insurance Verification
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      The system will use this information to provide
                      insurance-specific recommendations for billing and
                      authorization requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
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

              <button
                onClick={handleContinue}
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors flex items-center"
              >
                Continue to Recommendation
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
