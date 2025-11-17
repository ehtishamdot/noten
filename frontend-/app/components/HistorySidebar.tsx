"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CaseHistory {
  id: string;
  name: string;
  timestamp: number;
  caseData: any;
}

interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  history: CaseHistory[];
  onSelect: (caseData: any) => void;
}

export default function HistorySidebar({
  isOpen,
  onToggle,
  history,
  onSelect,
}: HistorySidebarProps) {
  const router = useRouter();

  const handleSelectCase = (caseData: any) => {
    onSelect(caseData);
    router.push("/note-ninjas/suggestions");
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-4 z-40 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
        title={isOpen ? "Close history" : "Open history"}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-xl z-30 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-80`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Case History
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {history.length} {history.length === 1 ? "case" : "cases"}
            </p>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 pb-32">
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No case history yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectCase(item.caseData)}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-purple-50 transition-colors border border-gray-200 cursor-pointer hover:border-purple-300"
                  >
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleDateString()} at{" "}
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* View All Button - Part of history section */}
            {history.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => router.push("/history")}
                  className="w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                >
                  View All
                </button>
              </div>
            )}
          </div>

          {/* Your Account Button - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <button
              onClick={() => {
                router.push("/account");
              }}
              className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Your Account
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20"
          onClick={onToggle}
        />
      )}
    </>
  );
}
