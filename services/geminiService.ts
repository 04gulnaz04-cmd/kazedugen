import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion, SlideContent, VideoTheme, Language } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (lang: Language): string => {
  switch (lang) {
    case 'ru': return 'Russian';
    case 'en': return 'English';
    default: return 'Kazakh';
  }
};

/**
 * Generates the main educational explanation text.
 */
export const generateExplanation = async (topic: string, lang: Language): Promise<string> => {
  const model = "gemini-2.5-flash";
  const langName = getLanguageName(lang);
  
  const prompt = `
    You are an expert teacher for 7-11th grade students.
    Write a comprehensive educational explanation about the following topic in ${langName} language.
    Keep it simple, engaging, and clear. Length: 250-300 words.
    Topic: ${topic}.
    Format the text using Markdown with headers.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "Text generation failed.";
};

/**
 * Generates a Quiz in JSON format based on the explanation.
 */
export const generateQuiz = async (explanation: string, lang: Language): Promise<QuizQuestion[]> => {
  const model = "gemini-2.5-flash";
  const langName = getLanguageName(lang);

  const prompt = `
    Based on the following text, create 5 multiple-choice questions in ${langName}.
    Each question must have 4 options (A, B, C, D) and one correct answer key.
    
    Text:
    ${explanation}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            question: { type: Type.STRING },
            options: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
              },
              required: ["A", "B", "C", "D"]
            },
            correctAnswer: { type: Type.STRING, enum: ["A", "B", "C", "D"] }
          },
          required: ["id", "question", "options", "correctAnswer"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse quiz JSON", e);
    return [];
  }
};

/**
 * Generates Slide Content (Text) for Presentation/Video.
 */
export const generateSlideContent = async (explanation: string, lang: Language): Promise<SlideContent[]> => {
  const model = "gemini-2.5-flash";
  const langName = getLanguageName(lang);

  const prompt = `
    Based on this text, prepare content for 5 presentation slides in ${langName}.
    For each slide provide:
    1. A short title (title)
    2. A list of 3-4 short bullet points (bulletPoints)
    3. A specific image prompt in English (imagePrompt) describing a visual for this slide.
    
    Text:
    ${explanation}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            bulletPoints: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            imagePrompt: { type: Type.STRING }
          },
          required: ["title", "bulletPoints", "imagePrompt"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse slides JSON", e);
    return [];
  }
};

/**
 * Helper to clean markdown for TTS
 */
const cleanTextForAudio = (text: string): string => {
  return text
    .replace(/[*_~`]/g, '') 
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Generates Audio (TTS) from text using Gemini TTS.
 */
export const generateAudio = async (text: string, lang: Language): Promise<string | null> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  const speechText = cleanTextForAudio(text);
  if (!speechText) return null;

  // Select voice based on language (loosely mapped, as specific lang voices might vary, 
  // but Gemini TTS generally auto-detects lang from text content)
  // 'Kore' is a balanced voice.
  
  try {
    const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: speechText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, 
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Audio generation failed:", error);
    return null;
  }
};

/**
 * Generates an image for a slide prompt with style based on theme.
 */
export const generateSlideImage = async (imagePrompt: string, theme: VideoTheme = 'modern'): Promise<string | null> => {
  const model = "gemini-2.5-flash-image"; 
  
  let stylePrompt = "";
  switch (theme) {
    case 'modern':
      stylePrompt = "minimalist, clean lines, corporate memphis style, bright, high quality vector art";
      break;
    case 'dark':
      stylePrompt = "futuristic, neon glow, cyber style, dark background, digital art";
      break;
    case 'playful':
      stylePrompt = "cheerful, colorful, flat design illustration, cartoon style, rounded shapes";
      break;
    case 'classic':
      stylePrompt = "realistic, academic, oil painting style, detailed, historical context";
      break;
    default:
      stylePrompt = "educational illustration, vector art style, clean background";
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: `${stylePrompt}. ${imagePrompt}` }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
         return `data:image/png;base64,${part.inlineData.data}`;
       }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return `https://picsum.photos/800/600?random=${Math.random()}`;
  }
};