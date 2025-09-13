"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patientData } from "../lib/patientData";

export default function PatientSelection() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const patients = Object.entries(patientData).map(([id, data]) => ({
    id,
    name: data.Name,
    age: data.Age,
    gender: data.Gender,
    occupation: data.Occupation,
  }));

  const handlePatientSelect = (patientId: string) => {
    router.push(`/intake/${patientId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-start mb-4">
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
              Back to Apps
            </button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Plan Generation
          </h1>
          <div className="w-24 h-1 bg-primary-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600">
            Choose a Patient to begin intake
          </p>
        </div>

        {/* Patient Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handlePatientSelect(patient.id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-primary-300"
            >
              <div className="p-6">
                {/* Patient Avatar */}
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-xl mx-auto mb-4">
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>

                {/* Patient Info */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {patient.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      {patient.gender}, {patient.age} years old
                    </p>
                    <p className="font-medium text-primary-600">
                      {patient.occupation}
                    </p>
                  </div>
                </div>

                {/* Action Indicator */}
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Begin Intake
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Select a patient to start the physical therapy workflow
            demonstration
          </p>
        </div>
      </div>
    </main>
  );
}
