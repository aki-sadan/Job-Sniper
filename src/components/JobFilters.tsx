"use client";

import { useState } from "react";
import CityAutocomplete from "@/components/CityAutocomplete";

interface JobFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  remote: boolean;
  status: string[];
  redFlagMax: number;
  jobTypes: string[];
  location: string;
  source: string[];
  minMatchScore: number;
}

const JOB_TYPE_OPTIONS = [
  { value: "vollzeit", label: "Vollzeit" },
  { value: "teilzeit", label: "Teilzeit" },
  { value: "werkstudent", label: "Werkstudent" },
  { value: "praktikum", label: "Praktikum" },
];

const SOURCE_OPTIONS = [
  { value: "bundesagentur", label: "Bundesagentur" },
  { value: "arbeitnow", label: "Arbeitnow" },
  { value: "adzuna", label: "Adzuna" },
  { value: "remotive", label: "Remotive" },
  { value: "jobicy", label: "Jobicy" },
  { value: "jobspy-linkedin", label: "LinkedIn" },
  { value: "jobspy-indeed", label: "Indeed" },
  { value: "jobspy-google", label: "Google Jobs" },
];

const defaultFilters: FilterState = {
  search: "",
  remote: false,
  status: [],
  redFlagMax: 10,
  jobTypes: [],
  location: "",
  source: [],
  minMatchScore: 0,
};

export default function JobFilters({ onFilterChange }: JobFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters });
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayItem = (key: "status" | "jobTypes" | "source", item: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(item)
      ? current.filter((s) => s !== item)
      : [...current, item];
    updateFilter(key, updated);
  };

  const resetFilters = () => {
    setFilters({ ...defaultFilters });
    onFilterChange({ ...defaultFilters });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-lg mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">Filter</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="text-sm text-primary/60 hover:text-primary transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-primary/60 hover:text-primary transition-colors"
          >
            {isExpanded ? "Einfach" : "Erweitert"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Jobs durchsuchen..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-primary/40 transition-all"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => updateFilter("remote", !filters.remote)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filters.remote
              ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-md"
              : "bg-white border border-border text-primary hover:bg-accent-light/20"
          }`}
        >
          Nur Remote
        </button>

        {[
          { value: "new", label: "Neu" },
          { value: "shortlisted", label: "Vorgemerkt" },
          { value: "applied", label: "Beworben" },
        ].map((status) => (
          <button
            key={status.value}
            onClick={() => toggleArrayItem("status", status.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filters.status.includes(status.value)
                ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-md"
                : "bg-white border border-border text-primary hover:bg-accent-light/20"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Job-Typ Filter */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-primary/60 mb-2">Job-Typ</label>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPE_OPTIONS.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleArrayItem("jobTypes", type.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.jobTypes.includes(type.value)
                  ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-md"
                  : "bg-white border border-border text-primary hover:bg-accent-light/20"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-border">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Stadt/Region
            </label>
            <CityAutocomplete
              value={filters.location}
              onChange={(val) => updateFilter("location", val)}
              placeholder="z.B. Frankfurt, Berlin..."
            />
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Quellen
            </label>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((src) => (
                <button
                  key={src.value}
                  onClick={() => toggleArrayItem("source", src.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filters.source.includes(src.value)
                      ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-md"
                      : "bg-white border border-border text-primary hover:bg-accent-light/20"
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {/* Red Flag Score */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Max Warnzeichen: {filters.redFlagMax}/10
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={filters.redFlagMax}
              onChange={(e) => updateFilter("redFlagMax", parseInt(e.target.value))}
              className="w-full h-2 bg-accent-light/30 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-primary/50 mt-1">
              <span>0 (Beste)</span>
              <span>10 (Schlechteste)</span>
            </div>
          </div>

          {/* Min Match Score */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Min. Match-Score: {filters.minMatchScore}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.minMatchScore}
              onChange={(e) => updateFilter("minMatchScore", parseInt(e.target.value))}
              className="w-full h-2 bg-accent-light/30 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-primary/50 mt-1">
              <span>0% (Alle)</span>
              <span>100% (Nur perfekte Matches)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
