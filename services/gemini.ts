import { GoogleGenAI, GenerateContentResponse, Modality, Part as GenaiPart } from "@google/genai";

// Type definitions to match what's used in App.tsx
type InlineData = { data: string; mimeType: string; };
type MessagePart = { text?: string; inlineData?: InlineData; };

/**
 * Runs a query against the Gemini API using the provided prompt parts.
 * @param parts The message parts (text and/or image data) to send to the model.
 * @param promptText The original text prompt, used to decide which model to use.
 * @returns A promise that resolves with the API's content generation response.
 */
export const runGemini = async (
  parts: MessagePart[],
  promptText: string
): Promise<GenerateContentResponse> => {
  if (!process.env.API_KEY) {
    throw new Error('API কী সেট করা নেই। অনুগ্রহ করে আপনার পরিবেশের চলক (environment variable) কনফিগার করুন।');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const mappedParts: GenaiPart[] = parts.map(part => {
    if (part.inlineData) {
        return { inlineData: part.inlineData };
    }
    return { text: part.text || '' };
  });

  const isImageGenerationRequest = /আঁকো|ছবি/.test(promptText);
  let model: string;
  const config: any = {};

  if (isImageGenerationRequest) {
    model = 'gemini-2.5-flash-image';
    config.responseModalities = [Modality.IMAGE];
  } else {
    model = 'gemini-2.5-flash';
    config.systemInstruction = 'তুমি গ্রাম জিপিটি, গ্রামের মানুষের একজন বন্ধু ও সহায়ক। তোমার কাজ হলো কৃষি, আবহাওয়া, গ্রামের গল্প, গান এবং দৈনন্দিন জীবনের নানা বিষয়ে সহজ ভাষায় তথ্য ও পরামর্শ দেওয়া। প্রয়োজনে ছবি তৈরি করে বা বিশ্লেষণ করে সাহায্য করা।';
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: { parts: mappedParts },
    config: config,
  });

  return response;
};
