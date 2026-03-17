import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateProcessDiagram = async (input: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza el siguiente texto y extrae un proceso de negocio estructurado para BPMN 2.0. 
      Devuelve una lista de pasos numerados y los actores involucrados si se mencionan.
      
      Texto: ${input}`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating process:", error);
    throw error;
  }
};
