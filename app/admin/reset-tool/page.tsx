"use client";

import { useState } from "react";
import Logo from "@/app/components/Logo";

export default function ResetToolPage() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");
    setResetUrl("");
    setExpiresAt("");
    setCopied(false);

    try {
      const res = await fetch("/api/admin/generate-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), adminPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          setAdminPassword("");
        }
        throw new Error(data.error || "Failed to generate reset link");
      }

      setResetUrl(data.resetUrl);
      setExpiresAt(data.expiresAt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;

    // Verify password by making a test request
    try {
      const res = await fetch("/api/admin/generate-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@verify.com", adminPassword: adminPassword.trim() }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setError("Invalid admin password");
        return;
      }

      // Password is valid (even if email not found, that's fine)
      setIsAuthenticated(true);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="bg-teal-50 rounded-lg shadow-sm p-6 mb-6 border border-teal-100">
          <div className="text-center">
            <Logo size="md" className="mb-2" />
            <p className="text-gray-700 text-sm">
              Password Reset Link Generator
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {!isAuthenticated ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Admin Login
              </h2>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Enter admin password"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!adminPassword.trim()}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Log In
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Generate Reset Link
              </h2>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Enter user's email"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || isLoading}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    "Generate Reset Link"
                  )}
                </button>
              </form>

              {resetUrl && (
                <div className="mt-6 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Reset Link
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 break-all text-sm text-gray-800 font-mono">
                    {resetUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Expires: {new Date(expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
