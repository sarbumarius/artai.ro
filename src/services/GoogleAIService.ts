// src/services/GoogleAIService.ts
// Thin wrapper around @google/genai for image generation

import { GoogleGenerativeAI, SchemaType } from '@google/genai';

export type GoogleGenResult = {
  base64: string;
  mime: string;
};

function getApiKey(): string {
  const key = (import.meta as any)?.env?.VITE_GOOGLE_API_KEY || (window as any)?.VITE_GOOGLE_API_KEY;
  if (!key) {
    throw new Error('Lipsește cheia Google (VITE_GOOGLE_API_KEY). Adaugă în .env.local sau variabilele Vite.');
  }
  return key as string;
}

async function fileToGenerativePart(file: File): Promise<any> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Convert to base64
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return {
    inlineData: {
      data: b64,
      mimeType: file.type || 'image/png',
    },
  };
}

export const GoogleAIService = {
  async generateImage(input: { prompt: string; reference?: File | undefined }): Promise<GoogleGenResult> {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    const parts: any[] = [];
    if (input.reference) {
      parts.push(await fileToGenerativePart(input.reference));
    }
    parts.push({ text: input.prompt || '' });

    const response = await model.generateContent({ contents: [{ role: 'user', parts }] });

    // Try to extract first inline image data from candidates
    const cand = response?.response?.candidates?.[0];
    const cparts: any[] = cand?.content?.parts || [];
    for (const p of cparts) {
      const data = (p as any)?.inlineData?.data;
      const mime = (p as any)?.inlineData?.mimeType || 'image/png';
      if (data) {
        return { base64: data, mime };
      }
    }

    // Fallback: some SDKs nest in response.text with data URL — try to parse
    const text = (response as any)?.response?.text?.() || '';
    const m = typeof text === 'string' ? text.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/) : null;
    if (m) {
      return { base64: m[2], mime: m[1] };
    }

    throw new Error('Răspunsul Google nu a conținut imagine generată.');
  },
};

export default GoogleAIService;
