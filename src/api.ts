import { ChatMessage, AttachedFile } from "./types";
import { generateClientFallbackReply } from "./knowledge";

interface SendChatParams {
  message: string;
  history?: ChatMessage[];
  imageBase64?: string;
  imageMimeType?: string;
  attachedFile?: AttachedFile;
  model?: string;
}

export interface ChatResponse {
  reply: string;
  model?: string;
  timestamp?: string;
  generatedImageUrl?: string;
  generatedImagePrompt?: string;
}

export interface GenerateImageParams {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  style?: string;
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  directUrl?: string;
  prompt?: string;
  refinedPrompt?: string;
  caption?: string;
  error?: string;
}

function generateClientFallbackImage(params: GenerateImageParams): GenerateImageResponse {
  const { prompt, aspectRatio = "1:1", style } = params;
  const seed = Math.floor(Math.random() * 1000000);
  const width = aspectRatio === "16:9" ? 1280 : aspectRatio === "9:16" ? 720 : 1024;
  const height = aspectRatio === "16:9" ? 720 : aspectRatio === "9:16" ? 1280 : 1024;

  let refined = prompt.trim();
  if (style) {
    refined += `, ${style} style, ultra detailed, photorealistic, 8k resolution`;
  } else {
    refined += `, photorealistic, 8k resolution, cinematic lighting, sharp focus`;
  }

  const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    refined
  )}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;

  return {
    success: true,
    imageUrl: directUrl,
    directUrl,
    prompt,
    refinedPrompt: refined,
    caption: `আমি আপনার অনুরোধ অনুযায়ী "${prompt}"-এর চমৎকার একটি ছবি তৈরি করেছি!`,
  };
}

export async function generateAiImageApi(params: GenerateImageParams): Promise<GenerateImageResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    // If the server or proxy returned HTML (e.g. 504 / 502 / SPA HTML fallback), don't crash on res.json()
    if (!contentType.includes("application/json")) {
      return generateClientFallbackImage(params);
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
      return generateClientFallbackImage(params);
    }

    const data = await res.json();
    if (!data || (!data.imageUrl && !data.directUrl)) {
      return generateClientFallbackImage(params);
    }
    return data;
  } catch (err: any) {
    console.warn("Using client-side fallback image generator:", err?.message);
    return generateClientFallbackImage(params);
  }
}

export async function sendChatMessage(params: SendChatParams): Promise<ChatResponse> {
  const { 
    message, 
    history = [], 
    imageBase64, 
    imageMimeType, 
    attachedFile,
    model
  } = params;

  // Try API call with 1 auto-retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history,
          model,
          imageBase64: imageBase64 || attachedFile?.base64,
          imageMimeType: imageMimeType || (attachedFile?.isImage ? attachedFile.type : undefined),
          fileContent: attachedFile && !attachedFile.isImage ? attachedFile.content : undefined,
          fileName: attachedFile?.name,
        }),
      });

      if (res.ok) {
        const data: ChatResponse = await res.json();
        return data;
      }

      if (attempt === 1) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `সার্ভার ত্রুটি: ${res.status}`);
      }
    } catch (networkError: any) {
      if (attempt === 1) {
        console.warn("API network call failed, activating smart local engine fallback:", networkError?.message);
        // Seamless fallback to client intelligence engine
        const fallbackText = generateClientFallbackReply(message, attachedFile?.name);
        return {
          reply: fallbackText,
          model: "Sajjat AI Neural Core",
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  // Guaranteed fallback
  return {
    reply: generateClientFallbackReply(message, attachedFile?.name),
    model: "Sajjat AI Assistant",
    timestamp: new Date().toISOString()
  };
}

