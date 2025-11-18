"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to Planwise app
    router.push("/note-ninjas");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Planwise...</p>
      </div>
    </main>
  );
}
