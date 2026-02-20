import { JobSearchParams, ApiJobResult } from "./types";

interface BundesagenturJob {
  titel?: string;
  arbeitgeber?: string;
  arbeitsort?: {
    ort?: string;
    region?: string;
    land?: string;
  };
  refnr?: string;
  beruf?: string;
  eintrittsdatum?: string;
  aktpisBereitsSeit?: string;
  modifikationsTimestamp?: string;
  hashId?: string;
  externeUrl?: string;
  stellenbeschreibung?: string;
  arbeitszeit?: string;
  befristung?: string;
  arbeitszeitmodell?: string[];
}

interface BundesagenturResponse {
  stellenangebote?: BundesagenturJob[];
  maxErgebnisse?: number;
  page?: number;
}

function mapArbeitszeitParam(jobTypes: string[]): string | undefined {
  const mapping: Record<string, string> = {
    vollzeit: "vz",
    teilzeit: "tz",
    werkstudent: "tz",
    praktikum: "tz",
  };

  const params = jobTypes
    .map((t) => mapping[t])
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  return params.length > 0 ? params.join(";") : undefined;
}

function mapAngebotsart(jobTypes: string[]): string | undefined {
  if (jobTypes.includes("praktikum")) return "34";
  return "1";
}

export async function searchBundesagentur(
  params: JobSearchParams
): Promise<ApiJobResult[]> {
  const results: ApiJobResult[] = [];

  try {
    console.log("🔍 Searching Bundesagentur für Arbeit...");

    const searchParams = new URLSearchParams();

    // Für Werkstudent: speziellen Suchbegriff verwenden
    if (params.jobTypes.includes("werkstudent")) {
      searchParams.set("was", `Werkstudent ${params.role}`);
    } else {
      searchParams.set("was", params.role);
    }

    if (!params.isRemote && params.location) {
      searchParams.set("wo", params.location);
      searchParams.set("umkreis", "25");
    }

    if (params.isRemote) {
      searchParams.set("arbeitszeit", "ho");
    } else {
      const arbeitszeit = mapArbeitszeitParam(params.jobTypes);
      if (arbeitszeit) searchParams.set("arbeitszeit", arbeitszeit);
    }

    const angebotsart = mapAngebotsart(params.jobTypes);
    if (angebotsart) searchParams.set("angebotsart", angebotsart);

    searchParams.set("size", "25");
    searchParams.set("page", "1");

    const url = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": "jobboerse-jobsuche",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `❌ Bundesagentur API returned ${response.status}: ${response.statusText}`
      );
      return results;
    }

    const data: BundesagenturResponse = await response.json();

    if (data.stellenangebote) {
      for (const job of data.stellenangebote) {
        const title = job.titel || job.beruf || "";
        const company = job.arbeitgeber || "Unbekannt";

        if (!title) continue;

        const refnr = job.refnr || job.hashId || "";
        const sourceUrl = job.externeUrl ||
          `https://www.arbeitsagentur.de/jobsuche/suche?id=${refnr}`;

        results.push({
          title,
          company,
          sourceUrl,
          description:
            job.stellenbeschreibung ||
            `${title} bei ${company}` +
              (job.arbeitsort?.ort ? ` in ${job.arbeitsort.ort}` : "") +
              (job.arbeitszeit ? `. ${job.arbeitszeit}` : ""),
          location: job.arbeitsort?.ort || params.location,
          country: job.arbeitsort?.land || params.country,
          isRemote: params.isRemote,
          jobType: params.jobTypes[0] || "vollzeit",
          source: "bundesagentur",
        });
      }
    }

    console.log(`✅ Bundesagentur: ${results.length} Jobs gefunden`);
  } catch (error: unknown) {
    console.error(`❌ Bundesagentur Suche fehlgeschlagen:`, error instanceof Error ? error.message : error);
  }

  return results;
}
