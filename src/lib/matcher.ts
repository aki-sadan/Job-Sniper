import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { callOllama, getOllamaModel } from "./ollama-client";

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

async function generateWithFallback(prompt: string): Promise<string> {
  // Ollama zuerst (KOSTENLOS!)
  try {
    const model = getOllamaModel();
    return await callOllama(model, prompt);
  } catch {
    // Fallback zu Gemini
  }

  try {
    const result = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.3,
    });
    return result.text;
  } catch {
    const result = await generateText({
      model: google("gemini-1.5-flash-8b-latest"),
      prompt,
      temperature: 0.3,
    });
    return result.text;
  }
}

export async function matchResumeToJob(
  resumeContent: string,
  jobTitle: string,
  jobDescription: string,
  company: string
): Promise<MatchResult> {
  try {
    console.log(`🎯 Matching: ${jobTitle} bei ${company}...`);

    const prompt = `Du bist ein KI-Karriereberater. Analysiere die Übereinstimmung zwischen einem Lebenslauf und einer Stellenanzeige. Antworte auf Deutsch.

LEBENSLAUF:
${resumeContent}

STELLENANZEIGE:
Unternehmen: ${company}
Position: ${jobTitle}
Beschreibung: ${jobDescription}

AUFGABE:
1. Identifiziere die Kernkompetenzen und Skills aus dem Lebenslauf
2. Identifiziere die Anforderungen aus der Stellenanzeige
3. Berechne einen Match-Score (0-100):
   - 80-100: Ausgezeichnet - Kandidat erfüllt fast alle Anforderungen
   - 60-79: Gut - Kandidat erfüllt die meisten Kernanforderungen
   - 40-59: Mittel - einige Übereinstimmungen, aber Lücken vorhanden
   - 20-39: Gering - wenige Übereinstimmungen
   - 0-19: Kaum Übereinstimmung
4. Liste die übereinstimmenden Skills auf
5. Liste die fehlenden Skills auf
6. Gib 2-3 konkrete Empfehlungen

Antworte in diesem exakten JSON-Format:
{
  "score": 75,
  "matchedSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "recommendations": ["empfehlung1", "empfehlung2", ...]
}`;

    const responseText = await generateWithFallback(prompt);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("KI-Antwort konnte nicht geparst werden");
    }

    const result: MatchResult = JSON.parse(jsonMatch[0]);

    // Score validieren
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));

    console.log(`✅ Match-Score: ${result.score}/100`);
    return result;
  } catch (error) {
    console.error("❌ Matching-Fehler:", error);
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      recommendations: ["Matching konnte nicht durchgeführt werden. Bitte erneut versuchen."],
    };
  }
}

export async function extractSkills(resumeContent: string): Promise<string[]> {
  try {
    const prompt = `Extrahiere alle technischen und fachlichen Skills aus dem folgenden Lebenslauf. Antworte auf Deutsch.

LEBENSLAUF:
${resumeContent}

Antworte NUR mit einem JSON-Array von Skills, z.B.:
["Python", "JavaScript", "Projektmanagement", "Teamführung", ...]`;

    const responseText = await generateWithFallback(prompt);

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("❌ Skill-Extraktion fehlgeschlagen:", error);
    return [];
  }
}
