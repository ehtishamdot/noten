"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const apps = [
    {
      id: "coverage-confirmation",
      title: "Coverage Confirmation",
      description:
        "Validates a patient's insurance coverage and returns full details of coverage",
      icon: "🔍",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      borderColor: "border-blue-200",
      hoverBorderColor: "hover:border-blue-300",
      textColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "plan-generation",
      title: "Plan Generation",
      description:
        "Creates a complete, editable treatment plan according to a patient's described condition",
      icon: "📋",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      borderColor: "border-green-200",
      hoverBorderColor: "hover:border-green-300",
      textColor: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const handleAppSelect = (appId: string) => {
    if (appId === "plan-generation") {
      // Navigate to the existing patient selection for plan generation
      router.push("/patient-selection");
    } else if (appId === "coverage-confirmation") {
      // Navigate to the coverage confirmation app
      router.push("/coverage-confirmation");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">NextGenPT</h1>
          <div className="w-24 h-1 bg-primary-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600">
            Select an app from the list below
          </p>
        </div>

        {/* App Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleAppSelect(app.id)}
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border ${app.borderColor} ${app.hoverBorderColor} transform hover:-translate-y-1`}
            >
              <div className="p-8">
                {/* App Icon */}
                <div
                  className={`w-20 h-20 ${app.bgColor} rounded-full flex items-center justify-center text-3xl mx-auto mb-6`}
                >
                  {app.icon}
                </div>

                {/* App Info */}
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {app.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {app.description}
                  </p>
                </div>

                {/* Action Indicator */}
                <div className="text-center">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${app.bgColor} ${app.textColor}`}
                  >
                    Launch App →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Choose an application to begin your physical therapy workflow
          </p>
        </div>
      </div>
    </main>
  );
}
