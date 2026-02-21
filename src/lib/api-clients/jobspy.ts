import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { JobSearchParams, ApiJobResult } from "./types";

const execFileAsync = promisify(execFile);

export async function searchJobSpy(params: JobSearchParams): Promise<ApiJobResult[]> {
  try {
    console.log("🔍 JobSpy: Suche auf LinkedIn, Indeed, Google Jobs...");

    // Parameter als Base64-JSON kodieren
    const paramsJson = JSON.stringify({
      role: params.role,
      location: params.location,
      country: params.country,
      isRemote: params.isRemote,
      jobTypes: params.jobTypes,
    });
    const paramsBase64 = Buffer.from(paramsJson).toString("base64");

    // Python-Script aufrufen
    const scriptPath = path.join(process.cwd(), "scripts", "jobspy-search.py");

    const { stdout, stderr } = await execFileAsync("python3", [scriptPath, paramsBase64], {
      timeout: 60_000, // 60 Sekunden Timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB Buffer
    });

    if (stderr) {
      try {
        const errorData = JSON.parse(stderr.trim());
        console.warn(`⚠️  JobSpy Warnung: ${errorData.error}`);
      } catch {
        console.warn(`⚠️  JobSpy stderr: ${stderr.trim()}`);
      }
    }

    const results: ApiJobResult[] = JSON.parse(stdout.trim());

    console.log(`✅ JobSpy: ${results.length} Jobs gefunden`);

    // Source-Zusammenfassung
    const sourceCounts: Record<string, number> = {};
    for (const job of results) {
      sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
    }
    if (Object.keys(sourceCounts).length > 0) {
      const summary = Object.entries(sourceCounts)
        .map(([src, count]) => `${src}: ${count}`)
        .join(", ");
      console.log(`   Quellen: ${summary}`);
    }

    return results;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);

    if (errMsg.includes("ENOENT") || errMsg.includes("python3")) {
      console.warn("⚠️  JobSpy: Python3 nicht gefunden. JobSpy-Suche übersprungen.");
    } else if (errMsg.includes("timeout") || errMsg.includes("TIMEOUT")) {
      console.warn("⚠️  JobSpy: Timeout bei der Suche. JobSpy-Suche übersprungen.");
    } else {
      console.warn(`⚠️  JobSpy Fehler: ${errMsg}`);
    }

    // Graceful Fallback: leeres Array zurückgeben
    return [];
  }
}
