
import { IngestedAsset, Modality } from '../types';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist';

// Mocking external libs removed for production


// Configure PDF Worker Safely
try {
    if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
        // Use CDN for Worker to avoid local dev serving issues (Version must match installed pdfjs-dist)
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;
    }
} catch (e) {
    console.error("PDF Worker Init Failed (Non-fatal):", e);
}

// Extract PDF pages as images for AI visual analysis
export const extractPDFPages = async (arrayBuffer: ArrayBuffer): Promise<{ data: string; mimeType: string }[]> => {
    const visualPages: { data: string; mimeType: string }[] = [];

    try {
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        // Limit to first 10 pages for performance and API limits
        const MAX_PAGES = 10;
        const maxPages = Math.min(pdf.numPages, MAX_PAGES);
        console.log(`PDF Extraction: Processing ${maxPages} of ${pdf.numPages} pages (Limit: ${MAX_PAGES})`);

        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.warn(`Failed to get canvas context for page ${i}`);
                continue;
            }

            // Render at 1.0x scale (standard resolution) to keep base64 payload small for fast API transit
            const viewport = page.getViewport({ scale: 1.0 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport, canvas }).promise;

            // Convert to base64 PNG (remove data:image/png;base64, prefix for Gemini)
            const base64 = canvas.toDataURL('image/png').split(',')[1];
            visualPages.push({ data: base64, mimeType: 'image/png' });

            console.log(`PDF Page ${i}: Rendered (${Math.round(base64.length / 1024)}KB)`);
        }
        console.log(`PDF Extraction Complete. Total Pages: ${visualPages.length}`);
    } catch (e) {
        console.error("PDF Extraction Failed:", e);
    }

    return visualPages;
};

// Helper to generate UUID
const generateId = () => crypto.randomUUID();

// Helper to convert blob to data URL (Async & Non-blocking)
const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


// Convert any image blob to a canvas-rendered PNG base64 (handles EMF, WMF, GIF, BMP, TIFF, etc.)
const imageBlobToBase64PNG = (blob: Blob): Promise<{ data: string; mimeType: string } | null> => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width || 960;
                canvas.height = img.naturalHeight || img.height || 540;
                const ctx = canvas.getContext('2d');
                if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
                ctx.drawImage(img, 0, 0);
                const base64 = canvas.toDataURL('image/png').split(',')[1];
                URL.revokeObjectURL(url);
                resolve({ data: base64, mimeType: 'image/png' });
            } catch (e) {
                console.warn('imageBlobToBase64PNG canvas render failed:', e);
                URL.revokeObjectURL(url);
                resolve(null);
            }
        };
        img.onerror = () => {
            console.warn('imageBlobToBase64PNG: image load failed for blob');
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
};

// Render slide content to a canvas thumbnail (960x540).
// Draws text AND any extracted per-slide images.
const renderSlideToCanvas = async (
    slideText: string,
    slideNumber: number,
    slideImageBlobs: Blob[]
): Promise<{ data: string; mimeType: string } | null> => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 540;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 960, 540);

        // Slide header bar
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, 960, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`SLIDE ${slideNumber}`, 24, 26);

        // Thin separator
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 40, 960, 1);

        let contentY = 50;

        // Draw extracted images onto the canvas (scaled to fit)
        for (const blob of slideImageBlobs) {
            try {
                const bitmap = await createImageBitmap(blob).catch(() => null);
                if (bitmap) {
                    const maxW = 900;
                    const maxH = 300;
                    const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
                    const drawW = bitmap.width * scale;
                    const drawH = bitmap.height * scale;
                    const drawX = (960 - drawW) / 2;
                    ctx.drawImage(bitmap, drawX, contentY, drawW, drawH);
                    contentY += drawH + 10;
                    bitmap.close();
                }
            } catch { /* skip unrenderable images */ }
        }

        // Draw text below images
        const rawText = slideText.trim();
        if (rawText) {
            const lines: string[] = [];
            const words = rawText.split(' ');
            let currentLine = '';
            const maxWidth = 900;
            ctx.font = '16px Arial';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            ctx.fillStyle = '#1e293b';
            let y = Math.max(contentY + 16, 76);
            for (const line of lines.slice(0, 18)) {
                if (y > 520) break;
                ctx.fillText(line, 30, y);
                y += 26;
            }
        }

        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        return { data: base64, mimeType: 'image/jpeg' };
    } catch (e) {
        console.warn('renderSlideToCanvas failed:', e);
        return null;
    }
};


