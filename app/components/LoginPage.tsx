"use client";

import { useState } from "react";
import Logo from "./Logo";

type AuthMode = "login" | "signup" | "otp";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, code: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin, onSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setError("");

    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      setMode("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      await onSignup(email.trim(), code.trim(), password);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const switchToSignup = () => {
    setMode("signup");
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const switchToLogin = () => {
    setMode("login");
    setError("");
    setPassword("");
    setConfirmPassword("");
    setCode("");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="bg-teal-50 rounded-lg shadow-sm p-6 mb-6 border border-teal-100">
          <div className="text-center">
            <Logo size="md" className="mb-2" />
            <p className="text-gray-700 text-sm">
              The PT/OT Brainstorming Partner
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {mode === "login" && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Log in
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || !password || isLoading}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToSignup}
                    className="text-teal-600 font-medium hover:text-teal-700"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </>
          )}

          {mode === "signup" && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Create an account
              </h2>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || !password || !confirmPassword || isLoading}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Sending code...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-teal-600 font-medium hover:text-teal-700"
                  >
                    Log in
                  </button>
                </p>
              </form>
            </>
          )}

          {mode === "otp" && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                Check your email
              </h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                We sent a code to <span className="font-medium">{email}</span>
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors text-center text-2xl tracking-widest"
                    placeholder="000000"
                    required
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={code.length !== 6 || isLoading}
                  className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    "Verify & create account"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("signup"); setCode(""); setError(""); }}
                  className="w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
