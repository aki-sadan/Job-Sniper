"use client";

import { useState } from "react";

interface MatchScoreData {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

interface MatchBadgeProps {
  matchScore: MatchScoreData;
}

export default function MatchBadge({ matchScore }: MatchBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Ausgezeichnet";
    if (score >= 70) return "Sehr gut";
    if (score >= 60) return "Gut";
    if (score >= 40) return "Mittel";
    if (score >= 20) return "Gering";
    return "Kaum";
  };

  return (
    <div className="inline-block">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all hover:shadow-md ${getScoreColor(matchScore.score)}`}
      >
        <span>{matchScore.score}%</span>
        <span className="hidden sm:inline">Match</span>
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(matchScore.score)}`}>
              {getScoreLabel(matchScore.score)}
            </span>
            <span className="text-gray-500 text-xs">{matchScore.score}/100 Punkte</span>
          </div>

          {matchScore.matchedSkills.length > 0 && (
            <div>
              <div className="text-green-700 font-semibold text-xs mb-1">
                Passende Skills:
              </div>
              <div className="flex flex-wrap gap-1">
                {matchScore.matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matchScore.missingSkills.length > 0 && (
            <div>
              <div className="text-red-700 font-semibold text-xs mb-1">
                Fehlende Skills:
              </div>
              <div className="flex flex-wrap gap-1">
                {matchScore.missingSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matchScore.recommendations.length > 0 && (
            <div>
              <div className="text-gray-700 font-semibold text-xs mb-1">
                Empfehlungen:
              </div>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-0.5">
                {matchScore.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