export const extractPPTX = async (arrayBuffer: ArrayBuffer): Promise<{ text: string, html: string, visualSlides: { data: string; mimeType: string }[] }> => {
    const zip = new JSZip();
    const result = { text: '', html: '<div class="pptx-preview space-y-8">' };
    let totalImageSize = 0;
    const visualSlides: { data: string; mimeType: string }[] = [];
    // Per-slide data for canvas rendering
    const slideDataList: { text: string; imageBlobs: Blob[] }[] = [];
    let slideFiles: string[] = [];

    try {
        const content = await zip.loadAsync(arrayBuffer);

        // Find slide files
        slideFiles = Object.keys(content.files).filter(fileName =>
            fileName.match(/ppt\/slides\/slide\d+\.xml/)
        );

        console.log("PPTX Debug: Found slide files:", slideFiles);

        // Sort naturally (slide1, slide2, ..., slide10)
        slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
            const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
            return numA - numB;
        });

        for (const [index, fileName] of slideFiles.entries()) {
            const slideNum = index + 1;
            const slideXml = await content.files[fileName].async('text');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(slideXml, "text/xml");

            // Extract text from <a:t> tags (PowerPoint text nodes)
            const textNodes = xmlDoc.getElementsByTagName('a:t');
            let slideText = '';

            for (let i = 0; i < textNodes.length; i++) {
                slideText += textNodes[i].textContent + ' ';
            }

            // --- IMAGE EXTRACTION ---
            let imagesHtml = '';
            const slideImageBlobs: Blob[] = []; // Collect blobs per-slide for canvas rendering
            try {
                // Construct path to relationships file: ppt/slides/_rels/slideX.xml.rels
                const filenameParts = fileName.split('/');
                const baseName = filenameParts.pop(); // slide1.xml
                const relsPath = `${filenameParts.join('/')}/_rels/${baseName}.rels`;

                if (content.files[relsPath]) {
                    const relsXml = await content.files[relsPath].async('text');
                    const relsDoc = parser.parseFromString(relsXml, "text/xml");
                    const relationships = relsDoc.getElementsByTagName('Relationship');

                    for (let i = 0; i < relationships.length; i++) {
                        const type = relationships[i].getAttribute('Type');
                        const target = relationships[i].getAttribute('Target');

                        // Check if it's an image relationship
                        if (type && type.includes('image') && target) {
                            // Resolve relative path to zip path
                            let imagePath = target.replace('../', 'ppt/');

                            if (!imagePath.startsWith('ppt/')) {
                                const normalizedTarget = target.replace('../', '').replace(/^\//, '');
                                const possiblePath = `ppt/${normalizedTarget}`;
                                if (content.files[possiblePath]) imagePath = possiblePath;
                            }

                            if (content.files[imagePath]) {
                                const imgBuffer = await content.files[imagePath].async('arraybuffer');

                                // SAFEGUARD: Skip images larger than 2MB or if TOTAL load exceeds 10MB
                                const isTooLarge = imgBuffer.byteLength > 2 * 1024 * 1024;
                                const isBudgetExceeded = totalImageSize + imgBuffer.byteLength > 10 * 1024 * 1024;

                                if (isTooLarge || isBudgetExceeded) {
                                    imagesHtml += `<div class="text-[10px] text-slate-400 mb-2 italic">[Image Skipped: ${isTooLarge ? 'Too Large' : 'Total Size Limit'}]</div>`;
                                } else {
                                    totalImageSize += imgBuffer.byteLength;
                                    const ext = imagePath.split('.').pop()?.toLowerCase();
                                    // Expanded MIME detection for common PPTX image formats
                                    const mimeMap: Record<string, string> = {
                                        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                                        'gif': 'image/gif', 'bmp': 'image/bmp', 'tiff': 'image/tiff',
                                        'tif': 'image/tiff', 'svg': 'image/svg+xml', 'webp': 'image/webp',
                                        'emf': 'image/emf', 'wmf': 'image/wmf',
                                    };
                                    const mime = mimeMap[ext || ''] || 'image/png';

                                    const blob = new Blob([imgBuffer], { type: mime });
                                    slideImageBlobs.push(blob);

                                    // ObjectURL for HTML preview
                                    const objectUrl = URL.createObjectURL(blob);
                                    imagesHtml += `
                                        <div class="mb-4">
                                            <img src="${objectUrl}" class="max-w-full max-h-[300px] object-contain rounded border border-slate-100" />
                                        </div>
                                    `;
                                }
                            }
                        }
                    }
                }
            } catch (imgErr) {
                console.warn("Failed to extract images for slide " + slideNum, imgErr);
            }

            // Store per-slide data for canvas rendering
            slideDataList.push({ text: slideText, imageBlobs: slideImageBlobs });

            if (slideText.trim() || imagesHtml) {
                const slideHtml = `
                    <div class="slide bg-white border border-slate-200 p-6 rounded shadow-sm text-black">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Slide ${slideNum}</h4>
                        ${imagesHtml}
                        <p class="whitespace-pre-wrap mt-4 text-sm font-medium opacity-80">${slideText}</p>
                    </div>
                `;
                result.text += `[Slide ${slideNum}] ${slideText}\n\n`;
                result.html += slideHtml;
            }
        }

        result.html += '</div>';
    } catch (e) {
        console.error("PPTX Extraction Failed:", e);
        result.text = "Error extracting PPTX content.";
        result.html = "<div class='text-red-500'>Error parsing presentation slides.</div>";
    }

    // ALWAYS generate canvas-rendered visual slide thumbnails for the preview carousel.
    // This renders both text AND embedded images onto a canvas → reliable base64 output.
    if (slideDataList.length > 0) {
        console.log(`PPTX: Generating canvas thumbnails for ${slideDataList.length} slides...`);
        for (let i = 0; i < Math.min(slideDataList.length, 10); i++) {
            const { text, imageBlobs } = slideDataList[i];

            // Try canvas rendering with images first
            const thumbnail = await renderSlideToCanvas(text, i + 1, imageBlobs);
            if (thumbnail) {
                visualSlides.push(thumbnail);
            }

            // If canvas with images failed, try converting individual images as fallback
            if (!thumbnail && imageBlobs.length > 0) {
                for (const blob of imageBlobs) {
                    if (visualSlides.length >= 10) break;
                    const converted = await imageBlobToBase64PNG(blob);
                    if (converted) {
                        visualSlides.push(converted);
                        break; // One image per slide is enough for preview
                    }
                }
            }
        }
        console.log(`PPTX: Visual slides generated: ${visualSlides.length}`);
    }

    return { text: result.text, html: result.html, visualSlides };
};

