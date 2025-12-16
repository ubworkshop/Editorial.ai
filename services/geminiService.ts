import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeneratedContent, InputMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transformContent = async (
  input: string,
  mode: InputMode,
  stylePrompt: string
): Promise<GeneratedContent> => {
  
  const modelName = mode === InputMode.URL ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';

  let userPrompt = "";

  if (mode === InputMode.URL) {
    userPrompt = `
      I have a YouTube video or article link: ${input}. 
      First, use Google Search to find the content, transcript, or summary of this specific video/link. 
      Understand the core message, arguments, and details.
      Then, rewrite the content as an article.
    `;
  } else {
    userPrompt = `
      Here is the raw source text: 
      "${input}"
      
      Rewrite this content into a cohesive article.
    `;
  }

  const fullPrompt = `
    ${userPrompt}

    ${stylePrompt}

    REQUIREMENTS:
    1. The core facts and meaning must remain unchanged.
    2. Elevate the prose to match the target publication's distinct voice perfectly.
    3. Generate a catchy, style-appropriate headline.
    4. Extract 3 distinct key takeaways from the content.
    5. Use Markdown formatting where appropriate:
       - Use **bold** for strong emphasis on key terms (sparingly, only if fits the publication style).
       - Ensure paragraphs are clearly separated with double newlines.
    
    Output strictly in JSON format.
  `;

  // Define the schema for structured output
  const schema = {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING, description: "The article headline in the style of the publication" },
      body: { type: Type.STRING, description: "The full rewritten article text. Use paragraphs (\\n\\n) for formatting. Support Markdown (**bold**) for emphasis." },
      keyTakeaways: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 bullet points summarizing the core concepts",
      },
    },
    required: ["headline", "body", "keyTakeaways"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        tools: mode === InputMode.URL ? [{ googleSearch: {} }] : undefined,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedContent;
    }
    
    throw new Error("No content generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data returned");
    }
    return audioData;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};
