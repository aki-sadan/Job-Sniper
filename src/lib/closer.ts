import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import fs from "fs/promises";
import path from "path";
import { callOllama, getOllamaModel } from "./ollama-client";

interface ApplicationPackage {
  tailoredCV: string;
  coverLetter: string;
  emailDraft: string;
}

// Try AI models with fallback (Ollama first, then Gemini)
async function generateWithFallback(prompt: string, temperature: number = 0.5): Promise<string> {
  // Try Ollama first (FREE!)
  try {
    const model = getOllamaModel();
    console.log(`🤖 Using ${model} (Local)...`);
    return await callOllama(model, prompt);
  } catch {
    console.log("⚠️  Ollama unavailable, falling back to Gemini...");
  }

  // Fallback to Gemini
  try {
    const result = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt,
      temperature,
    });
    return result.text;
  } catch {
    // Try smaller Gemini model
    console.log("⚠️  Trying Gemini Flash 8B...");
    const result = await generateText({
      model: google("gemini-1.5-flash-8b-latest"),
      prompt,
      temperature,
    });
    return result.text;
  }
}

export async function generateApplication(
  company: string,
  jobTitle: string,
  jobDescription: string,
  detectiveReport?: {
    sentiment?: string;
    redFlags?: string[];
    redFlagScore?: number;
    interviewQuestions?: string[];
    culturalInsights?: string[];
  }
): Promise<ApplicationPackage> {
  try {
    console.log(`📝 Closer Agent: Generating application for ${company}...`);

    // Load Master CV
    const masterCVPath = path.join(process.cwd(), "data", "Master_CV.md");
    let masterCV: string;

    try {
      masterCV = await fs.readFile(masterCVPath, "utf-8");
      console.log("✅ Master CV loaded");
    } catch {
      console.error("❌ Master CV not found, using placeholder");
      masterCV = "# Master CV\n\nPlease add your Master_CV.md file to the /data folder.";
    }

    // Prepare detective insights for context
    const detectiveContext = detectiveReport
      ? `
DETECTIVE INSIGHTS:
- Overall Sentiment: ${detectiveReport.sentiment || "Unknown"}
- Red Flag Score: ${detectiveReport.redFlagScore || "N/A"}/10
- Cultural Insights: ${detectiveReport.culturalInsights?.join(", ") || "None"}
- Potential Interview Questions: ${detectiveReport.interviewQuestions?.join(", ") || "None"}
`
      : "No detective report available.";

    // 1. Generate Tailored CV
    console.log("🎯 Generating tailored CV...");
    const cvPrompt = `You are a professional CV writer. Create a tailored CV based on the master CV and job description.

MASTER CV:
${masterCV}

JOB POSTING:
Company: ${company}
Position: ${jobTitle}
Description: ${jobDescription}

${detectiveContext}

TASK:
1. Analyze the job description and identify key requirements
2. Re-order and emphasize relevant skills and experiences from the master CV
3. Add or modify bullet points to match job keywords (but stay truthful)
4. Keep the same structure but optimize for this specific role
5. Remove or minimize irrelevant experiences
6. Ensure the CV is ATS-friendly with relevant keywords

Return ONLY the tailored CV in markdown format, ready to use.`;

    const tailoredCV = await generateWithFallback(cvPrompt, 0.4);

    console.log("✅ Tailored CV generated");

    // 2. Generate Cover Letter
    console.log("✉️ Generating cover letter...");
    const coverLetterPrompt = `You are a professional application writer. Create a compelling cover letter.

MASTER CV (for context):
${masterCV}

JOB POSTING:
Company: ${company}
Position: ${jobTitle}
Description: ${jobDescription}

${detectiveContext}

TASK:
1. Write a personalized cover letter that shows genuine interest
2. Mention specific cultural insights or facts about the company if available from detective report
3. Highlight relevant achievements from the CV that match job requirements
4. Address potential red flags positively if any (e.g., "I read about your focus on work-life balance...")
5. Keep it concise (max 300 words)
6. Use professional but authentic tone
7. Include a strong closing with call to action

Format:
- Use German if company is German, otherwise English
- Standard business letter format
- Ready to send

Return ONLY the cover letter text.`;

    const coverLetter = await generateWithFallback(coverLetterPrompt, 0.5);

    console.log("✅ Cover letter generated");

    // 3. Generate Email Draft
    console.log("📧 Generating email draft...");
    const emailPrompt = `You are crafting a professional application email.

CONTEXT:
Company: ${company}
Position: ${jobTitle}
Job Description: ${jobDescription}

${detectiveContext}

TASK:
Write a short, professional email to accompany the CV and cover letter.

REQUIREMENTS:
1. Subject line (clear and professional)
2. Brief introduction (2-3 sentences)
3. Mention attached documents
4. Express enthusiasm
5. Professional closing
6. Use German if company is German, otherwise English

Format:
Subject: [Your subject line]

[Email body]

Return ONLY the email in the format above.`;

    const emailDraft = await generateWithFallback(emailPrompt, 0.5);

    console.log("✅ Email draft generated");

    console.log("🎉 Application package complete!");

    return {
      tailoredCV,
      coverLetter,
      emailDraft,
    };
  } catch (error) {
    console.error("❌ Closer Agent Error:", error);
    throw error;
  }
}
