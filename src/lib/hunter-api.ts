import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { JobSearchParams, ApiJobResult } from "./api-clients/types";
import { searchBundesagentur } from "./api-clients/bundesagentur";
import { searchArbeitnow } from "./api-clients/arbeitnow";
import { searchAdzuna } from "./api-clients/adzuna";
import { searchRemotive } from "./api-clients/remotive";
import { searchJobicy } from "./api-clients/jobicy";
import { searchJobSpy } from "./api-clients/jobspy";

export interface HuntResult {
  success: boolean;
  jobsFound: number;
  sources?: Record<string, number>;
  error?: string;
}

export async function huntJobsAPI(
  role: string,
  location: string,
  country: string = "Deutschland",
  isRemote: boolean = false,
  jobTypes: string[] = ["vollzeit"]
): Promise<HuntResult> {
  try {
    console.log("🎯 Starting API Hunter Agent...");
    console.log(`Searching for: ${role}`);
    console.log(`Location: ${isRemote ? "Remote" : location}, ${country}`);
    console.log(`Job Types: ${jobTypes.join(", ")}`);

    // jobTypes validieren
    const validTypes = ["vollzeit", "teilzeit", "werkstudent", "praktikum"] as const;
    const validatedJobTypes = jobTypes.filter(
      (t): t is (typeof validTypes)[number] => (validTypes as readonly string[]).includes(t)
    );

    const params: JobSearchParams = {
      role,
      location,
      country,
      isRemote,
      jobTypes: validatedJobTypes.length > 0 ? validatedJobTypes : ["vollzeit"],
    };

    // Alle API-Aufrufe zusammenstellen
    const apiCalls: Promise<ApiJobResult[]>[] = [
      // Immer aufrufen
      searchBundesagentur(params),
      searchArbeitnow(params),
      // Optional: Adzuna (nur wenn API-Keys vorhanden)
      searchAdzuna(params),
      // JobSpy: LinkedIn, Indeed, Google Jobs
      searchJobSpy(params),
    ];

    // Bei Remote-Suche: zusätzlich Remotive + Jobicy
    if (isRemote) {
      apiCalls.push(searchRemotive(params));
      apiCalls.push(searchJobicy(params));
    }

    // Alle APIs parallel aufrufen
    const results = await Promise.allSettled(apiCalls);

    const allJobs: ApiJobResult[] = [];
    const sourceCounts: Record<string, number> = {};

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        for (const job of result.value) {
          allJobs.push(job);
          sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
        }
      } else {
        console.error("❌ API-Aufruf fehlgeschlagen:", result.reason);
      }
    });

    console.log(`✅ Insgesamt gefunden: ${allJobs.length} Jobs`);

    // Deduplizierung: nach URL + Titel+Firma Kombination
    const seen = new Set<string>();
    const uniqueJobs: ApiJobResult[] = [];

    for (const job of allJobs) {
      // Jobs ohne URL überspringen
      if (!job.sourceUrl) continue;

      const urlKey = job.sourceUrl;
      const titleKey = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;

      if (!seen.has(urlKey) && !seen.has(titleKey)) {
        seen.add(urlKey);
        seen.add(titleKey);
        uniqueJobs.push(job);
      }
    }

    console.log(`🎯 Nach Deduplizierung: ${uniqueJobs.length} Jobs`);

    // In DB speichern
    let savedCount = 0;

    for (const job of uniqueJobs) {
      // Prüfen ob Job schon existiert (URL)
      const existing = await db
        .select()
        .from(jobs)
        .where(eq(jobs.sourceUrl, job.sourceUrl))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(jobs).values({
          title: job.title,
          company: job.company,
          salaryRange: job.salaryRange || null,
          sourceUrl: job.sourceUrl,
          description: job.description,
          location: job.location || null,
          country: job.country || null,
          isRemote: job.isRemote || false,
          jobType: (job.jobType as "vollzeit" | "teilzeit" | "werkstudent" | "praktikum") || null,
          source: job.source,
          status: "new",
        });
        savedCount++;
        console.log(`💾 Gespeichert: ${job.title} bei ${job.company} [${job.source}]`);
      } else {
        console.log(`⏭️  Duplikat übersprungen: ${job.title}`);
      }
    }

    // Quellen-Zusammenfassung im Log
    const sourcesSummary = Object.entries(sourceCounts)
      .map(([src, count]) => `${src}: ${count}`)
      .join(", ");
    console.log(`📊 Quellen: ${sourcesSummary}`);
    console.log(`🎉 Suche abgeschlossen! ${savedCount} neue Jobs gespeichert.`);

    return {
      success: true,
      jobsFound: savedCount,
      sources: sourceCounts,
    };
  } catch (error) {
    console.error("❌ API Hunter Fehler:", error);
    return {
      success: false,
      jobsFound: 0,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}
