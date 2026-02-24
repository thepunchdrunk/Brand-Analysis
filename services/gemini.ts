
// Triggering fresh build for API key secret integration
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CommunicationContext, Region, AnalysisResult, BrandSettings, AssetType, FixIntensity } from '../types';

const getClient = () => {
  // Debug log (safe: only keys, no values)
  if (true) {
    const keys = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
    console.log(`[Env Debug] Mode: ${import.meta.env.MODE}, Keys found: ${keys.join(', ') || 'none'}`);
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(`API Key not found in ${import.meta.env.MODE} mode. Please ensure VITE_GEMINI_API_KEY is set in GitHub Secrets for production or .env.local for development.`);
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean Markdown JSON blocks
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

// Helper to retry with exponential backoff for 503 errors
const generateWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Fail fast on Auth (401, 403) or Bad Request (400)
    if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
      throw error;
    }

    // Retry on Overloaded (503) or Rate Limit (429)
    if (retries > 0 && (error?.status === 503 || error?.status === 429 || error?.code === 503 || error?.message?.includes('overloaded') || error?.message?.includes('timed out'))) {
      console.warn(`API Transient Error (${error?.status || error?.message}). Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return generateWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Timeout Wrapper
const withTimeout = <T>(promise: Promise<T>, ms: number = 120000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms))
  ]);
};

// Define the schema for the analysis response
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    safetyStatus: { type: Type.STRING, enum: ['Safe', 'Caution', 'Unsafe'], description: "Strict safety assessment based on issues." },
    brandScore: { type: Type.NUMBER, description: "Overall 0-100 score. 100 = Perfect Alignment. Deduct points for every issue found." },
    summary: { type: Type.STRING, description: "Executive summary of safety and brand alignment." },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["Brand", "Compliance", "Cultural"] },
          subcategory: { type: Type.STRING },
          description: { type: Type.STRING, description: "What is the issue?" },
          rationale: { type: Type.STRING, description: "Why is this an issue? Cite the rule." },
          fix: { type: Type.STRING, description: "How to fix it precisely." },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          blocking: { type: Type.BOOLEAN, description: "True if this prevents publication (Brand/Compliance)." },
          fixType: { type: Type.STRING, enum: ["Deterministic", "Manual"] },
          box_2d: {
            type: Type.ARRAY,
            description: "Bounding box in [ymin, xmin, ymax, xmax] format (0-1000 scale).",
            items: { type: Type.NUMBER }
          },
          timestamp: { type: Type.NUMBER },
          page_number: { type: Type.NUMBER, description: "Page number (1-indexed) where the issue occurs." }
        },
        required: ["id", "category", "subcategory", "description", "rationale", "fix", "severity", "blocking", "fixType"]
      }
    },
    correctedText: { type: Type.STRING }
  },
  required: ["safetyStatus", "brandScore", "summary", "issues"]
};

const translationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    translatedText: { type: Type.STRING },
    notes: { type: Type.STRING },
    stylisticScore: { type: Type.NUMBER, description: "0-100 score of how well brand voice was preserved in translation" },
    complianceIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of any compliance terms violated in the target language" }
  },
  required: ["translatedText", "notes", "stylisticScore"]
};

const contextDetectionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    context: { type: Type.STRING, enum: Object.values(CommunicationContext) },
    assetType: { type: Type.STRING, enum: Object.values(AssetType) },
    confidence: { type: Type.NUMBER }
  },
  required: ["context", "assetType", "confidence"]
};

const settingsExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    brandName: { type: Type.STRING },
    mission: { type: Type.STRING },
    audience: { type: Type.STRING },
    toneVoice: { type: Type.STRING },
    styleGuide: { type: Type.STRING },
    bannedTerms: { type: Type.STRING },
    inclusiveLanguage: { type: Type.BOOLEAN }
  },
  required: ["brandName", "toneVoice", "bannedTerms", "inclusiveLanguage"]
};

export const analyzeContent = async (
  content: string,
  context: CommunicationContext,
  region: Region,
  assetType: AssetType,
  settings: BrandSettings,
  fixIntensity: FixIntensity,
  fileBase64?: string,
  mimeType?: string,
  additionalContext?: string,
  visualSlides?: { data: string; mimeType: string }[],
  onProgress?: (progress: number) => void
): Promise<AnalysisResult> => {
  const ai = getClient();



  // Dynamic Weighting Logic
  let focusArea = "Balanced";
  let complianceWeight = "40%";
  let culturalWeight = "30%";
  let brandWeight = "30%";

  // Strict Precedence & Safety Mode
  if (context === CommunicationContext.NOT_SURE || context === CommunicationContext.LEGAL_COMPLIANCE) {
    focusArea = "COMPLIANCE & RISK (SAFETY MODE)";
    complianceWeight = "70%";
    culturalWeight = "20%";
    brandWeight = "10%";
  } else if (context === CommunicationContext.HR || context === CommunicationContext.INTERNAL_OPS) {
    focusArea = "CLARITY & POLICY";
    complianceWeight = "50%";
    culturalWeight = "30%";
    brandWeight = "20%";
  } else if (context === CommunicationContext.MARKETING || context === CommunicationContext.SALES) {
    focusArea = "IMPACT & BRAND ALIGNMENT";
    brandWeight = "50%";
    culturalWeight = "30%";
    complianceWeight = "20%";
    if (region !== "Global") {
      culturalWeight = "50%";
      brandWeight = "25%";
      complianceWeight = "25%";
      focusArea = "CULTURAL RESONANCE";
    }
  }

  // Safety Mode Overrides
  const isSafetyMode = context === CommunicationContext.NOT_SURE;
  const safetyPrompt = isSafetyMode ?
    `SAFETY MODE ACTIVE: This asset has ambiguous context. Assume maximum external visibility. Apply strictest interpretation of all rules. Treat all claims as requiring verification.` :
    "";

  const systemInstruction = `You are "BrandAlign Core Engine", a Governance AI that analyzes content against Brand Guidelines.

=== CONFIG ===
Focus: ${focusArea} | Weights: Compliance(${complianceWeight}), Cultural(${culturalWeight}), Brand(${brandWeight})
Region: ${region} | Context: ${context} | Fix: ${fixIntensity}
${safetyPrompt}

=== BRAND STANDARDS ===
Mission: "${settings.mission}" | Voice: "${settings.toneVoice}"
Banned Terms: "${settings.bannedTerms}" (Auto FAIL if found)
Inclusive Language: ${settings.inclusiveLanguage ? "REQUIRED" : "Optional"}

=== SCORING ===
brandScore (0-100): Start at 100. Deduct 15-20 for High/blocking, 5-10 for Medium, 1-2 for Low. Average content ~75.

=== ISSUE RULES ===
- Categories: ONLY 'Brand', 'Compliance', 'Cultural'
- Visual content: provide 'box_2d' as [ymin, xmin, ymax, xmax] (0-1000 scale)
- Multi-page docs: provide 'page_number' (1-indexed)
- Video/Audio: provide 'timestamp' in seconds (MANDATORY)
- Provide concise, actionable 'fix' for each issue
- correctedText: Brief rewrite of key problematic phrases only (not entire content)

Return valid JSON matching the schema.`;

  try {
    const parts: any[] = [];

    // When we have visualSlides (PDF pages or PPTX slides), prioritize visual analysis
    if (visualSlides && visualSlides.length > 0) {
      parts.push({
        text: `VISUAL ANALYSIS MODE: Analyzing ${visualSlides.length} slide/page images. For EVERY issue provide 'box_2d' [ymin,xmin,ymax,xmax] (0-1000) and 'page_number' (1-indexed). Analyze these slides:`
      });

      visualSlides.forEach((slide, index) => {
        parts.push({ text: `=== SLIDE ${index + 1} ===` });
        parts.push({
          inlineData: {
            mimeType: slide.mimeType,
            data: slide.data
          }
        });
      });

      if (content) {
        parts.push({ text: `\n\nSUPPLEMENTARY TEXT:\n${content}` });
      }
    } else if (fileBase64 && mimeType && (mimeType.startsWith('video/') || mimeType.startsWith('audio/'))) {
      // === VIDEO/AUDIO ANALYSIS MODE ===
      parts.push({
        text: `VIDEO/AUDIO MODE: Analyzing a ${assetType}. For EVERY issue provide 'timestamp' (seconds, MANDATORY) and 'box_2d' [ymin,xmin,ymax,xmax] (0-1000). Check beginning, middle, end. For audio-only, use box_2d [400,400,600,600]. Analyze:`
      });

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64
        }
      });

      if (content) {
        parts.push({ text: `\n\nTRANSCRIPT:\n${content}` });
      }
    } else {
      // Standard text/file analysis
      parts.push({ text: content ? content : `Analyze this ${assetType} file.` });

      if (fileBase64 && mimeType) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        });
      }
    }

    if (additionalContext) {
      parts.push({ text: `Context: ${additionalContext}` });
    }

    // === PROGRESS ANIMATION ===
    const startTime = Date.now();
    let currentProgress = 10;
    if (onProgress) onProgress(currentProgress);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Asymptotic curve: 10→88% over ~20s (fast model)
      const targetProgress = Math.min(88, 10 + 78 * (1 - Math.exp(-elapsed / 8000)));
      if (onProgress && targetProgress > currentProgress) {
        currentProgress = Math.floor(targetProgress);
        onProgress(currentProgress);
      }
    }, 100);

    // === SINGLE-CALL (non-streaming) — fastest for structured JSON ===
    let response;
    try {
      response = await withTimeout(
        generateWithRetry(() => ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: { parts },
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.2,
          },
        })),
        60000
      );
    } catch (e) {
      clearInterval(progressInterval);
      throw e;
    }

    clearInterval(progressInterval);

    const fullText = response.text || "";
    if (!fullText) throw new Error("No response text generated");

    if (onProgress) onProgress(95);

    const rawJson = JSON.parse(cleanJson(fullText));

    // Transform 0-1000 scale bounding boxes to % for UI
    const issues = (rawJson.issues || []).map((issue: any) => {
      if (issue.box_2d && Array.isArray(issue.box_2d) && issue.box_2d.length === 4) {
        const [ymin, xmin, ymax, xmax] = issue.box_2d;
        return {
          ...issue,
          boundingBox: {
            y: (ymin / 1000) * 100,
            x: (xmin / 1000) * 100,
            height: ((ymax - ymin) / 1000) * 100,
            width: ((xmax - xmin) / 1000) * 100
          }
        };
      }
      return issue;
    });

    const json: AnalysisResult = { ...rawJson, issues };

    if (onProgress) onProgress(100);

    return json;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const translateContent = async (content: string, targetLanguage: string, settings: BrandSettings): Promise<{ translatedText: string, notes: string, stylisticScore: number, complianceIssues?: string[] }> => {
  const ai = getClient();
  const prompt = `
      Translate to ${targetLanguage} while maintaining this Tone: "${settings.toneVoice}".
      Strictly avoid these banned terms: "${settings.bannedTerms}".
      
      POST-TRANSLATION CHECK:
      1. Calculate "Stylistic Alignment Score" (0-100): How well does the translated text capture the original brand voice?
      2. Re-run Compliance: Did any banned terms slip through or appear due to localization? List them.
      
      Text: "${content.substring(0, 5000)}"
    `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: translationSchema }
  });
  if (response.text) return JSON.parse(cleanJson(response.text));
  throw new Error("Translation failed");
};

export const detectContext = async (content: string): Promise<{ context: CommunicationContext, assetType: AssetType, confidence: number }> => {
  const ai = getClient();
  // We only allow text-based inference.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze text to determine 'Context' and 'AssetType'. 
    Contexts: 
    - Sales
    - Marketing
    - Internal or Operations
    - HR
    - Legal or Compliance
    - Not sure
    
    Rules:
    - If ambiguous, choose "Not sure".
    - If persuasive/promotional, choose Marketing or Sales.
    - If policy/contract, choose Legal.
    - If employee-focused, choose HR.

    Provide a confidence score (0-100).
    Text: ${content.substring(0, 1000)}`,
    config: { responseMimeType: "application/json", responseSchema: contextDetectionSchema }
  });
  if (response.text) return JSON.parse(cleanJson(response.text));
  return { context: CommunicationContext.NOT_SURE, assetType: AssetType.DOCUMENT, confidence: 0 };
};

