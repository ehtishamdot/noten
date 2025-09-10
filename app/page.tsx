"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  name: string;
  initials: string;
  description: string;
}

const patients: Patient[] = [
  {
    id: "john-doe",
    name: "John Doe",
    initials: "JD",
    description: "Male, 45 years old",
  },
  {
    id: "emily-smith",
    name: "Emily Smith",
    initials: "ES",
    description: "Female, 17 years old",
  },
  {
    id: "maria-garcia",
    name: "Maria Garcia",
    initials: "MG",
    description: "Female, 60 years old",
  },
];

export default function Home() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NextGenPT Demo
          </h1>
          <div className="w-24 h-1 bg-primary-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600">
            Choose a Patient to begin intake
          </p>
        </div>

        {/* Patient Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <button
              key={patient.id}
              className="patient-card text-left group"
              onClick={() => {
                router.push(`/intake/${patient.id}`);
              }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg group-hover:bg-primary-200 transition-colors">
                  {patient.initials}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-gray-500">{patient.description}</p>
                </div>
              </div>
              <div className="flex items-center text-primary-600 text-sm font-medium">
                <span>Select Patient</span>
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
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
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Click on a patient card to begin the intake process</p>
        </div>
      </div>
    </main>
  );
}
