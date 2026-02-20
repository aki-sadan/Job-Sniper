"use server";

import { huntJobsAPI as huntJobs } from "@/lib/hunter-api";
import { investigateCompanySimple as investigateCompany } from "@/lib/detective-simple";
import { generateApplication } from "@/lib/closer";
import { db } from "@/db";
import { jobs } from "@/db/schema";
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
      error: "Role is required",
    };
  }

  if (!isRemote && !location) {
    return {
      success: false,
      error: "Location is required when not searching for remote jobs",
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
      error: error instanceof Error ? error.message : "Unknown error",
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
    // Get job details
    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (job.length === 0) {
      return { success: false, error: "Job not found" };
    }

    const jobData = job[0];

    // Check if already investigated
    if (jobData.detectiveReport) {
      return {
        success: false,
        error: "Job already investigated",
        report: jobData.detectiveReport,
      };
    }

    // Run investigation
    const report = await investigateCompany(jobData.company, jobData.title);

    if (!report) {
      return { success: false, error: "Investigation failed" };
    }

    // Save report to database
    await db
      .update(jobs)
      .set({ detectiveReport: report })
      .where(eq(jobs.id, jobId));

    return { success: true, report };
  } catch (error) {
    console.error("Investigation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function generateApplicationForJob(jobId: string) {
  try {
    // Get job details
    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

    if (job.length === 0) {
      return { success: false, error: "Job not found" };
    }

    const jobData = job[0];

    // Generate application package
    const applicationPackage = await generateApplication(
      jobData.company,
      jobData.title,
      jobData.description,
      jobData.detectiveReport ?? undefined
    );

    return {
      success: true,
      application: applicationPackage,
    };
  } catch (error) {
    console.error("Application generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
