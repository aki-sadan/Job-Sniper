import { JobSearchParams, ApiJobResult } from "./types";

interface AdzunaJob {
  id?: string;
  title?: string;
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
    area?: string[];
  };
  description?: string;
  redirect_url?: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  contract_type?: string;
  created?: string;
  category?: {
    label?: string;
    tag?: string;
  };
}

interface AdzunaResponse {
  results?: AdzunaJob[];
  count?: number;
  mean?: number;
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  if (min && max) return `€${Math.round(min).toLocaleString()} - €${Math.round(max).toLocaleString()}`;
  if (min) return `ab €${Math.round(min).toLocaleString()}`;
  if (max) return `bis €${Math.round(max).toLocaleString()}`;
  return undefined;
}

export async function searchAdzuna(
  params: JobSearchParams
): Promise<ApiJobResult[]> {
  const results: ApiJobResult[] = [];

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.log("⏭️  Adzuna übersprungen (keine API-Keys in .env)");
    return results;
  }

  try {
    console.log("🔍 Searching Adzuna...");

    const searchParams = new URLSearchParams();
    searchParams.set("app_id", appId);
    searchParams.set("app_key", appKey);
    searchParams.set("what", params.role);
    searchParams.set("results_per_page", "25");
    searchParams.set("content-type", "application/json");

    if (!params.isRemote && params.location) {
      searchParams.set("where", params.location);
    }

    if (params.jobTypes.includes("vollzeit")) {
      searchParams.set("full_time", "1");
    }
    if (params.jobTypes.includes("teilzeit")) {
      searchParams.set("part_time", "1");
    }

    const url = `https://api.adzuna.com/v1/api/jobs/de/search/1?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `❌ Adzuna API returned ${response.status}: ${response.statusText}`
      );
      return results;
    }

    const data: AdzunaResponse = await response.json();

    if (data.results) {
      for (const job of data.results) {
        const title = job.title || "";
        if (!title) continue;

        results.push({
          title,
          company: job.company?.display_name || "Unbekannt",
          salaryRange: formatSalary(job.salary_min, job.salary_max),
          sourceUrl: job.redirect_url || "",
          description: (job.description || title).slice(0, 500),
          location:
            job.location?.display_name || params.location,
          country: params.country,
          isRemote: params.isRemote,
          jobType: params.jobTypes[0] || "vollzeit",
          source: "adzuna",
        });
      }
    }

    console.log(`✅ Adzuna: ${results.length} Jobs gefunden`);
  } catch (error: unknown) {
    console.error(`❌ Adzuna Suche fehlgeschlagen:`, error instanceof Error ? error.message : error);
  }

  return results;
}
