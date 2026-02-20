import { JobSearchParams, ApiJobResult } from "./types";

interface JobicyJob {
  id?: number;
  url?: string;
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobLevel?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
  annualSalaryMin?: string;
  annualSalaryMax?: string;
  salaryCurrency?: string;
}

interface JobicyResponse {
  apiVersion?: string;
  documentationUrl?: string;
  friendlyNotice?: string;
  jobCount?: number;
  xpiresAt?: string;
  jobs?: JobicyJob[];
}

function formatSalary(job: JobicyJob): string | undefined {
  const min = job.annualSalaryMin;
  const max = job.annualSalaryMax;
  const currency = job.salaryCurrency || "USD";

  if (!min && !max) return undefined;
  if (min && max) return `${currency} ${min} - ${max}`;
  if (min) return `ab ${currency} ${min}`;
  if (max) return `bis ${currency} ${max}`;
  return undefined;
}

export async function searchJobicy(
  params: JobSearchParams
): Promise<ApiJobResult[]> {
  const results: ApiJobResult[] = [];

  // Nur bei Remote-Suche aufrufen
  if (!params.isRemote) {
    return results;
  }

  try {
    console.log("🔍 Searching Jobicy (Remote Jobs)...");

    const searchParams = new URLSearchParams();
    searchParams.set("count", "50");
    searchParams.set("tag", params.role);

    // Geo-Filter für europäische Länder
    const geoMapping: Record<string, string> = {
      Deutschland: "europe",
      "Österreich": "europe",
      Schweiz: "europe",
      Niederlande: "europe",
      Belgien: "europe",
      Frankreich: "europe",
    };
    const geo = geoMapping[params.country];
    if (geo) searchParams.set("geo", geo);

    const url = `https://jobicy.com/api/v2/remote-jobs?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `❌ Jobicy API returned ${response.status}: ${response.statusText}`
      );
      return results;
    }

    const data: JobicyResponse = await response.json();

    if (data.jobs) {
      const roleLower = params.role.toLowerCase();

      for (const job of data.jobs) {
        const title = job.jobTitle || "";
        if (!title) continue;

        // Relevanz-Prüfung
        const titleLower = title.toLowerCase();
        const descLower = (job.jobExcerpt || "").toLowerCase();
        const industryMatch = job.jobIndustry?.some((i) =>
          i.toLowerCase().includes(roleLower)
        );

        if (
          !titleLower.includes(roleLower) &&
          !descLower.includes(roleLower) &&
          !industryMatch
        ) {
          continue;
        }

        // HTML-Tags entfernen
        const cleanDescription = (job.jobDescription || job.jobExcerpt || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500);

        results.push({
          title,
          company: job.companyName || "Unbekannt",
          salaryRange: formatSalary(job),
          sourceUrl: job.url || "",
          description: cleanDescription || title,
          location: job.jobGeo || "Remote",
          country: params.country,
          isRemote: true,
          jobType: params.jobTypes[0] || "vollzeit",
          source: "jobicy",
        });
      }
    }

    console.log(`✅ Jobicy: ${results.length} Jobs gefunden`);
  } catch (error: unknown) {
    console.error(`❌ Jobicy Suche fehlgeschlagen:`, error instanceof Error ? error.message : error);
  }

  return results;
}
