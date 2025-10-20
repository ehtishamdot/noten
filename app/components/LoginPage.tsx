"use client";

import { useState } from "react";

interface LoginPageProps {
  onLogin: (name: string, email: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      setIsLoading(true);
      try {
        await onLogin(name.trim(), email.trim());
      } catch (error) {
        console.error("Login error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isValid = name.trim() && email.trim();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="bg-purple-50 rounded-lg shadow-sm p-6 mb-6 border border-purple-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">🥷</span>
              <h1 className="text-3xl font-bold text-gray-900">
                Note Ninjas App
              </h1>
            </div>
            <p className="text-gray-700 text-sm">
              The Brainstorming Partner for PTs and OTs
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Type your name and email to get started
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Logging in...
                </>
              ) : (
                "Get Started"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

