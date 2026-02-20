"use client";

import { Job } from "@/db/schema";
import { useState } from "react";
import JobCard from "./JobCard";
import JobSwipeView from "./JobSwipeView";
import JobFilters, { FilterState } from "./JobFilters";

interface JobsListProps {
  jobs: Job[];
}

type ViewMode = "list" | "swipe";

const defaultFilters: FilterState = {
  search: "",
  remote: false,
  status: [],
  redFlagMax: 10,
  jobTypes: [],
  location: "",
  source: [],
};

export default function JobsList({ jobs }: JobsListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(defaultFilters);

  // Apply all filters
  let filteredJobs = jobs;

  // Search
  if (advancedFilters.search) {
    const searchLower = advancedFilters.search.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
    );
  }

  // Remote
  if (advancedFilters.remote) {
    filteredJobs = filteredJobs.filter((job) => job.isRemote);
  }

  // Status
  if (advancedFilters.status.length > 0) {
    filteredJobs = filteredJobs.filter((job) =>
      advancedFilters.status.includes(job.status)
    );
  }

  // Red Flag
  if (advancedFilters.redFlagMax < 10) {
    filteredJobs = filteredJobs.filter((job) => {
      const report = job.detectiveReport as { redFlagScore?: number } | null;
      return !report || !report.redFlagScore || report.redFlagScore <= advancedFilters.redFlagMax;
    });
  }

  // Job-Typ
  if (advancedFilters.jobTypes.length > 0) {
    filteredJobs = filteredJobs.filter(
      (job) => job.jobType && advancedFilters.jobTypes.includes(job.jobType)
    );
  }

  // Location
  if (advancedFilters.location) {
    const locLower = advancedFilters.location.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) => job.location?.toLowerCase().includes(locLower)
    );
  }

  // Source
  if (advancedFilters.source.length > 0) {
    filteredJobs = filteredJobs.filter(
      (job) => job.source && advancedFilters.source.includes(job.source)
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-white border-gray-300 text-black";
      case "shortlisted":
        return "bg-black border-black text-white";
      case "rejected":
        return "bg-gray-200 border-gray-300 text-gray-600";
      case "applied":
        return "bg-gray-800 border-gray-800 text-white";
      default:
        return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 border border-gray-300 mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Keine Jobs
        </h3>
        <p className="text-gray-500">
          Klicke &quot;Search Jobs&quot; um Stellenangebote zu finden
        </p>
      </div>
    );
  }

  // Zähler für die Tabs
  const counts = {
    all: jobs.length,
    new: jobs.filter((j) => j.status === "new").length,
    shortlisted: jobs.filter((j) => j.status === "shortlisted").length,
    applied: jobs.filter((j) => j.status === "applied").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
  };

  const isStatusActive = (statusId: string) => {
    if (statusId === "all") return advancedFilters.status.length === 0;
    return advancedFilters.status.includes(statusId);
  };

  const handleTabClick = (statusId: string) => {
    if (statusId === "all") {
      // Reset status filter
      setAdvancedFilters((prev) => ({ ...prev, status: [] }));
    } else {
      // Toggle einzelner Status
      const current = advancedFilters.status;
      const updated = current.includes(statusId)
        ? current.filter((s) => s !== statusId)
        : [statusId]; // Nur einen Status gleichzeitig über Tabs
      setAdvancedFilters((prev) => ({ ...prev, status: updated }));
    }
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-black">
          Ansicht
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "list"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode("swipe")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "swipe"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Swipe
          </button>
        </div>
      </div>

      {/* Filters */}
      <JobFilters onFilterChange={setAdvancedFilters} />

      {/* Swipe View */}
      {viewMode === "swipe" && <JobSwipeView jobs={filteredJobs} />}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {/* Status Tabs */}
          <div className="flex gap-2 flex-wrap border-b border-gray-800 pb-4">
            {[
              { id: "all", label: "Alle", count: counts.all },
              { id: "new", label: "Neu", count: counts.new },
              { id: "shortlisted", label: "Vorgemerkt", count: counts.shortlisted },
              { id: "applied", label: "Beworben", count: counts.applied },
              { id: "rejected", label: "Abgelehnt", count: counts.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isStatusActive(tab.id)
                    ? "bg-white text-black"
                    : "bg-transparent text-gray-400 hover:text-white hover:bg-gray-900"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-sm opacity-70">
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>

          {/* Jobs Grid */}
          <div className="grid gap-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                statusColor={getStatusColor(job.status)}
              />
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Keine Jobs entsprechen deinen Filtern
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
