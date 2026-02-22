import { callOllama, getOllamaModel } from "./ollama-client";

interface DetectiveReport {
  sentiment: string;
  redFlags: string[];
  redFlagScore: number;
  interviewQuestions: string[];
  culturalInsights: string[];
}

// Simplified Detective - uses Ollama for AI analysis
export async function investigateCompanySimple(
  company: string,
  jobTitle: string
): Promise<DetectiveReport | null> {
  try {
    console.log(`🕵️ Detective Agent: Investigating ${company}...`);

    const analysisPrompt = `Du bist ein Karriereberater, der ein Unternehmen für einen Jobsuchenden analysiert. Antworte auf Deutsch.

Unternehmen: ${company}
Position: ${jobTitle}

Basierend auf deinem Wissen und typischen Branchenmustern, erstelle eine umfassende Analyse.

WICHTIG: Sei realistisch und ausgewogen. Berücksichtige:
- Unternehmensgröße und Branchenruf
- Typische Herausforderungen in dieser Branche
- Häufige Interviewfragen für diese Position
- Allgemeine kulturelle Aspekte von Unternehmen in diesem Sektor

Liefere:
1. Gesamtstimmung (Positiv/Neutral/Negativ)
2. Mögliche Warnzeichen (sei realistisch - die meisten Unternehmen haben einige Bedenken)
3. Warnzeichen-Score (0-10, wobei 0 perfekt und 10 hochgradig toxisch ist) - sei moderat, die meisten Unternehmen liegen bei 3-6
4. Häufige Interviewfragen für diese Art von Position
5. Kulturelle Einblicke, die relevant sein könnten

Antworte in diesem exakten JSON-Format:
{
  "sentiment": "Positiv/Neutral/Negativ",
  "redFlags": ["warnzeichen1", "warnzeichen2", ...],
  "redFlagScore": 5,
  "interviewQuestions": ["frage1", "frage2", ...],
  "culturalInsights": ["einblick1", "einblick2", ...]
}`;

    let analysisText: string | null = null;
    const model = getOllamaModel();

    try {
      console.log(`🤖 Using ${model} (Local)...`);
      analysisText = await callOllama(model, analysisPrompt);
      console.log(`✅ Success with ${model}`);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log(`⚠️  Ollama error: ${errMsg}`);
    }

    // If Ollama failed, use fallback
    if (!analysisText) {
      console.log("⚠️  Ollama not available, using fallback analysis...");
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
    if (lower.includes("engineer") || lower.includes("developer") || lower.includes("entwickler")) {
      return [
        "Erzählen Sie uns von Ihrem technischen Hintergrund und Ihrer Erfahrung",
        "Beschreiben Sie ein herausforderndes Projekt, an dem Sie gearbeitet haben",
        "Wie gehen Sie an Problemlösungen heran?",
        "Welche Erfahrung haben Sie mit [relevanter Technologie]?",
        "Wie gehen Sie mit engen Deadlines um?",
      ];
    }
    return [
      "Erzählen Sie uns etwas über sich und Ihren Hintergrund",
      "Warum interessieren Sie sich für diese Position?",
      "Beschreiben Sie Ihre Stärken und Schwächen",
      "Nennen Sie ein Beispiel für eine herausfordernde Situation, die Sie gemeistert haben",
      "Wo sehen Sie sich in 5 Jahren?",
    ];
  };

  return {
    sentiment: "Neutral",
    redFlags: [
      "Begrenzte öffentliche Informationen verfügbar",
      "KI-Analyse vorübergehend nicht verfügbar - eigene Recherche durchführen",
      "Unternehmensdetails über Glassdoor, LinkedIn und Kununu prüfen",
    ],
    redFlagScore: 5,
    interviewQuestions: getInterviewQuestions(jobTitle),
    culturalInsights: [
      "Unternehmenskultur durch Mitarbeiterbewertungen recherchieren",
      "Aktuelle Nachrichten und Pressemitteilungen prüfen",
      "Mit aktuellen/ehemaligen Mitarbeitern auf LinkedIn vernetzen",
      "Social-Media-Präsenz des Unternehmens prüfen",
      "Work-Life-Balance über Glassdoor recherchieren",
    ],
  };
}
