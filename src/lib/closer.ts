import fs from "fs/promises";
import path from "path";
import { callOllama, getOllamaModel } from "./ollama-client";

interface ApplicationPackage {
  tailoredCV: string;
  coverLetter: string;
  emailDraft: string;
}

async function generateWithOllama(prompt: string): Promise<string> {
  const model = getOllamaModel();
  console.log(`🤖 Using ${model} (Local)...`);
  return await callOllama(model, prompt);
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
  },
  userResume?: string
): Promise<ApplicationPackage> {
  try {
    console.log(`📝 Closer Agent: Erstelle Bewerbung für ${company}...`);

    let masterCV: string;

    if (userResume) {
      // Benutzer-Lebenslauf verwenden
      masterCV = userResume;
      console.log("✅ Benutzer-Lebenslauf wird verwendet");
    } else {
      // Master CV aus Datei laden
      const masterCVPath = path.join(process.cwd(), "data", "Master_CV.md");
      try {
        masterCV = await fs.readFile(masterCVPath, "utf-8");
        console.log("✅ Master CV geladen");
      } catch {
        console.error("❌ Master CV nicht gefunden, verwende Platzhalter");
        masterCV = "# Master-Lebenslauf\n\nBitte füge deine Master_CV.md Datei in den /data Ordner ein.";
      }
    }

    // Prepare detective insights for context
    const detectiveContext = detectiveReport
      ? `
ANALYSE-ERKENNTNISSE:
- Gesamtstimmung: ${detectiveReport.sentiment || "Unbekannt"}
- Warnzeichen-Score: ${detectiveReport.redFlagScore || "N/A"}/10
- Kultur-Einblicke: ${detectiveReport.culturalInsights?.join(", ") || "Keine"}
- Mögliche Interviewfragen: ${detectiveReport.interviewQuestions?.join(", ") || "Keine"}
`
      : "Kein Analyse-Bericht verfügbar.";

    // 1. Generate Tailored CV
    console.log("🎯 Generating tailored CV...");
    const cvPrompt = `Du bist ein professioneller Lebenslauf-Autor. Erstelle einen maßgeschneiderten Lebenslauf basierend auf dem Master-Lebenslauf und der Stellenbeschreibung. Antworte auf Deutsch.

MASTER-LEBENSLAUF:
${masterCV}

STELLENANZEIGE:
Unternehmen: ${company}
Position: ${jobTitle}
Beschreibung: ${jobDescription}

${detectiveContext}

AUFGABE:
1. Analysiere die Stellenbeschreibung und identifiziere die Kernanforderungen
2. Ordne relevante Fähigkeiten und Erfahrungen aus dem Master-Lebenslauf neu und betone sie
3. Füge Stichpunkte hinzu oder passe sie an, um Job-Keywords zu treffen (aber bleibe wahrheitsgemäß)
4. Behalte die gleiche Struktur bei, aber optimiere für diese spezifische Rolle
5. Entferne oder minimiere irrelevante Erfahrungen
6. Stelle sicher, dass der Lebenslauf ATS-freundlich ist mit relevanten Keywords

Gib NUR den angepassten Lebenslauf im Markdown-Format zurück, fertig zur Verwendung.`;

    const tailoredCV = await generateWithOllama(cvPrompt);

    console.log("✅ Tailored CV generated");

    // 2. Generate Cover Letter
    console.log("✉️ Generating cover letter...");
    const coverLetterPrompt = `Du bist ein professioneller Bewerbungsschreiber. Erstelle ein überzeugendes Anschreiben auf Deutsch.

MASTER-LEBENSLAUF (als Kontext):
${masterCV}

STELLENANZEIGE:
Unternehmen: ${company}
Position: ${jobTitle}
Beschreibung: ${jobDescription}

${detectiveContext}

AUFGABE:
1. Schreibe ein personalisiertes Anschreiben, das echtes Interesse zeigt
2. Erwähne spezifische kulturelle Einblicke oder Fakten über das Unternehmen, falls aus dem Analyse-Bericht verfügbar
3. Hebe relevante Erfolge aus dem Lebenslauf hervor, die zu den Jobanforderungen passen
4. Gehe positiv auf mögliche Warnzeichen ein (z.B. "Ich habe von Ihrem Fokus auf Work-Life-Balance gelesen...")
5. Halte es prägnant (max. 300 Wörter)
6. Verwende einen professionellen aber authentischen Ton
7. Schließe mit einem starken Abschluss und Handlungsaufforderung ab

Format:
- Auf Deutsch schreiben
- Standard-Geschäftsbrief-Format
- Versandfertig

Gib NUR den Anschreiben-Text zurück.`;

    const coverLetter = await generateWithOllama(coverLetterPrompt);

    console.log("✅ Cover letter generated");

    // 3. Generate Email Draft
    console.log("📧 Generating email draft...");
    const emailPrompt = `Du erstellst eine professionelle Bewerbungs-E-Mail auf Deutsch.

KONTEXT:
Unternehmen: ${company}
Position: ${jobTitle}
Stellenbeschreibung: ${jobDescription}

${detectiveContext}

AUFGABE:
Schreibe eine kurze, professionelle E-Mail zur Begleitung von Lebenslauf und Anschreiben.

ANFORDERUNGEN:
1. Betreffzeile (klar und professionell)
2. Kurze Einleitung (2-3 Sätze)
3. Angehängte Dokumente erwähnen
4. Begeisterung ausdrücken
5. Professioneller Abschluss
6. Auf Deutsch schreiben

Format:
Betreff: [Deine Betreffzeile]

[E-Mail-Text]

Gib NUR die E-Mail im obigen Format zurück.`;

    const emailDraft = await generateWithOllama(emailPrompt);

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
