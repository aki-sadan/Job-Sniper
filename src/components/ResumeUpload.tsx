"use client";

import { useState, useTransition, useRef } from "react";
import { saveResume, deleteResume } from "@/app/actions";
import { useRouter } from "next/navigation";

interface ResumeUploadProps {
  initialResume?: {
    id: string;
    content: string;
    fileName: string | null;
    skills: string[] | null;
  } | null;
}

export default function ResumeUpload({ initialResume }: ResumeUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(initialResume?.content || "");
  const [isEditing, setIsEditing] = useState(!initialResume);
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const hasResume = !!initialResume;

  const handleSave = () => {
    if (!content.trim()) {
      setStatus("Bitte füge deinen Lebenslauf ein.");
      return;
    }

    startTransition(async () => {
      const result = await saveResume(content.trim(), "Lebenslauf.md");
      if (result.success) {
        setStatus("Lebenslauf gespeichert!");
        setIsEditing(false);
        router.refresh();
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus(`Fehler: ${result.error}`);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Lebenslauf wirklich löschen? Match-Scores werden ebenfalls entfernt.")) return;

    startTransition(async () => {
      const result = await deleteResume();
      if (result.success) {
        setContent("");
        setIsEditing(true);
        setStatus("Lebenslauf gelöscht.");
        router.refresh();
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus(`Fehler: ${result.error}`);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      setStatus("Nur .txt und .md Dateien werden unterstützt.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setIsEditing(true);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-border shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary">
          Mein Lebenslauf
        </h2>
        {hasResume && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors"
            >
              Bearbeiten
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              Löschen
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Füge deinen Lebenslauf hier ein (Markdown oder Text)..."
            className="w-full h-48 px-4 py-3 rounded-xl bg-white border border-border text-foreground placeholder-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y text-sm font-mono"
            disabled={isPending}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isPending || !content.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:from-primary-dark hover:to-primary shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? "Speichert..." : "Speichern"}
            </button>

            <span className="text-primary/40 text-sm">oder</span>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="px-4 py-2.5 bg-white border border-border text-primary font-medium rounded-lg hover:bg-accent-light/20 disabled:opacity-50 transition-all"
            >
              Datei hochladen (.txt, .md)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />

            {hasResume && (
              <button
                onClick={() => {
                  setContent(initialResume?.content || "");
                  setIsEditing(false);
                }}
                className="px-4 py-2.5 text-primary/60 hover:text-primary text-sm transition-colors"
              >
                Abbrechen
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vorschau */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 max-h-40 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {initialResume?.content?.slice(0, 500)}
              {(initialResume?.content?.length || 0) > 500 && "..."}
            </pre>
          </div>

          {/* Skills */}
          {initialResume?.skills && initialResume.skills.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-primary/60 mb-2">
                Erkannte Skills
              </label>
              <div className="flex flex-wrap gap-1.5">
                {initialResume.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-accent-light/20 text-primary text-xs rounded-md border border-accent-light/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status && (
        <div className="mt-4 p-3 bg-accent-light/20 rounded-lg border border-accent-light">
          <p className="text-primary text-sm">{status}</p>
        </div>
      )}
    </div>
  );
}
