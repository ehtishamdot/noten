"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CaseHistory {
  id: string;
  name: string;
  timestamp: number;
  caseData: any;
}

export default function HistoryPage() {
  const router = useRouter();
  const [caseHistory, setCaseHistory] = useState<CaseHistory[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const userAuth = sessionStorage.getItem("note-ninjas-user");
    if (userAuth) {
      try {
        const userData = JSON.parse(userAuth);
        setUserName(userData.name);
        setUserEmail(userData.email);

        // Load case history
        const historyKey = `note-ninjas-history-${userData.email}`;
        const storedHistory = localStorage.getItem(historyKey);
        if (storedHistory) {
          setCaseHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        router.push("/note-ninjas");
      }
    } else {
      router.push("/note-ninjas");
    }
    setIsLoading(false);
  }, [router]);

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !userEmail) return;

    const historyKey = `note-ninjas-history-${userEmail}`;
    const updatedHistory = caseHistory.map((item) =>
      item.id === id ? { ...item, name: editName.trim() } : item
    );
    setCaseHistory(updatedHistory);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    setEditingId(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDeleteConfirm = (id: string) => {
    if (!userEmail) return;

    const historyKey = `note-ninjas-history-${userEmail}`;
    const updatedHistory = caseHistory.filter((item) => item.id !== id);
    setCaseHistory(updatedHistory);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    setDeleteConfirmId(null);
  };

  const handleSelectCase = (caseData: any) => {
    sessionStorage.setItem("note-ninjas-case", JSON.stringify(caseData));
    router.push("/note-ninjas/suggestions");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-purple-50 rounded-lg shadow-sm p-4 mb-6 border border-purple-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl">🥷</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Note Ninjas App
              </h1>
            </div>
            <p className="text-gray-700 text-sm mb-1">
              The Brainstorming Partner for PTs and OTs
            </p>
            {userName && (
              <p className="text-gray-600 text-xs">
                Logged in as:{" "}
                <button
                  onClick={() => router.push("/account")}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  {userName}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/note-ninjas")}
            className="text-purple-600 hover:text-purple-700 flex items-center text-sm mb-4"
          >
            <svg
              className="w-4 h-4 mr-1"
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
            Back to App
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Case History
          </h2>
          <p className="text-gray-600">
            {caseHistory.length} {caseHistory.length === 1 ? "case" : "cases"}{" "}
            saved
          </p>
        </div>

        {/* Case History Grid */}
        {caseHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No case history yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Your saved cases will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {caseHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                {editingId === item.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveEdit(item.id);
                        } else if (e.key === "Escape") {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : deleteConfirmId === item.id ? (
                  // Delete Confirmation
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 font-medium">
                      Delete this case?
                    </p>
                    <p className="text-xs text-gray-500">
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteConfirm(item.id)}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div
                      onClick={() => handleSelectCase(item.caseData)}
                      className="cursor-pointer mb-3"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
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
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleStartEdit(item.id, item.name)}
                        className="flex-1 px-3 py-2 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Rename
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="flex-1 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

