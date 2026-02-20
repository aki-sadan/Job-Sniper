"use client";

import { useState, useTransition } from "react";
import { resetAllJobs } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function ResetButton() {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetAllJobs();
      if (result.success) {
        setShowConfirm(false);
        router.refresh();
      }
    });
  };

  if (showConfirm) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-border shadow-lg">
        <p className="text-sm text-primary mb-3">
          Möchtest du wirklich alle gespeicherten Jobs löschen?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all text-sm font-medium"
          >
            {isPending ? "Löschen..." : "Ja, alles löschen"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-white border border-border text-primary rounded-lg hover:bg-accent-light/20 disabled:opacity-50 transition-all text-sm font-medium"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-white border border-border text-primary rounded-lg hover:bg-accent-light/20 transition-all text-sm font-medium"
    >
      🗑️ Alle Daten löschen
    </button>
  );
}
