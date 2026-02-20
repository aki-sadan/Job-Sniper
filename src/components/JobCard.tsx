"use client";

import { Job } from "@/db/schema";
import { useState, useTransition } from "react";
import { investigateJob, generateApplicationForJob } from "@/app/actions";
import { useRouter } from "next/navigation";
import ApplicationModal from "./ApplicationModal";

interface JobCardProps {
  job: Job;
  statusColor: string;
}

const SOURCE_COLORS: Record<string, string> = {
  bundesagentur: "bg-blue-100 text-blue-700 border-blue-200",
  arbeitnow: "bg-emerald-100 text-emerald-700 border-emerald-200",
  adzuna: "bg-orange-100 text-orange-700 border-orange-200",
  remotive: "bg-purple-100 text-purple-700 border-purple-200",
  jobicy: "bg-pink-100 text-pink-700 border-pink-200",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  vollzeit: "Vollzeit",
  teilzeit: "Teilzeit",
  werkstudent: "Werkstudent",
  praktikum: "Praktikum",
};

export default function JobCard({ job, statusColor }: JobCardProps) {
  const [isPending, startTransition] = useTransition();
  const [investigating, setInvestigating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [application, setApplication] = useState<{
    tailoredCV: string;
    coverLetter: string;
    emailDraft: string;
  } | null>(null);
  const router = useRouter();

  const handleInvestigate = async () => {
    setInvestigating(true);

    startTransition(async () => {
      const result = await investigateJob(job.id);

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Investigation failed");
      }

      setInvestigating(false);
    });
  };

  const handleGenerateApplication = async () => {
    setGenerating(true);

    startTransition(async () => {
      const result = await generateApplicationForJob(job.id);

      if (result.success && result.application) {
        setApplication(result.application);
        setShowApplicationModal(true);
      } else {
        alert(result.error || "Application generation failed");
      }

      setGenerating(false);
    });
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
    <>
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-400 transition-colors">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex-1 w-full space-y-4">
            {/* Title & Company */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-black mb-1">
                  {job.title}
                </h3>
                <p className="text-gray-600 font-medium">{job.company}</p>
              </div>

              {/* Red Flag Badge */}
              {hasReport && report.redFlagScore !== undefined && (
                <div
                  className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-semibold ${
                    report.redFlagScore >= 7
                      ? "bg-black text-white"
                      : report.redFlagScore >= 4
                      ? "bg-gray-300 text-gray-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {report.redFlagScore}/10
                </div>
              )}
            </div>

            {/* Info Badges */}
            <div className="flex flex-wrap gap-2">
              {/* Salary */}
              {job.salaryRange && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-lg text-gray-700 text-xs font-medium">
                  {job.salaryRange}
                </span>
              )}

              {/* Location */}
              {job.location && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-lg text-gray-700 text-xs font-medium">
                  {job.location}
                </span>
              )}

              {/* Remote */}
              {job.isRemote && (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-medium">
                  Remote
                </span>
              )}

              {/* Job Type */}
              {job.jobType && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                  {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                </span>
              )}

              {/* Source */}
              {job.source && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${
                    SOURCE_COLORS[job.source] || "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {job.source}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm line-clamp-2">
              {job.description}
            </p>

            {/* Detective Report Section */}
            {hasReport && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-black">
                    Investigation Report
                  </h4>
                  <button
                    onClick={() => setShowReport(!showReport)}
                    className="text-xs text-gray-600 hover:text-black transition-colors font-medium"
                  >
                    {showReport ? "Verbergen" : "Anzeigen"}
                  </button>
                </div>

                <div className="text-sm space-y-2">
                  <div className="text-gray-700">
                    Sentiment: <span className="font-semibold text-black">{report.sentiment}</span>
                  </div>

                  {showReport && (
                    <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
                      {report.redFlags && report.redFlags.length > 0 && (
                        <div>
                          <div className="text-black font-semibold mb-2">
                            Red Flags:
                          </div>
                          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-1 text-sm">
                            {report.redFlags.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.interviewQuestions && report.interviewQuestions.length > 0 && (
                        <div>
                          <div className="text-black font-semibold mb-2">
                            Interview-Fragen:
                          </div>
                          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-1 text-sm">
                            {report.interviewQuestions.map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.culturalInsights && report.culturalInsights.length > 0 && (
                        <div>
                          <div className="text-black font-semibold mb-2">
                            Kultur-Einblicke:
                          </div>
                          <ul className="list-disc list-inside text-gray-600 space-y-1 ml-1 text-sm">
                            {report.culturalInsights.map((insight, idx) => (
                              <li key={idx}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 text-sm flex-wrap pt-2">
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black underline transition-colors"
              >
                Original ansehen
              </a>
              <span className="text-gray-400">
                {new Date(job.createdAt).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </span>

              <button
                onClick={handleInvestigate}
                disabled={isPending || investigating}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {investigating ? "Analysiert..." : hasReport ? "Erneut analysieren" : "Analysieren"}
              </button>

              {hasReport && (
                <button
                  onClick={handleGenerateApplication}
                  disabled={isPending || generating}
                  className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generating ? "Generiert..." : "Bewerbung erstellen"}
                </button>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <span
              className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border ${statusColor}`}
            >
              {job.status}
            </span>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {application && (
        <ApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          application={application}
          company={job.company}
        />
      )}
    </>
  );
}
