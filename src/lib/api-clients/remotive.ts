import { JobSearchParams, ApiJobResult } from "./types";

interface RemotiveJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  company_logo?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

interface RemotiveResponse {
  "job-count"?: number;
  jobs?: RemotiveJob[];
}

export async function searchRemotive(
  params: JobSearchParams
): Promise<ApiJobResult[]> {
  const results: ApiJobResult[] = [];

  // Nur bei Remote-Suche aufrufen
  if (!params.isRemote) {
    return results;
  }

  try {
    console.log("🔍 Searching Remotive (Remote Jobs)...");

    const searchParams = new URLSearchParams();
    searchParams.set("search", params.role);
    searchParams.set("limit", "25");

    const url = `https://remotive.com/api/remote-jobs?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `❌ Remotive API returned ${response.status}: ${response.statusText}`
      );
      return results;
    }

    const data: RemotiveResponse = await response.json();

    if (data.jobs) {
      for (const job of data.jobs) {
        const title = job.title || "";
        if (!title) continue;

        // HTML-Tags aus der Beschreibung entfernen
        const cleanDescription = (job.description || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500);

        results.push({
          title,
          company: job.company_name || "Unbekannt",
          salaryRange: job.salary || undefined,
          sourceUrl: job.url || "",
          description: cleanDescription || title,
          location: job.candidate_required_location || "Remote",
          country: params.country,
          isRemote: true,
          jobType: params.jobTypes[0] || "vollzeit",
          source: "remotive",
        });
      }
    }

    console.log(`✅ Remotive: ${results.length} Jobs gefunden`);
  } catch (error: unknown) {
    console.error(`❌ Remotive Suche fehlgeschlagen:`, error instanceof Error ? error.message : error);
  }

  return results;
}
