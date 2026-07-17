
// Triggering fresh build for API key secret integration
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CommunicationContext, Region, AnalysisResult, BrandSettings, AssetType, FixIntensity } from '../types';

const getClient = () => {
  const windowEnv = (window as any).__RUNTIME_ENV__?.GEMINIAPIKEY;
  const runtimeKey = windowEnv && windowEnv !== "__GEMINIAPIKEY_PLACEHOLDER__" ? windowEnv : null;
  const buildTimeKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  const apiKey = runtimeKey || buildTimeKey || localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
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
        text: `VISUAL ANALYSIS MODE: You are analyzing ${visualSlides.length} slide/page images extracted from a presentation/document.

CRITICAL REQUIREMENTS:
1. Analyze EACH slide image visually for layout, design, text positioning, and brand alignment issues.
2. For EVERY issue you find, you MUST provide:
   - 'box_2d': [ymin, xmin, ymax, xmax] coordinates on a 0-1000 scale pointing to the EXACT visual location of the issue
   - 'page_number': Which slide/page (1-indexed) the issue appears on
3. Issues WITHOUT box_2d coordinates or page_number will be INVALID and ignored.
4. Be precise about visual locations - point to SPECIFIC elements on the slide.

Now analyze these slides:`
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
    // Two-phase curve: fast to 80% (~10s), then slow crawl to 98% (never stalls visibly)
    const startTime = Date.now();
    let currentProgress = 10;
    if (onProgress) onProgress(currentProgress);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      let targetProgress: number;
      if (elapsed < 12000) {
        // Phase 1: Quick climb 10→80% over ~12s
        targetProgress = 10 + 70 * (1 - Math.exp(-elapsed / 4000));
      } else {
        // Phase 2: Slow crawl 80→98% (keeps moving, never stalls)
        const phase2Elapsed = elapsed - 12000;
        targetProgress = 80 + 18 * (1 - Math.exp(-phase2Elapsed / 30000));
      }
      targetProgress = Math.min(98, targetProgress);
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
          model: 'gemini-2.5-flash',
          contents: { parts },
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
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

    // === DEFENSIVE POST-PROCESSING ===
    // Normalize every issue to guarantee the UI never drops or misrenders anything.
    // Gemini is non-deterministic — fields may be missing, malformed, or unexpected.
    const isVisualAsset = !!(visualSlides?.length || (fileBase64 && mimeType?.startsWith('image/')));
    const isVideoAsset = !!(fileBase64 && mimeType && (mimeType.startsWith('video/') || mimeType.startsWith('audio/')));
    const isMultiPage = !!(visualSlides && visualSlides.length > 1);

    const issues = (rawJson.issues || []).map((issue: any, idx: number) => {
      // 1. Ensure unique ID
      const id = issue.id || `issue-${Date.now()}-${idx}`;

      // 2. Normalize category (must be one of Brand/Compliance/Cultural)
      const validCategories = ['Brand', 'Compliance', 'Cultural'];
      const category = validCategories.includes(issue.category) ? issue.category : 'Brand';

      // 3. Normalize severity
      const validSeverities = ['Low', 'Medium', 'High'];
      const severity = validSeverities.includes(issue.severity) ? issue.severity : 'Medium';

      // 4. Ensure description and fix exist
      const description = issue.description || `Issue #${idx + 1}`;
      const rationale = issue.rationale || '';
      const fix = issue.fix || 'Review and address this item.';
      const subcategory = issue.subcategory || category;

      // 5. Normalize blocking flag
      const blocking = issue.blocking === true || severity === 'High';

      // 6. Normalize fixType
      const fixType = issue.fixType === 'Deterministic' ? 'Deterministic' : 'Manual';

      // 7. Transform bounding box (0-1000 → %) or assign default center
      let boundingBox = undefined;
      if (issue.box_2d && Array.isArray(issue.box_2d) && issue.box_2d.length === 4) {
        const [ymin, xmin, ymax, xmax] = issue.box_2d;
        boundingBox = {
          y: (ymin / 1000) * 100,
          x: (xmin / 1000) * 100,
          height: ((ymax - ymin) / 1000) * 100,
          width: ((xmax - xmin) / 1000) * 100
        };
      } else if (isVisualAsset || isMultiPage) {
        // Default center position so the marker still renders on screen
        boundingBox = { x: 45, y: 45, width: 10, height: 10 };
      }

      // 8. Normalize page_number for multi-page docs
      let page_number = issue.page_number;
      if (isMultiPage && !page_number) {
        page_number = 1; // Default to first page
      }

      // 9. Normalize timestamp for video/audio
      let timestamp = issue.timestamp;
      if (isVideoAsset && (timestamp === undefined || timestamp === null)) {
        timestamp = 0; // Default to start
      }

      return {
        id, category, subcategory, description, rationale, fix,
        severity, blocking, fixType, boundingBox, page_number, timestamp
      };
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
      model: 'gemini-2.5-flash',
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
    model: 'gemini-2.5-flash',
    contents: `Extract brand settings from: ${content.substring(0, 5000)}`,
    config: { responseMimeType: "application/json", responseSchema: settingsExtractionSchema }
  });
  if (response.text) return JSON.parse(cleanJson(response.text));
  throw new Error("Failed to extract settings");
};
