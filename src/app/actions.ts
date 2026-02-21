"use server";

import { huntJobsAPI as huntJobs } from "@/lib/hunter-api";
import { investigateCompanySimple as investigateCompany } from "@/lib/detective-simple";
import { generateApplication } from "@/lib/closer";
import { matchResumeToJob, extractSkills } from "@/lib/matcher";
import { db } from "@/db";
import { jobs, resume } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function startHunting(formData: FormData) {
  const role = formData.get("role") as string;
  const location = formData.get("location") as string;
  const country = formData.get("country") as string;
  const isRemote = formData.get("isRemote") === "on";
  const jobTypesStr = formData.get("jobTypes") as string;
  const jobTypes = jobTypesStr ? jobTypesStr.split(",") : ["vollzeit"];

  if (!role) {
    return {
      success: false,
      error: "Position ist erforderlich",
    };
  }

  if (!isRemote && !location) {
    return {
      success: false,
      error: "Standort ist erforderlich, wenn nicht nach Remote-Jobs gesucht wird",
    };
  }

  const result = await huntJobs(role, location, country, isRemote, jobTypes);
  return result;
}

export async function getAllJobs() {
  const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  return allJobs;
}

export async function resetAllJobs() {
  try {
    await db.delete(jobs);
    return { success: true };
  } catch (error) {
    console.error("Reset error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

export async function updateJobStatus(
  jobId: string,
  status: "new" | "rejected" | "shortlisted" | "applied"
) {
  await db.update(jobs).set({ status }).where(eq(jobs.id, jobId));
  return { success: true };
}

export async function investigateJob(jobId: string) {
  try {
    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (job.length === 0) {
      return { success: false, error: "Job nicht gefunden" };
    }

    const jobData = job[0];

    if (jobData.detectiveReport) {
      return {
        success: false,
        error: "Job wurde bereits analysiert",
        report: jobData.detectiveReport,
      };
    }

    const report = await investigateCompany(jobData.company, jobData.title);

    if (!report) {
      return { success: false, error: "Analyse fehlgeschlagen" };
    }

    await db
      .update(jobs)
      .set({ detectiveReport: report })
      .where(eq(jobs.id, jobId));

    return { success: true, report };
  } catch (error) {
    console.error("Analyse-Fehler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

export async function generateApplicationForJob(jobId: string) {
  try {
    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (job.length === 0) {
      return { success: false, error: "Job nicht gefunden" };
    }

    const jobData = job[0];

    // Prüfen ob ein Benutzer-Lebenslauf vorhanden ist
    const userResume = await db.select().from(resume).limit(1);
    const userResumeContent = userResume.length > 0 ? userResume[0].content : undefined;

    // Bewerbungspaket generieren
    const applicationPackage = await generateApplication(
      jobData.company,
      jobData.title,
      jobData.description,
      jobData.detectiveReport ?? undefined,
      userResumeContent
    );

    return {
      success: true,
      application: applicationPackage,
    };
  } catch (error) {
    console.error("Bewerbungserstellung-Fehler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

// ============ Resume Actions ============

export async function saveResume(content: string, fileName: string) {
  try {
    // Skills extrahieren
    const skills = await extractSkills(content);

    // Bestehenden Lebenslauf prüfen
    const existing = await db.select().from(resume).limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(resume)
        .set({
          content,
          fileName,
          skills,
          updatedAt: new Date(),
        })
        .where(eq(resume.id, existing[0].id));
    } else {
      // Insert
      await db.insert(resume).values({
        content,
        fileName,
        skills,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Lebenslauf-Speicherfehler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

export async function getResume() {
  try {
    const result = await db.select().from(resume).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch {
    return null;
  }
}

export async function deleteResume() {
  try {
    await db.delete(resume);
    // Alle Match-Scores entfernen
    await db.update(jobs).set({ matchScore: null });
    return { success: true };
  } catch (error) {
    console.error("Lebenslauf-Löschfehler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

// ============ Matching Actions ============

export async function matchJobWithResume(jobId: string) {
  try {
    const userResume = await db.select().from(resume).limit(1);
    if (userResume.length === 0) {
      return { success: false, error: "Kein Lebenslauf vorhanden. Bitte zuerst einen Lebenslauf hochladen." };
    }

    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (job.length === 0) {
      return { success: false, error: "Job nicht gefunden" };
    }

    const jobData = job[0];
    const matchResult = await matchResumeToJob(
      userResume[0].content,
      jobData.title,
      jobData.description,
      jobData.company
    );

    await db
      .update(jobs)
      .set({ matchScore: matchResult })
      .where(eq(jobs.id, jobId));

    return { success: true, matchScore: matchResult };
  } catch (error) {
    console.error("Matching-Fehler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

export async function matchAllJobs() {
  try {
    const userResume = await db.select().from(resume).limit(1);
    if (userResume.length === 0) {
      return { success: false, error: "Kein Lebenslauf vorhanden." };
    }

    const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
    const unmatchedJobs = allJobs.filter((j) => !j.matchScore);

    let matchedCount = 0;
    for (const job of unmatchedJobs) {
      try {
        const matchResult = await matchResumeToJob(
          userResume[0].content,
          job.title,
          job.description,
          job.company
        );

        await db
          .update(jobs)
          .set({ matchScore: matchResult })
          .where(eq(jobs.id, job.id));

        matchedCount++;
      } catch (error) {
        console.error(`Matching-Fehler für ${job.title}:`, error);
      }
    }

    return {
      success: true,
      matchedCount,
      totalJobs: unmatchedJobs.length,
    };
  } catch (error) {
    console.error("Batch-Matching-Fehler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}
