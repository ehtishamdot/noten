"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userAuth = sessionStorage.getItem("note-ninjas-user");
    if (userAuth) {
      try {
        const userData = JSON.parse(userAuth);
        setUserName(userData.name);
        setUserEmail(userData.email);
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/note-ninjas");
      }
    } else {
      router.push("/note-ninjas");
    }
    setIsLoading(false);
  }, [router]);

  const handleUpdate = () => {
    if (!userName.trim() || !userEmail.trim()) {
      alert("Name and email are required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    // Get the old email before updating
    const userAuth = sessionStorage.getItem("note-ninjas-user");
    let oldEmail = userEmail;
    if (userAuth) {
      try {
        const oldUserData = JSON.parse(userAuth);
        oldEmail = oldUserData.email;
      } catch (error) {
        console.error("Error parsing old user data:", error);
      }
    }

    const newUserData = {
      name: userName.trim(),
      email: userEmail.trim(),
    };

    // Update session storage
    sessionStorage.setItem("note-ninjas-user", JSON.stringify(newUserData));

    // If email changed, migrate case history to new email key
    if (oldEmail !== userEmail.trim()) {
      const oldHistoryKey = `note-ninjas-history-${oldEmail}`;
      const newHistoryKey = `note-ninjas-history-${userEmail.trim()}`;

      const oldHistory = localStorage.getItem(oldHistoryKey);
      if (oldHistory) {
        localStorage.setItem(newHistoryKey, oldHistory);
        localStorage.removeItem(oldHistoryKey);
      }
    }

    // Show success message or redirect
    alert("Account updated successfully!");
  };

  const handleLogout = () => {
    // Clear all session data
    sessionStorage.removeItem("note-ninjas-user");
    sessionStorage.removeItem("note-ninjas-case");
    sessionStorage.removeItem("note-ninjas-form-data");
    sessionStorage.removeItem("note-ninjas-input-mode");

    // Redirect to login
    router.push("/note-ninjas");
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
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-purple-50 rounded-lg shadow-sm p-4 mb-6 border border-purple-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl">🥷</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Note Ninjas App
              </h1>
            </div>
            <p className="text-gray-700 text-sm">
              The Brainstorming Partner for PTs and OTs
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm p-8">
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
            <h2 className="text-2xl font-bold text-gray-900">Your Account</h2>
          </div>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter your name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-white border-2 border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
