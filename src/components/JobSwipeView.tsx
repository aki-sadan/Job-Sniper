"use client";

import { Job } from "@/db/schema";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import JobSwipeCard from "./JobSwipeCard";
import { investigateJob, updateJobStatus } from "@/app/actions";

interface JobSwipeViewProps {
  jobs: Job[];
}

export default function JobSwipeView({ jobs }: JobSwipeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [investigating, setInvestigating] = useState(false);
  const router = useRouter();

  const currentJob = jobs[currentIndex];
  const hasMoreJobs = currentIndex < jobs.length - 1;

  const handleSwipe = (jobId: string, direction: "left" | "right") => {
    const newStatus = direction === "right" ? "shortlisted" : "rejected";

    // Status in DB speichern
    startTransition(async () => {
      await updateJobStatus(jobId, newStatus as "shortlisted" | "rejected");
    });

    // Zur nächsten Karte
    setTimeout(() => {
      if (hasMoreJobs) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(currentIndex + 1); // Trigger "All done" screen
      }
    }, 300);
  };

  const handleInvestigate = async (jobId: string) => {
    setInvestigating(true);

    startTransition(async () => {
      const result = await investigateJob(jobId);

      if (result.success) {
        router.refresh();
      }

      setInvestigating(false);
    });
  };

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (currentJob) {
      handleSwipe(currentJob.id, direction);
    }
  };

  if (!currentJob) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-3xl border-2 border-gray-200 shadow-xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-black mb-2">
          Fertig!
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          Du hast alle Jobs durchgesehen. Schau sp&auml;ter nochmal vorbei!
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="mt-6 px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
        >
          Nochmal durchgehen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Fortschritt
          </span>
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {jobs.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / jobs.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Swipe Card Container */}
      <div className="relative h-[600px]">
        {/* Current Card */}
        <JobSwipeCard
          key={currentJob.id}
          job={currentJob}
          onSwipe={handleSwipe}
          onInvestigate={handleInvestigate}
          style={{ zIndex: 10 }}
        />

        {/* Next Card Preview (slightly visible behind) */}
        {hasMoreJobs && (
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              transform: "scale(0.95) translateY(10px)",
              opacity: 0.5,
              zIndex: 5,
            }}
          >
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 h-full" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => handleButtonSwipe("left")}
          disabled={investigating || isPending}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-2xl"
          title="Ablehnen"
        >
          ✕
        </button>

        <button
          onClick={() => handleInvestigate(currentJob.id)}
          disabled={investigating || isPending}
          className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl"
          title="Analysieren"
        >
          {investigating ? "..." : "🔍"}
        </button>

        <button
          onClick={() => handleButtonSwipe("right")}
          disabled={investigating || isPending}
          className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-2xl"
          title="Vormerken"
        >
          ✓
        </button>
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-gray-600">
        <p>
          Nach rechts = Vormerken &bull; Nach links = Ablehnen &bull; 🔍 = Analysieren
        </p>
      </div>
    </div>
  );
}
