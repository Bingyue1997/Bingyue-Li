
import { GoogleGenAI, Type } from "@google/genai";
import type { DayAlbum } from "../types";

export interface ShareConcept {
    caption: string;
    hashtags: string[];
    storyboard: {
        scenes: {
            duration: number;
            subtitle: string;
            transition: string;
        }[];
    };
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Common instruction for the travel narrative style to ensure consistency.
 * Strictly English, sectional headers on isolated lines, and heavy paragraphing.
 */
const TRAVEL_NARRATIVE_INSTRUCTIONS = `
LANGUAGE: Output strictly in English. NO CHINESE OR OTHER LANGUAGES.
STYLE: Professional English social media storytelling. Sophisticated, descriptive, and clean.

FORMATTING LAYOUT RULES (CRITICAL):
1. Start with the intro sentence: "On [Date], [I/we] departed from [Location]..."
2. Follow every section header (e.g., "Morning:", "Lunch:") with an immediate newline, then the content.
3. Use DOUBLE NEWLINES (\n\n) between every single logical block.
4. Do NOT use bullet points (e.g., "- item"). Use descriptive paragraphs as shown below.

EXAMPLE OF EXPECTED STRUCTURE:
On January 15th, I departed from [A], traveled by [B], and arrived at [C].

Morning:
In Barcelona, visited:

Barceloneta Beach: Witnessed the first light... [2-3 sentences]

Lunch:
Had lunch at [Restaurant]: Savored the [Food]... [2-3 sentences]

Afternoon:
Visited:

Casa Milà: Explored the... [2-3 sentences]

Dinner:
Had dinner at [Location]: [Analysis of food and vibes]

Accommodation:
Stayed overnight at [Location].

INSTRUCTIONS FOR ANALYSIS:
- Infer participants (I/we) and transportation from photo contents.
- Use Google Search to get specific names and facts for every GPS point.
- Be verbose and descriptive.
`;

/**
 * Uses gemini-3-flash-preview to generate a detailed, structured travel diary.
 */
export const generateDetailedDiary = async (day: DayAlbum): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const step = Math.max(1, Math.floor(day.photos.length / 12));
    const selectedPhotos = day.photos.filter((_, i) => i % step === 0).slice(0, 12);
    
    const imageParts = await Promise.all(selectedPhotos.map(async (p) => {
        const base64 = await fileToBase64(p.file);
        return {
            inlineData: {
                data: base64,
                mimeType: p.file.type || 'image/jpeg'
            }
        };
    }));

    const prompt = `
    Analyze these photos for the day "${day.title}".
    ${TRAVEL_NARRATIVE_INSTRUCTIONS}
    Identify all landmarks and restaurants via Google Search. Ensure the output is beautifully spaced out.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [...imageParts, { text: prompt }] },
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Summary generation failed.";
    } catch (error) {
        console.error("Diary Error:", error);
        throw error;
    }
};

/**
 * Uses gemini-3-flash-preview to generate a rich, multi-modal social media narrative.
 */
export const generateShareContent = async (day: DayAlbum, platform: string, style: string): Promise<ShareConcept> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const step = Math.max(1, Math.floor(day.photos.length / 10));
    const selectedPhotos = day.photos.filter((_, i) => i % step === 0).slice(0, 10);
    
    const imageParts = await Promise.all(selectedPhotos.map(async (p) => {
        const base64 = await fileToBase64(p.file);
        return {
            inlineData: {
                data: base64,
                mimeType: p.file.type || 'image/jpeg'
            }
        };
    }));

    const prompt = `
    Act as a professional English-speaking travel content creator for "${platform}". 
    Create an evocative story for "${day.title}" in a "${style}" style.
    
    The "caption" field in your JSON response MUST be a long-form, beautifully paragraphed travel log following these rules:
    
    ${TRAVEL_NARRATIVE_INSTRUCTIONS}
    
    Include 5 trending English hashtags and a 3-scene storyboard.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [...imageParts, { text: prompt }] },
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        caption: { 
                            type: Type.STRING, 
                            description: "The long-form, paragraphed travel narrative with clear section breaks." 
                        },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        storyboard: {
                            type: Type.OBJECT,
                            properties: {
                                scenes: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            duration: { type: Type.NUMBER },
                                            subtitle: { type: Type.STRING },
                                            transition: { type: Type.STRING }
                                        },
                                        required: ["duration", "subtitle", "transition"]
                                    }
                                }
                            },
                            required: ["scenes"]
                        }
                    },
                    required: ["caption", "hashtags", "storyboard"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Content Error:", error);
        return {
            caption: `An incredible journey through ${day.title}.`,
            hashtags: ["#travel", "#adventure"],
            storyboard: {
                scenes: [{ duration: 5, subtitle: "Highlights of the day", transition: "Fade" }]
            }
        };
    }
};

/**
 * Uses gemini-3-flash-preview to craft a video prompt for Veo.
 */
export const generateVideoPrompt = async (day: DayAlbum): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Cinematic drone shot prompt in English for: "${day.title}". Max 50 words. No non-English characters.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return response.text || "Cinematic travel highlights.";
    } catch (err) {
        return "Cinematic travel highlights.";
    }
};

/**
 * Generates video using Veo.
 */
export const generateVideoForDay = async (day: DayAlbum, firstPhotoBase64?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const visualPrompt = await generateVideoPrompt(day);
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: visualPrompt,
        image: firstPhotoBase64 ? {
            imageBytes: firstPhotoBase64.split(',')[1],
            mimeType: 'image/jpeg'
        } : undefined,
        config: {
            numberOfVideos: 1,
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video failed.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};
