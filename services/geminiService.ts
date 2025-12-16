import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize only if key exists to avoid errors on load, check later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeIncidentAI = async (description: string): Promise<string> => {
  if (!ai) {
    return "Error: API Key de Gemini no configurada.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Actúa como un experto consultor senior en Seguridad, Salud y Medio Ambiente (SST).
      Analiza el siguiente reporte de incidente enviado por un trabajador:
      "${description}"
      
      Proporciona una respuesta en formato markdown breve con:
      1. **Nivel de Riesgo**: (Bajo/Medio/Alto) y por qué.
      2. **Posible Causa Raíz**: Una hipótesis breve.
      3. **Acciones Inmediatas Sugeridas**: Lista de 3 pasos bullet points.
      
      Sé directo y profesional.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hubo un error al conectar con el asistente de IA.";
  }
};