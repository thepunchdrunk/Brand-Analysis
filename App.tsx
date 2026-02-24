
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ZenUpload } from './components/ZenUpload';
import { ScoreDashboard } from './components/ScoreDashboard';
import { ActivityHistory } from './components/ActivityHistory';
import { BrandRules } from './components/BrandRules';
import { KnowledgeBase } from './components/KnowledgeBase';
import { UserManagement } from './components/UserManagement';
import { AdminDashboard } from './components/AdminDashboard';
import { ToastProvider, useToast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
// Contexts
import { AppView, CommunicationContext, UploadState, AnalysisResult, BrandSettings, AssetType, UserRole, HistoryItem, AudienceScope } from './types';
import { analyzeContent } from './services/gemini';

console.log("🚀 BOOT-TRACE: App.tsx module evaluating"); // TRACE LOG

// Sample initial history (used only if storage is empty)
const INITIAL_HISTORY: HistoryItem[] = [
    {
        id: "1",
        filename: "Q3_Marketing_Strategy.pptx",
        type: AssetType.PRESENTATION,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        safetyStatus: 'Safe',
        context: CommunicationContext.MARKETING,
        region: "Global",
        issuesCount: 3,
        topIssues: ["Font hierarchy inconsistent", "Minor tone drift"]
    },
    {
        id: "2",
        filename: "Sales_Pitch_V2.docx",
        type: AssetType.DOCUMENT,
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        safetyStatus: 'Unsafe',
        context: CommunicationContext.SALES,
        region: "North America",
        issuesCount: 12,
        topIssues: ["Banned term: 'leverage'", "Claim unverified"]
    }
];

const INITIAL_SETTINGS: BrandSettings = {
    brandName: 'AERION',
    mission: `1. BRAND PHILOSOPHY
AERION is conceived as a clarity engine in a world saturated with noise. The brand’s purpose is not merely to look modern, but to systematically reduce cognitive friction wherever complex systems meet human decision-making. The philosophy below anchors all visual, verbal, and experiential choices.

1.1 Purpose and Role
AERION exists to transform complexity into clarity. Its role is to make technical systems, data, and processes understandable, so that individuals and organizations can act with confidence.`,

    audience: `1.4 COGNITIVE LOAD CONSIDERATIONS
AERION design teams are expected to use cognitive load theory as a practical lens. 
1. Extraneous Load: Must be minimized by removing ornamental content.
2. Intrinsic Load: Must be clarified by structuring complex concepts into progressive disclosure.`,

    toneVoice: `2.1 VISUAL PERSONALITY
The visual personality is calm, structured, and quietly confident. Layouts breathe. Color is controlled. Typography is clear and unadorned. There are no decorative flourishes.

2.3 VISUAL RESTRAINT AS STRATEGY
AERION deliberately adopts visual restraint as a strategic tool. The question ‘what can we remove?’ is as important as ‘what must we add?’`,

    styleGuide: `2. VISUAL IDENTITY SYSTEM
The visual system of AERION is built to be rigorous, repeatable, and scalable. It is intentionally minimal but not empty.`,

    bannedTerms: `synergy, paradigm shift, leverage, bandwidth, rockstar, ninja, guru, disruptive (unless referring to tech)`,
    inclusiveLanguage: true
};

const DEFAULT_UPLOAD_STATE: UploadState = {
    file: null,
    textInput: '',
    context: CommunicationContext.NOT_SURE,
    region: '', // Start empty for wizard
    assetType: '' as AssetType, // Start empty for wizard
    additionalContext: '',
    detectedConfidence: 0,
    audienceScope: '' as AudienceScope // Start empty for wizard
};

function AppContent() {
    const { addToast } = useToast();
    const [userRole, setUserRole] = useState<UserRole>(UserRole.GENERAL_USER);
    const [currentView, setCurrentView] = useState<AppView>(AppView.UPLOAD);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const buildTimestamp = "2026-01-12 21:15"; // Hardcoded timestamp for verification

    useEffect(() => {
        addToast(`Deployment Version: ${buildTimestamp}`, "info");
    }, []);

    // -- PERSISTENCE LAYER --
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const saved = localStorage.getItem('brandai_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migration: Ensure safetyStatus exists
                return parsed.map((item: any) => ({
                    ...item,
                    safetyStatus: item.safetyStatus || (item.score >= 90 ? 'Safe' : item.score >= 70 ? 'Caution' : 'Unsafe'),
                    issuesCount: item.issuesCount || item.issues || 0
                }));
            } catch (e) {
                console.error("Failed to parse history", e);
                return INITIAL_HISTORY;
            }
        }
        return INITIAL_HISTORY;
    });

    const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => {
        const saved = localStorage.getItem('brandai_settings');
        return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    });

    const [uploadState, setUploadState] = useState<UploadState>(() => {
        // Always start fresh for wizard flow - ignore cached draft
        localStorage.removeItem('brandai_upload_draft'); // Clear any old cached state
        return DEFAULT_UPLOAD_STATE;
    });

    // Save to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('brandai_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('brandai_settings', JSON.stringify(brandSettings));
    }, [brandSettings]);

    useEffect(() => {
        // Auto-save draft (excluding binary file data to avoid quota issues)
        // FIX: Also exclude ingestedAsset which may contain large video/image base64
        const draftToSave = {
            ...uploadState,
            file: null,
            fileBase64: undefined,
            ingestedAsset: undefined,
            htmlPreview: undefined,
            // Strict exclusion of heavy assets
            visualSlides: undefined
        };
        try {
            localStorage.setItem('brandai_upload_draft', JSON.stringify(draftToSave));
        } catch (e) {
            console.warn("Failed to save draft to localStorage (likely quota exceeded)", e);
        }
    }, [uploadState]);

    // Reset view when role changes
    useEffect(() => {
        if (userRole === UserRole.ADMIN) {
            setCurrentView(AppView.ANALYTICS);
        } else {
            setCurrentView(AppView.UPLOAD);
        }
    }, [userRole]);

    const handleAnalyze = async () => {
        // Determine content to analyze
        let contentToAnalyze = uploadState.textInput;

        // Allow empty text if file is present (PDF, Image, etc)
        if (!contentToAnalyze && !uploadState.fileBase64) {
            if (uploadState.file) {
                addToast("Processing file. Please wait...", "info");
                return;
            }
            addToast("Please upload a file or enter text to analyze.", "error");
            return;
        }

        setIsAnalyzing(true);
        try {
            const result = await analyzeContent(
                contentToAnalyze,
                uploadState.context,
                uploadState.region,
                uploadState.assetType,
                brandSettings,
                'Medium', // Default intensity
                uploadState.fileBase64,
                uploadState.mimeType,
                uploadState.additionalContext,
                uploadState.ingestedAsset?.visualSlides, // Pass extracted PPTX slides for analysis
                (p) => setProgress(p)
            );
            setAnalysisResult(result);

            // Add to history with detailed metrics
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                filename: uploadState.file?.name || "Text Content",
                type: uploadState.assetType,
                date: new Date().toISOString(),
                safetyStatus: result.safetyStatus,
                context: uploadState.context,
                region: uploadState.region,
                issuesCount: result.issues.length,
                topIssues: result.issues.slice(0, 3).map(i => i.description),
                contextSnapshot: {
                    brandSettingsVersion: "v2.1",
                    timestamp: Date.now()
                }
            };
            setHistory(prev => [newHistoryItem, ...prev]);

            setCurrentView(AppView.RESULTS);
            addToast("Analysis Complete.", "success");
        } catch (error) {
            console.error("Analysis failed", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            addToast(`Analysis Failed: ${errorMessage}`, "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setUploadState(DEFAULT_UPLOAD_STATE);
        setCurrentView(AppView.UPLOAD);
    };

    const filePreviewUrl = React.useMemo(() => {
        if (uploadState.file) {
            return URL.createObjectURL(uploadState.file);
        }
        // Fallback for persistence: Reconstruct data URL from base64 if file object is lost (e.g. refresh)
        if (uploadState.fileBase64 && uploadState.mimeType) {
            return `data:${uploadState.mimeType};base64,${uploadState.fileBase64}`;
        }
        return undefined;
    }, [uploadState.file, uploadState.fileBase64, uploadState.mimeType]);

    return (
        <Layout
            currentView={currentView}
            setView={setCurrentView}
            userRole={userRole}
            setUserRole={setUserRole}
        >
            {/* GENERAL USER VIEWS */}
            {userRole === UserRole.GENERAL_USER && currentView === AppView.UPLOAD && (
                <ZenUpload
                    uploadState={uploadState}
                    setUploadState={setUploadState}
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    history={history}
                    progress={progress}
                />
            )}

            {userRole === UserRole.GENERAL_USER && currentView === AppView.RESULTS && analysisResult && (
                <ScoreDashboard
                    result={analysisResult}
                    onReset={handleReset}
                    brandSettings={brandSettings}
                    originalText={uploadState.textInput}
                    assetType={uploadState.assetType}
                    context={uploadState.context}
                    fileUrl={filePreviewUrl}
                    htmlContent={uploadState.htmlPreview}
                    mimeType={uploadState.mimeType}
                    visualSlides={uploadState.ingestedAsset?.visualSlides}
                />
            )}

            {currentView === AppView.HISTORY && (
                <ActivityHistory history={history} />
            )}

            {currentView === AppView.KNOWLEDGE_BASE && (
                <KnowledgeBase />
            )}

            {/* ADMIN VIEWS */}
            {userRole === UserRole.ADMIN && currentView === AppView.ANALYTICS && (
                <AdminDashboard history={history} />
            )}

            {userRole === UserRole.ADMIN && currentView === AppView.BRAND_GUIDELINES && (
                <BrandRules settings={brandSettings} onSave={setBrandSettings} />
            )}

            {userRole === UserRole.ADMIN && currentView === AppView.USER_MANAGEMENT && (
                <UserManagement />
            )}
        </Layout>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </ErrorBoundary>
    );
}