export const detectVisualContext = async (fileBase64: string, mimeType: string): Promise<{ context: CommunicationContext, assetType: AssetType, confidence: number }> => {
  // STRICT RULE: Visual assets must NOT have context inferred. 
  // We only detect AssetType. Context defaults to NOT_SURE to force user selection.

  // We can still use AI to detect the Asset Type if needed, but for now we just return a stub 
  // that forces the UI to ask the user.

  // Actually, we'll keep the AI call to detect AssetType (e.g. is it a Slide Deck or a Social Post?), 
  // but explicitly ignore any semantic context hooks.
  const ai = getClient();

  // Simplified schema for just detecting type
  const typeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      assetType: { type: Type.STRING, enum: Object.values(AssetType) },
      confidence: { type: Type.NUMBER }
    },
    required: ["assetType", "confidence"]
  };

  const parts = [
    { text: `Analyze this image/video frame to determine the 'AssetType'. ignore context.` },
    {
      inlineData: {
        mimeType: mimeType,
        data: fileBase64
      }
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts },
      config: { responseMimeType: "application/json", responseSchema: typeSchema }
    });

    if (response.text) {
      const res = JSON.parse(cleanJson(response.text));
      return { context: CommunicationContext.NOT_SURE, assetType: res.assetType, confidence: res.confidence };
    }
  } catch (e) {
    console.warn("Visual detection failed", e);
  }

  return { context: CommunicationContext.NOT_SURE, assetType: AssetType.IMAGE, confidence: 0 };
};

export const extractBrandSettings = async (content: string): Promise<BrandSettings> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Extract brand settings from: ${content.substring(0, 5000)}`,
    config: { responseMimeType: "application/json", responseSchema: settingsExtractionSchema }
  });
  if (response.text) return JSON.parse(cleanJson(response.text));
  throw new Error("Failed to extract settings");
};
