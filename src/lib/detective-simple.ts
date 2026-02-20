import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { callOllama, getOllamaModel } from "./ollama-client";

interface DetectiveReport {
  sentiment: string;
  redFlags: string[];
  redFlagScore: number;
  interviewQuestions: string[];
  culturalInsights: string[];
}

// List of models to try in order (fallback strategy)
// Ollama first (FREE!), then Google Gemini as backup
interface ModelConfig {
  provider: "ollama" | "google";
  name: string;
  displayName: string;
}

const AI_MODELS: ModelConfig[] = [
  { provider: "ollama", name: getOllamaModel(), displayName: `${getOllamaModel()} (Local)` },
  { provider: "ollama", name: "llama3:latest", displayName: "Llama 3 (Local)" },
  { provider: "google", name: "gemini-1.5-flash-latest", displayName: "Gemini 1.5 Flash" },
  { provider: "google", name: "gemini-1.5-flash-8b-latest", displayName: "Gemini 1.5 Flash 8B" },
];

// Simplified Detective - uses AI without web scraping
// In production, you could add actual web scraping here
export async function investigateCompanySimple(
  company: string,
  jobTitle: string
): Promise<DetectiveReport | null> {
  try {
    console.log(`🕵️ Detective Agent: Investigating ${company}...`);

    // Use AI to analyze based on general knowledge
    // In production, you would add web scraping results here
    const analysisPrompt = `You are a career consultant analyzing a company for a job seeker.

Company: ${company}
Position: ${jobTitle}

Based on your knowledge and common industry patterns, provide a comprehensive analysis.

IMPORTANT: Be realistic and balanced. Consider:
- Company size and industry reputation
- Common challenges in this industry
- Typical interview questions for this role
- General cultural aspects of companies in this sector

Provide:
1. Overall sentiment (Positive/Neutral/Negative)
2. Potential red flags (be realistic - most companies have some concerns)
3. Red Flag Score (0-10, where 0 is perfect and 10 is highly toxic) - be moderate, most companies are 3-6
4. Common interview questions for this type of role
5. Cultural insights that might be relevant

Respond in this exact JSON format:
{
  "sentiment": "Positive/Neutral/Negative",
  "redFlags": ["flag1", "flag2", ...],
  "redFlagScore": 5,
  "interviewQuestions": ["question1", "question2", ...],
  "culturalInsights": ["insight1", "insight2", ...]
}`;

    // Try models in order until one works
    let analysisText: string | null = null;
    for (const modelConfig of AI_MODELS) {
      try {
        console.log(`🤖 Trying ${modelConfig.displayName}...`);

        if (modelConfig.provider === "ollama") {
          // Use native Ollama API
          analysisText = await callOllama(modelConfig.name, analysisPrompt);
        } else {
          // Use Google Gemini via AI SDK
          const result = await generateText({
            model: google(modelConfig.name),
            prompt: analysisPrompt,
            temperature: 0.5,
          });
          analysisText = result.text;
        }

        console.log(`✅ Success with ${modelConfig.displayName}`);
        break; // Success! Exit loop
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        const errCode = (error as { statusCode?: number })?.statusCode;
        const isQuotaError = errMsg.includes("quota") || errCode === 429;
        const isConnectionError =
          errMsg.includes("ECONNREFUSED") ||
          errMsg.includes("fetch failed") ||
          errMsg.includes("Ollama API error");

        if (isQuotaError) {
          console.log(`⚠️  Quota exceeded for ${modelConfig.displayName}, trying next model...`);
          continue;
        } else if (isConnectionError && modelConfig.provider === "ollama") {
          console.log(`⚠️  Ollama not reachable, trying next model...`);
          continue;
        } else {
          console.log(`⚠️  Error with ${modelConfig.displayName}: ${errMsg}`);
          continue;
        }
      }
    }

    // If all AI models failed, use fallback
    if (!analysisText) {
      console.log("⚠️  All AI models exhausted, using fallback analysis...");
      return getFallbackReport(company, jobTitle);
    }

    console.log("✅ Analysis complete");

    // Parse the AI response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const report: DetectiveReport = JSON.parse(jsonMatch[0]);

    console.log(`🎯 Detective Report:`);
    console.log(`   Sentiment: ${report.sentiment}`);
    console.log(`   Red Flag Score: ${report.redFlagScore}/10`);
    console.log(`   Red Flags: ${report.redFlags.length}`);
    console.log(`   Interview Questions: ${report.interviewQuestions.length}`);

    return report;
  } catch (error) {
    console.error("❌ Detective Agent Error:", error);
    // Return fallback instead of null
    return getFallbackReport(company, jobTitle);
  }
}

// Fallback analysis when AI is unavailable
function getFallbackReport(company: string, jobTitle: string): DetectiveReport {
  console.log("🔄 Generating fallback report...");

  // Common interview questions based on role type
  const getInterviewQuestions = (title: string): string[] => {
    const lower = title.toLowerCase();
    if (lower.includes("engineer") || lower.includes("developer")) {
      return [
        "Walk me through your technical background and experience",
        "Describe a challenging project you've worked on",
        "How do you approach problem-solving?",
        "What's your experience with [relevant technology]?",
        "How do you handle tight deadlines?",
      ];
    }
    return [
      "Tell me about yourself and your background",
      "Why are you interested in this position?",
      "Describe your strengths and weaknesses",
      "Give an example of a challenging situation you've handled",
      "Where do you see yourself in 5 years?",
    ];
  };

  return {
    sentiment: "Neutral",
    redFlags: [
      "Limited public information available",
      "AI analysis temporarily unavailable - conduct your own research",
      "Verify company details through Glassdoor, LinkedIn, and Kununu",
    ],
    redFlagScore: 5,
    interviewQuestions: getInterviewQuestions(jobTitle),
    culturalInsights: [
      "Research company culture through employee reviews",
      "Check recent news and press releases",
      "Connect with current/former employees on LinkedIn",
      "Review company's social media presence",
      "Investigate work-life balance through Glassdoor",
    ],
  };
}
