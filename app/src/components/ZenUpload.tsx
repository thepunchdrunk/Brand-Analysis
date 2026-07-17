import React, { useState, useRef, useMemo } from 'react';
import { Upload, ShieldCheck, Globe, Zap, Loader2, ArrowLeft, MapPin } from 'lucide-react';
import { UploadState, HistoryItem, AudienceScope, AssetType, Modality } from '../types';
import { ingestAsset } from '../services/ingestion';
import { InputMethod, getAvailableAssets } from '../utils/ingestionLogic';
import { cn } from '../utils';

interface ZenUploadProps {
    uploadState: UploadState;
    setUploadState: (state: UploadState) => void;
    onAnalyze: () => void;
    isAnalyzing: boolean;
    history: HistoryItem[];
    progress?: number;
}

// --- PRIMITIVES ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white border border-slate-200 rounded-2xl overflow-visible shadow-sm", className)}>
        {children}
    </div>
);

const SelectionPill = ({ label, icon: Icon, selected, onClick }: any) => {
    // Brand Red is the only accent color now
    const selectedStyle = "bg-[#E2000F]/10 border-[#E2000F]/50 text-[#E2000F]";
    const unselectedStyle = "bg-slate-50 border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100";

    return (
        <button onClick={onClick} className={cn("flex items-center gap-2.5 px-5 py-4 rounded-xl border text-sm font-semibold transition-all duration-200 w-full justify-center", selected ? selectedStyle : unselectedStyle)}>
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );
};

// Simple native select - guaranteed to work
const Select = ({ options, value, onChange, placeholder = "Select..." }: { options: { label: string; value: string }[], value: string, onChange: (val: string) => void, placeholder?: string }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-[#E2000F]/50 appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
    >
        <option value="" disabled className="bg-white text-slate-400">{placeholder}</option>
        {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-white text-slate-900">{opt.label}</option>
        ))}
    </select>
);

const REGION_OPTIONS = [
    { label: "North America", value: "North America" },
    { label: "Europe", value: "Europe" },
    { label: "Asia Pacific", value: "Asia Pacific" },
    { label: "Latin America", value: "Latin America" },
    { label: "Middle East & Africa", value: "Middle East & Africa" },
];

