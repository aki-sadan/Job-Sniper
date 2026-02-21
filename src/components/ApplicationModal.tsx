"use client";

import { useState } from "react";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    tailoredCV: string;
    coverLetter: string;
    emailDraft: string;
  };
  company: string;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  application,
  company,
}: ApplicationModalProps) {
  const [activeTab, setActiveTab] = useState<"cv" | "cover" | "email">("cv");

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} in die Zwischenablage kopiert!`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Bewerbungspaket
              </h2>
              <p className="text-purple-200 text-sm mt-1">
                Erstellt für: <span className="font-semibold">{company}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("cv")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "cv"
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-purple-200 hover:bg-white/20"
              }`}
            >
              📄 Lebenslauf
            </button>
            <button
              onClick={() => setActiveTab("cover")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "cover"
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-purple-200 hover:bg-white/20"
              }`}
            >
              ✉️ Anschreiben
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "email"
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-purple-200 hover:bg-white/20"
              }`}
            >
              📧 E-Mail-Entwurf
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-black/30 rounded-lg p-6 min-h-[400px]">
            {activeTab === "cv" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-purple-300">
                    Angepasster Lebenslauf
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(application.tailoredCV, "Lebenslauf")
                    }
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                  >
                    📋 Kopieren
                  </button>
                </div>
                <pre className="text-purple-100 text-sm whitespace-pre-wrap font-mono">
                  {application.tailoredCV}
                </pre>
              </div>
            )}

            {activeTab === "cover" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-purple-300">
                    Anschreiben
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(application.coverLetter, "Anschreiben")
                    }
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                  >
                    📋 Kopieren
                  </button>
                </div>
                <pre className="text-purple-100 text-sm whitespace-pre-wrap font-mono">
                  {application.coverLetter}
                </pre>
              </div>
            )}

            {activeTab === "email" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-purple-300">
                    E-Mail-Entwurf
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(application.emailDraft, "E-Mail-Entwurf")
                    }
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                  >
                    📋 Kopieren
                  </button>
                </div>
                <pre className="text-purple-100 text-sm whitespace-pre-wrap font-mono">
                  {application.emailDraft}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-500/30">
          <div className="flex justify-between items-center">
            <p className="text-purple-300 text-sm">
              💡 Tipp: Vor dem Versenden nochmal prüfen und anpassen
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
