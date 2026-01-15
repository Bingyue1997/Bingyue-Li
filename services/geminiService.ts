import { GoogleGenAI } from "@google/genai";

// Corrected: Initializing GoogleGenAI using process.env.API_KEY directly as required
export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Corrected: generateContent usage with text-only prompts following the recommended structure
export const generateStarterResponse = async (prompt: string) => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Corrected: accessing response.text as a property, not a method
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};