export const ZenUpload: React.FC<ZenUploadProps> = ({ uploadState, setUploadState, onAnalyze, isAnalyzing, progress = 0 }) => {
    const [inputMethod, setInputMethod] = useState<InputMethod>(InputMethod.FILE);
    const [isHoveringDrop, setIsHoveringDrop] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Explicit step state
    const [activeStep, setActiveStep] = useState(1);

    const availableAssets = useMemo(() => getAvailableAssets(uploadState.audienceScope, inputMethod, uploadState.file?.name), [uploadState.audienceScope, inputMethod, uploadState.file?.name]);

    const handleFile = async (file: File) => {
        try {
            const asset = await ingestAsset(file);

            // Map ingested content to appropriate state fields so App.tsx validation passes
            let newText = '';
            let newBase64 = '';
            const ext = file.name.split('.').pop()?.toLowerCase();

            // PDF, Images, Videos -> Base64
            if (asset.modality === Modality.VISUAL_DOMINANT || asset.modality === Modality.VIDEO || ext === 'pdf') {
                newBase64 = asset.content as string;
            }
            // DOCX, PPTX, Text -> TextInput (Extracted Text)
            else {
                newText = asset.content as string;
            }
            // Log visual slides for debugging
            console.log("INGESTION: File processed:", file.name);
            console.log("INGESTION: Visual Slides:", asset.visualSlides?.length || 0);
            console.log("INGESTION: HTML Preview:", asset.htmlPreview ? "Present" : "None");

            setUploadState({
                ...uploadState,
                file,
                ingestedAsset: asset,
                textInput: newText,
                fileBase64: newBase64,
                htmlPreview: asset.htmlPreview,
                mimeType: file.type // Store mimeType for robust rendering logic
            });
            setActiveStep(2);
        } catch (e) {
            console.error(e);
        }
    };

    const handleScopeSelect = (scope: AudienceScope) => {
        setUploadState({ ...uploadState, audienceScope: scope, assetType: '' as AssetType });
        setActiveStep(3);
    };

    const handleAssetSelect = (type: AssetType) => {
        setUploadState({ ...uploadState, assetType: type });
        setActiveStep(4);
    };

    const handleRegionSelect = (region: string) => {
        setUploadState({ ...uploadState, region });
        // Only advance for Global. For specific regional toggle, we wait for Continue button
        if (region === "Global") {
            setActiveStep(5);
        }
    };

    const handleRegionalToggle = () => {
        setUploadState({ ...uploadState, region: "North America" }); // Default to trigger dropdown
        // Intentionally stay on step 4 to allow dropdown selection
    };

    const goBack = () => {
        setActiveStep(prev => Math.max(1, prev - 1));
    };

    const stepLabels = ["Content", "Scope", "Asset Type", "Region", "Review"];

    return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-900 selection:bg-red-100 font-sans flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E2000F] flex items-center justify-center shadow-lg shadow-red-500/20">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">BrandAlign</h1>
                    </div>
                </div>

                {/* Progress Dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map(step => (
                        <div key={step} className={cn("w-2 h-2 rounded-full transition-all", step < activeStep ? "bg-[#E2000F]" : step === activeStep ? "bg-[#E2000F] w-6" : "bg-slate-300")} />
                    ))}
                </div>

                {/* Step Label */}
                <div className="text-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Step {activeStep}</span>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">{stepLabels[activeStep - 1]}</h2>
                </div>

                {/* Single Step Content */}
                <Card className="p-6 mb-6 overflow-visible border-slate-200 shadow-sm">

                    {/* Step 1: Content */}
                    {activeStep === 1 && (
                        <div>
                            <div className="flex gap-2 mb-4">
                                {[InputMethod.FILE, InputMethod.TEXT].map(m => (
                                    <button key={m} onClick={() => setInputMethod(m)} className={cn("flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg", inputMethod === m ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600")}>
                                        {m === InputMethod.FILE ? "Upload" : "Text"}
                                    </button>
                                ))}
                            </div>
                            {inputMethod === InputMethod.FILE ? (
                                <div
                                    className={cn("h-[180px] rounded-xl border-2 border-dashed bg-slate-50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer", isHoveringDrop ? "border-[#E2000F]/50 bg-[#E2000F]/5" : "border-slate-200 hover:border-slate-300")}
                                    onDragOver={(e) => { e.preventDefault(); setIsHoveringDrop(true); }}
                                    onDragLeave={() => setIsHoveringDrop(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsHoveringDrop(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                                    <Upload className="w-8 h-8 text-slate-400" />
                                    <p className="text-slate-500 text-sm">Drop file or click to upload</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <textarea
                                        className="w-full h-[180px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-mono text-slate-700 resize-none focus:outline-none focus:border-slate-300"
                                        placeholder="Paste your content here..."
                                        value={uploadState.textInput}
                                        onChange={(e) => setUploadState({ ...uploadState, textInput: e.target.value })}
                                    />
                                    {uploadState.textInput && (
                                        <button onClick={() => setActiveStep(2)} className="w-full py-3 rounded-xl bg-[#E2000F] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#c2000d] transition-colors shadow-lg shadow-red-500/20">
                                            Continue
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Scope */}
                    {activeStep === 2 && (
                        <div className="grid grid-cols-2 gap-4">
                            <SelectionPill label="Internal" icon={ShieldCheck} selected={uploadState.audienceScope === AudienceScope.INTERNAL} onClick={() => handleScopeSelect(AudienceScope.INTERNAL)} color="emerald" />
                            <SelectionPill label="External" icon={Globe} selected={uploadState.audienceScope === AudienceScope.EXTERNAL} onClick={() => handleScopeSelect(AudienceScope.EXTERNAL)} color="amber" />
                        </div>
                    )}

                    {/* Step 3: Asset Type */}
                    {activeStep === 3 && (
                        <div className="space-y-4 max-h-[280px] overflow-y-auto scrollbar-hide">
                            {Object.entries(availableAssets).map(([category, options]) => (
                                <div key={category}>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">{category}</span>
                                    <div className="flex flex-wrap gap-2">
                                        {options.map(opt => (
                                            <button key={opt.value} onClick={() => handleAssetSelect(opt.value as AssetType)} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border", uploadState.assetType === opt.value ? "bg-slate-100 text-slate-900 border-slate-300 shadow-sm" : "bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900")}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 4: Region */}
                    {activeStep === 4 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleRegionSelect("Global")}
                                    className={cn("flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200", uploadState.region === "Global" ? "bg-[#E2000F]/10 border-[#E2000F]/50 text-[#E2000F]" : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                                >
                                    <Globe className="w-4 h-4" />
                                    Global
                                </button>
                                <button
                                    onClick={handleRegionalToggle}
                                    className={cn("flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200", uploadState.region && uploadState.region !== "Global" ? "bg-[#E2000F]/10 border-[#E2000F]/50 text-[#E2000F]" : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                                >
                                    <MapPin className="w-4 h-4" />
                                    Regional
                                </button>
                            </div>
                            {uploadState.region && uploadState.region !== "Global" && (
                                <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <label className="text-xs font-medium text-slate-500 mb-2 block">Select Specific Region</label>
                                    <Select
                                        options={REGION_OPTIONS}
                                        value={uploadState.region}
                                        onChange={(val) => handleRegionSelect(val)}
                                        placeholder="Select region..."
                                    />
                                    {uploadState.region && (
                                        <button
                                            onClick={() => setActiveStep(5)}
                                            className="w-full mt-4 py-3 rounded-xl bg-[#E2000F] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#c2000d] transition-colors shadow-lg shadow-red-500/20"
                                        >
                                            Continue
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Review & Analyze */}
                    {activeStep === 5 && (
                        <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500 text-sm">Content</span>
                                    <span className="text-slate-900 text-sm font-medium truncate max-w-[200px]">{uploadState.file?.name || "Text input"}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500 text-sm">Scope</span>
                                    <span className="text-slate-900 text-sm font-medium">{uploadState.audienceScope}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500 text-sm">Asset Type</span>
                                    <span className="text-slate-900 text-sm font-medium">{uploadState.assetType}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-slate-500 text-sm">Region</span>
                                    <span className="text-slate-900 text-sm font-medium">{uploadState.region}</span>
                                </div>
                            </div>

                            {isAnalyzing ? (
                                <div className="space-y-2">
                                    <div className="h-14 w-full bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex items-center justify-center">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-[#E2000F]/10 transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                        <div className="relative z-10 flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-[#E2000F]" />
                                            <span className="text-sm font-bold tracking-widest uppercase text-slate-900">
                                                Analyzing {progress}%
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-slate-500 animate-pulse">
                                        AI is checking your content against brand guidelines...
                                    </p>
                                </div>
                            ) : (
                                <button onClick={onAnalyze} className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 bg-[#E2000F] text-white hover:bg-[#c2000d] shadow-red-500/20">
                                    <Zap className="w-5 h-5" />
                                    Analyze Content
                                </button>
                            )}
                        </div>
                    )}
                </Card>

                {/* Back Button */}
                {
                    activeStep > 1 && (
                        <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium mx-auto">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )
                }
            </div >
        </div >
    );
};
