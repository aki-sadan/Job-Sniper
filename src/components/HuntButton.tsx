"use client";

import { useState, useTransition } from "react";
import { startHunting } from "@/app/actions";
import { useRouter } from "next/navigation";
import CityAutocomplete from "@/components/CityAutocomplete";

export default function HuntButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>("");
  const [role, setRole] = useState("AI Engineer");
  const [location, setLocation] = useState("Frankfurt");
  const [country, setCountry] = useState("Deutschland");
  const [isRemote, setIsRemote] = useState(false);
  const [jobTypes, setJobTypes] = useState<string[]>(["vollzeit"]);
  const router = useRouter();

  const handleHunt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("🎯 Suche läuft...");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await startHunting(formData);

      if (result.success) {
        const resultData = result as { success: true; jobsFound: number; sources?: Record<string, number> };
        const sources = resultData.sources;
        const jobsFound = resultData.jobsFound;
        let sourceInfo = "";
        if (sources && Object.keys(sources).length > 0) {
          sourceInfo = " (" + Object.entries(sources)
            .map(([src, count]) => `${src}: ${count}`)
            .join(", ") + ")";
        }
        setStatus(
          `Suche abgeschlossen! ${jobsFound} neue Jobs gefunden.${sourceInfo}`
        );
        setTimeout(() => {
          router.refresh();
          setStatus("");
        }, 3000);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    });
  };

  const toggleJobType = (type: string) => {
    if (jobTypes.includes(type)) {
      setJobTypes(jobTypes.filter((t) => t !== type));
    } else {
      setJobTypes([...jobTypes, type]);
    }
  };

  return (
    <form onSubmit={handleHunt} className="space-y-6">
      {/* Role */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-primary">
          Position
        </label>
        <input
          type="text"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-foreground placeholder-primary/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="z.B. AI Engineer"
          disabled={isPending}
        />
      </div>

      {/* Standort-Optionen */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-primary">
          Standort
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-primary/60 mb-1">Land</label>
            <select
              name="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isPending}
            >
              <option value="Deutschland">Deutschland</option>
              <option value="Österreich">Österreich</option>
              <option value="Schweiz">Schweiz</option>
              <option value="Niederlande">Niederlande</option>
              <option value="Belgien">Belgien</option>
              <option value="Frankreich">Frankreich</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-primary/60 mb-1">Stadt/Region</label>
            <CityAutocomplete
              name="location"
              value={location}
              onChange={setLocation}
              country={country}
              disabled={isPending || isRemote}
              placeholder="z.B. Frankfurt, Berlin"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isRemote"
            checked={isRemote}
            onChange={(e) => setIsRemote(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            disabled={isPending}
          />
          <span className="text-sm text-primary">Remote arbeiten</span>
        </label>
      </div>

      {/* Job-Typen */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-primary">
          Job-Typ
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "vollzeit", label: "Vollzeit" },
            { value: "teilzeit", label: "Teilzeit" },
            { value: "werkstudent", label: "Werkstudent" },
            { value: "praktikum", label: "Praktikum" },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleJobType(type.value)}
              disabled={isPending}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                jobTypes.includes(type.value)
                  ? "bg-gradient-to-r from-primary to-primary-light text-white shadow-md"
                  : "bg-white border border-border text-primary hover:bg-accent-light/20"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="jobTypes" value={jobTypes.join(",")} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isPending ? "Suche läuft..." : "🎯 Jobs suchen"}
      </button>

      {status && (
        <div className="p-4 bg-accent-light/20 rounded-lg border border-accent-light">
          <p className="text-primary text-sm">{status}</p>
        </div>
      )}
    </form>
  );
}
