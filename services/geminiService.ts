
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function suggestMaterials(programTitle: string, description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Materialvorschläge für: "${programTitle}". JSON: [{name, quantity, category: 'Küche'|'Basteln'|'Technik'|'Sonstiges'}].`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ['name', 'quantity', 'category']
          }
        }
      }
    });
    // Trim response text before parsing to avoid JSON errors
    return JSON.parse(response.text.trim());
  } catch (error) {
    return [];
  }
}

export async function parseCsvData(csvText: string, validDays: string[], validSlots: string[]) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", // Upgrade auf Pro für bessere Struktur-Erkennung
            contents: `Analysiere diesen CSV-Text und extrahiere alle Programmpunkte für ein Zeltlager.
            
            DEINE AUFGABE:
            1. Identifiziere die Spalten für die Tage: ${validDays.join(', ')}.
            2. Oft gibt es pro Tag zwei Spalten (z.B. für "XL" und "Kleine" Gruppen).
            3. Extrahiere Titel, Startzeit und Endzeit.
            4. Ordne jedem Punkt einen 'groupHint' zu ('XL', 'Kleine' oder 'Alle'), falls erkennbar.
            
            REGELN:
            - Wenn eine Zelle leer ist oder nur "-", ignoriere sie.
            - Trennzeichen ist oft Semikolon (;) oder Komma (,).
            - Die erste Spalte enthält meist die Uhrzeit (z.B. "08:00 - 09:00").
            
            RÜCKGABE: Ein JSON Array von Objekten.
            
            CSV-DATEN:
            ${csvText}`,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING, description: "Der Wochentag aus der Liste" },
                            timeSlot: { type: Type.STRING, description: "Kategorie (z.B. Frühstück, Morgenprogramm)" },
                            startTime: { type: Type.STRING, description: "HH:mm" },
                            endTime: { type: Type.STRING, description: "HH:mm" },
                            title: { type: Type.STRING },
                            groupHint: { type: Type.STRING, enum: ['XL', 'Kleine', 'Alle'] }
                        },
                        required: ['day', 'startTime', 'endTime', 'title']
                    }
                }
            }
        });
        
        // Trim response text before parsing to avoid JSON errors
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Gemini Parsing Error:", e);
        throw new Error("Die KI konnte die Struktur deiner CSV-Datei nicht automatisch erkennen. Prüfe bitte, ob Uhrzeiten und Tage klar erkennbar sind.");
    }
}
