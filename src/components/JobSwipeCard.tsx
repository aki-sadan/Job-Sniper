"use client";

import { Job } from "@/db/schema";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";

interface JobSwipeCardProps {
  job: Job;
  onSwipe: (jobId: string, direction: "left" | "right") => void;
  onInvestigate: (jobId: string) => void;
  style?: React.CSSProperties;
}

export default function JobSwipeCard({
  job,
  onSwipe,
  onInvestigate,
  style,
}: JobSwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const [exitX, setExitX] = useState(0);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 150;

    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? "right" : "left";
      setExitX(info.offset.x > 0 ? 500 : -500);
      onSwipe(job.id, direction);
    }
  };

  const report = job.detectiveReport as {
    sentiment?: string;
    redFlags?: string[];
    redFlagScore?: number;
    interviewQuestions?: string[];
    culturalInsights?: string[];
  } | null;

  const hasReport = report && report.redFlagScore !== undefined;

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        ...style,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ duration: 0.3 }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 h-full overflow-hidden flex flex-col">
        {/* Header with Company & Status */}
        <div className="bg-gradient-to-r from-black to-gray-800 p-6 text-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
              <p className="text-gray-300 text-lg font-medium">{job.company}</p>
            </div>

            {/* Red Flag Badge */}
            {hasReport && report.redFlagScore !== undefined && (
              <div
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-lg font-bold ${
                  report.redFlagScore >= 7
                    ? "bg-red-500 text-white"
                    : report.redFlagScore >= 4
                    ? "bg-yellow-500 text-black"
                    : "bg-green-500 text-white"
                }`}
              >
                {report.redFlagScore}/10
              </div>
            )}
          </div>

          {/* Salary */}
          {job.salaryRange && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl">
              <span className="text-white text-sm font-semibold">
                💰 {job.salaryRange}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Beschreibung
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Detective Report */}
          {hasReport && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-black mb-4">
                🔍 Analyse-Bericht
              </h3>

              <div className="space-y-4">
                {/* Sentiment */}
                <div>
                  <span className="text-sm font-semibold text-gray-600">
                    Stimmung:{" "}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      report.sentiment === "Positive"
                        ? "text-green-600"
                        : report.sentiment === "Negative"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {report.sentiment}
                  </span>
                </div>

                {/* Red Flags */}
                {report.redFlags && report.redFlags.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-2">
                      ⚠️ Warnzeichen:
                    </div>
                    <ul className="space-y-2">
                      {report.redFlags.slice(0, 3).map((flag, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-700 pl-4 border-l-2 border-red-400"
                        >
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cultural Insights */}
                {report.culturalInsights && report.culturalInsights.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-2">
                      💼 Kultur-Einblicke:
                    </div>
                    <ul className="space-y-2">
                      {report.culturalInsights.slice(0, 2).map((insight, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-700 pl-4 border-l-2 border-blue-400"
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Report CTA */}
          {!hasReport && (
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-300 text-center">
              <p className="text-gray-600 mb-4">
                Noch kein Analyse-Bericht vorhanden. Jetzt analysieren!
              </p>
              <button
                onClick={() => onInvestigate(job.id)}
                className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
              >
                🔍 Jetzt analysieren
              </button>
            </div>
          )}
        </div>

        {/* Footer with Instructions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-center">
            <div className="flex-1">
              <div className="text-3xl mb-1">👈</div>
              <div className="text-xs font-semibold text-red-600">ABLEHNEN</div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 font-medium">
                Wischen oder Buttons nutzen
              </div>
            </div>
            <div className="flex-1">
              <div className="text-3xl mb-1">👉</div>
              <div className="text-xs font-semibold text-green-600">ANNEHMEN</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
