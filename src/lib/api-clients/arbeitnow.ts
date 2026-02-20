import { JobSearchParams, ApiJobResult } from "./types";

interface ArbeitnowJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
}

interface ArbeitnowResponse {
  data?: ArbeitnowJob[];
  links?: {
    next?: string;
  };
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
}

export async function searchArbeitnow(
  params: JobSearchParams
): Promise<ApiJobResult[]> {
  const results: ApiJobResult[] = [];

  try {
    console.log("🔍 Searching Arbeitnow...");

    const url = new URL("https://www.arbeitnow.com/api/job-board-api");

    // Arbeitnow paginiert und filtert serverseitig nur begrenzt.
    // Wir holen Seite 1 und filtern client-seitig.
    url.searchParams.set("page", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `❌ Arbeitnow API returned ${response.status}: ${response.statusText}`
      );
      return results;
    }

    const data: ArbeitnowResponse = await response.json();

    if (data.data) {
      const roleLower = params.role.toLowerCase();
      const locationLower = params.location?.toLowerCase() || "";

      for (const job of data.data) {
        const title = job.title || "";
        const titleLower = title.toLowerCase();
        const descLower = (job.description || "").toLowerCase();
        const jobLocationLower = (job.location || "").toLowerCase();

        // Relevanz-Filter: Titel oder Beschreibung muss den Suchbegriff enthalten
        const matchesRole =
          titleLower.includes(roleLower) || descLower.includes(roleLower);

        // Location-Filter (wenn nicht Remote)
        const matchesLocation =
          params.isRemote ||
          !locationLower ||
          jobLocationLower.includes(locationLower);

        // Remote-Filter
        const matchesRemote = !params.isRemote || job.remote;

        if (!matchesRole || !matchesLocation || !matchesRemote) continue;

        const sourceUrl =
          job.url || `https://www.arbeitnow.com/view/${job.slug || ""}`;

        // HTML-Tags aus der Beschreibung entfernen
        const cleanDescription = (job.description || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500);

        results.push({
          title,
          company: job.company_name || "Unbekannt",
          sourceUrl,
          description: cleanDescription || `${title}`,
          location: job.location || (params.isRemote ? "Remote" : params.location),
          country: params.country,
          isRemote: job.remote || false,
          jobType: params.jobTypes[0] || "vollzeit",
          source: "arbeitnow",
        });
      }
    }

    console.log(`✅ Arbeitnow: ${results.length} Jobs gefunden`);
  } catch (error: unknown) {
    console.error(`❌ Arbeitnow Suche fehlgeschlagen:`, error instanceof Error ? error.message : error);
  }

  return results;
}
