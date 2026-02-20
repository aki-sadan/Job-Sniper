import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  company: text("company").notNull(),
  salaryRange: text("salary_range"),
  sourceUrl: text("source_url").notNull().unique(),
  description: text("description").notNull(),
  // Neue Felder für erweiterte Suche
  location: text("location"), // Stadt/Region
  country: text("country"), // Land
  isRemote: integer("is_remote", { mode: "boolean" }).default(false), // Remote-Option
  jobType: text("job_type", {
    enum: ["vollzeit", "teilzeit", "werkstudent", "praktikum"],
  }), // Job-Typ
  source: text("source"), // 'bundesagentur', 'arbeitnow', 'adzuna', 'remotive', 'jobicy'
  detectiveReport: text("detective_report", { mode: "json" }).$type<{
    sentiment?: string;
    redFlags?: string[];
    redFlagScore?: number;
    interviewQuestions?: string[];
    culturalInsights?: string[];
  }>(),
  status: text("status", {
    enum: ["new", "rejected", "shortlisted", "applied"],
  })
    .notNull()
    .default("new"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
