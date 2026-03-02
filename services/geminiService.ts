
import { GoogleGenAI, Type } from "@google/genai";
import { AlchemyConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateAlchemyConfig = async (prompt: string): Promise<AlchemyConfig> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Describe a celestial particle system for the following prompt: "${prompt}". Provide technical parameters.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            color: { type: Type.STRING, description: "A hex color code representing the theme." },
            speed: { type: Type.NUMBER, description: "Speed value from 0.1 to 2.0." },
            density: { type: Type.NUMBER, description: "Particle density modifier from 0.5 to 2.0." },
            description: { type: Type.STRING, description: "A poetic one-sentence description of the visual." }
          },
          required: ["color", "speed", "density", "description"]
        }
      }
    });

    const config = JSON.parse(response.text);
    return config;
  } catch (error) {
    console.error("Gemini Alchemy Error:", error);
    return {
      color: "#ffffff",
      speed: 1.0,
      density: 1.0,
      description: "A default cosmic cloud."
    };
  }
};