export const ingestAsset = async (file: File): Promise<IngestedAsset> => {
    const id = generateId();
    const metadata = {
        uploadTime: Date.now(),
        owner: 'Current User',
        originalFormat: file.type || file.name.split('.').pop() || 'unknown'
    };

    let modality: Modality = Modality.MIXED;
    let content: string | ArrayBuffer = '';
    let htmlPreview: string | undefined = undefined;
    const flags = { isScreenshot: false };

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // 1. Modality Detection & Content Extraction
    if (file.type.startsWith('image/')) {
        modality = Modality.VISUAL_DOMINANT;
        content = await readFileAsBase64(file);
    } else if (file.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) {
        modality = Modality.VIDEO;
        content = await readFileAsBase64(file);
    } else if (file.type.startsWith('text/') || ['txt', 'md', 'csv', 'json'].includes(ext)) {
        modality = Modality.TEXT_DOMINANT;
        content = await readFileAsText(file);
    } else if (ext === 'pdf') {
        if (file.size > 25 * 1024 * 1024) throw new Error("File too large (Max 25MB)");
        modality = Modality.MIXED;
        console.log("PDF Detected. Extracting pages as images...");
        const arrayBuffer = await readFileAsArrayBuffer(file);
        content = await readFileAsBase64(file); // Keep base64 for preview rendering
        const visualSlides = await extractPDFPages(arrayBuffer);

        // Return early with visualSlides for AI analysis
        return {
            id,
            metadata,
            modality,
            content,
            rawFile: file,
            visualSlides, // Include extracted page images for AI visual analysis
            flags
        };
    } else if (ext === 'docx') {
        modality = Modality.MIXED; // Default to mixed, but could check density
        const arrayBuffer = await readFileAsArrayBuffer(file);

        try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            const htmlResult = await mammoth.convertToHtml({ arrayBuffer });

            content = result.value;
            htmlPreview = htmlResult.value;

            // Optional: Simple refined modality check based on text length
            if (content.length > 500) {
                // If lots of text, treating as Mixed is safer so we don't assume Marketing context too eagerly? 
                // Spec says: "Mixed... automatic context inference is not permitted." which is SAFE.
                // "Text-dominant... system may infer context automatically."
                // For now, let's keep DOCX as Mixed to be safe, unless it's pure text.
            }
        } catch (e) {
            console.error("Ingestion: DOCX extraction failed", e);
        }
    } else if (['ppt', 'pptx'].includes(ext)) {
        if (file.size > 25 * 1024 * 1024) throw new Error("File too large (Max 25MB)");
        modality = Modality.MIXED;
        console.log("PPTX Detected. Processing slides...");
        const buffer = await readFileAsArrayBuffer(file);
        const { text, html, visualSlides } = await extractPPTX(buffer);
        content = text;
        htmlPreview = html;
        // Store visualSlides for AI analysis
        return {
            id,
            metadata,
            modality,
            content,
            rawFile: file,
            htmlPreview,
            visualSlides, // Include extracted slide images
            flags
        };
    }

    // 2. Screenshot Detection (Metadata/Filename approach as per Spec Phase 1)
    // "based on presence of... known UI patterns. If detected... flagged as screenshot."
    const nameLower = file.name.toLowerCase();
    if (
        nameLower.includes('screen') ||
        nameLower.includes('shot') ||
        nameLower.includes('capture') ||
        nameLower.includes('clip')
    ) {
        flags.isScreenshot = true;
        // Spec: "Screenshots are treated as context-poor by default... Not sure."
        // We set the flag here; Context Logic uses it later.
    }

    return {
        id,
        metadata,
        modality,
        content,
        rawFile: file,
        htmlPreview,
        flags
    };
};

// --- Helpers ---

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1]); // Remove data URL prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};
