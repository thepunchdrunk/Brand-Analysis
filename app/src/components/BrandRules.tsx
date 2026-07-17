
import React, { useState } from 'react';
import {
    Shield, Lock, Info, Upload, RefreshCw, Link2, FileCheck,
    BookOpen, Mic, PenTool, Globe, ChevronRight, Copy, Check,
    AlertCircle, AlertTriangle, Layout, Edit2, Save
} from 'lucide-react';
import { BrandSettings } from '../types';
import { extractBrandSettings } from '../services/gemini';

interface BrandRulesProps {
    settings: BrandSettings;
    onSave: (settings: BrandSettings) => void;
}

export const BrandRules: React.FC<BrandRulesProps> = ({ settings, onSave }) => {
    const [formData, setFormData] = useState<BrandSettings>(settings);
    const [activeTab, setActiveTab] = useState<'identity' | 'voice' | 'style' | 'compliance' | 'templates'>('identity');
    const [portalUrl, setPortalUrl] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState('Oct 24, 2024 • 14:30 PM');
    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    // New: Editing Mode
    const [isEditing, setIsEditing] = useState(false);

    // New: Conflict & Impact Detection
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [showImpactModal, setShowImpactModal] = useState(false);

    const handlePortalSync = async () => {
        if (!portalUrl) return;
        setIsSyncing(true);
        // Simulate fetching from internal portal
        setTimeout(() => {
            const newSettings = {
                ...formData,
                brandName: "Brand Portal (v2.2)",
                mission: formData.mission + "\n\n[SYNCED FROM PORTAL]: Updated sustainability pillars included.",
                bannedTerms: formData.bannedTerms + ", eco-friendly (use 'sustainable' instead)"
            };
            setFormData(newSettings);
            setLastSynced(new Date().toLocaleString());
            onSave(newSettings);
            setIsSyncing(false);
        }, 2000);
    };

    const handleCreateSave = () => {
        onSave(formData);
        setIsEditing(false);
    };

    const handleCheckConflicts = () => {
        setIsCheckingConflicts(true);
        setConflicts([]);
        setTimeout(() => {
            setConflicts([
                "Visual Rule 'Minimalist' conflicts with 'High Density Information' in Compliance section.",
                "Banned term 'leverage' appears in Mission Statement text."
            ]);
            setIsCheckingConflicts(false);
            setShowImpactModal(true);
        }, 1500);
    };

    const copyToClipboard = (text: string, section: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const TabButton = ({ id, icon: Icon, label, description }: { id: typeof activeTab, icon: any, label: string, description: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full text-left px-5 py-4 rounded-xl flex items-start justify-between group transition-all duration-200 border ${activeTab === id
                ? 'bg-slate-50 border-slate-300 shadow-sm'
                : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
        >
            <div className="flex gap-4">
                <div className={`p-2 rounded-lg h-fit ${activeTab === id ? 'bg-[#E2000F]/10 text-[#E2000F]' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#E2000F] transition-colors'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <span className={`font-bold block text-sm ${activeTab === id ? 'text-[#E2000F]' : 'text-slate-700'}`}>{label}</span>
                    <span className="text-xs text-slate-500 font-medium mt-0.5 block">{description}</span>
                </div>
            </div>
            {activeTab === id && <ChevronRight className="h-5 w-5 text-[#E2000F]" />}
        </button>
    );

    const ContentViewer = ({ title, content, fieldKey }: { title: string, content: string, fieldKey?: keyof BrandSettings }) => (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    {title}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => copyToClipboard(content, title)}
                        className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-[#E2000F] transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
                        title="Copy content"
                    >
                        {copiedSection === title ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
            </div>
            {isEditing && fieldKey ? (
                <textarea
                    value={formData[fieldKey] as string}
                    onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                    className="w-full p-8 bg-white font-mono text-sm leading-relaxed text-slate-600 outline-none focus:bg-slate-50 min-h-[200px]"
                />
            ) : (
                <div className="p-8 bg-white font-mono text-sm leading-relaxed text-slate-600 whitespace-pre-wrap selection:bg-[#E2000F]/20 selection:text-slate-900">
                    {content}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 pb-12">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Brand Standards & Governance</h1>
                        {isEditing && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md animate-pulse">Editing Mode</span>}
                    </div>
                    <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] uppercase tracking-wide">
                            <Shield className="h-3 w-3" />
                            Enforced
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>Master Manual v2.1</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">Last Synced: {lastSynced}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCheckConflicts}
                        disabled={isCheckingConflicts}
                        className="px-4 py-2 bg-white text-slate-700 border border-slate-200 text-sm font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <AlertTriangle className={`h-4 w-4 ${isCheckingConflicts ? 'animate-pulse' : ''}`} />
                        {isCheckingConflicts ? 'Analyzing Conflicts...' : 'Check Conflicts'}
                    </button>

                    {isEditing ? (
                        <button
                            onClick={handleCreateSave}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save Changes
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-[#E2000F] text-white text-sm font-bold rounded-lg shadow-lg shadow-red-500/20 hover:bg-[#c2000d] transition-all flex items-center gap-2"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit Standards
                        </button>
                    )}
                </div>
            </div>

            {showImpactModal && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Rule Conflict & Impact Analysis
                        </h4>
                        <button onClick={() => setShowImpactModal(false)} className="text-amber-500 hover:text-amber-700"><Check className="h-4 w-4" /></button>
                    </div>
                    <ul className="list-disc list-inside text-xs text-amber-700 space-y-1 mb-4">
                        {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>

                    <div className="bg-white/50 p-3 rounded-lg border border-amber-100">
                        <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">Simulated Impact on Last 100 Assets</div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-slate-700">12</span>
                                <span className="text-[10px] text-slate-500">New Critical Issues</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-slate-700">-4%</span>
                                <span className="text-[10px] text-slate-500">Avg Score Drop</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync Control Bar */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center bg-slate-50 rounded-xl border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-[#E2000F]/20 focus-within:border-[#E2000F] transition-all">
                    <Globe className="h-4 w-4 text-slate-400 mr-3" />
                    <input
                        type="text"
                        value={portalUrl}
                        onChange={(e) => setPortalUrl(e.target.value)}
                        placeholder="Enter Internal Portal URL (e.g. https://brand.portal.com/api/v1/guidelines)"
                        className="flex-1 bg-transparent py-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {portalUrl && (
                        <button
                            onClick={() => setPortalUrl('')}
                            className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
                        >
                            <span className="sr-only">Clear</span>
                            <div className="h-4 w-4 flex items-center justify-center font-bold text-[10px]">✕</div>
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePortalSync}
                        disabled={isSyncing || !portalUrl}
                        className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isSyncing
                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                            : 'bg-[#E2000F] text-white hover:bg-[#c2000d] shadow-md shadow-red-500/20'
                            }`}
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Fetching...' : 'Fetch from Portal'}
                    </button>
                    <div className="w-px bg-slate-200 my-2 mx-1"></div>
                    <button
                        onClick={() => document.getElementById('manual-upload')?.click()}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Manual
                    </button>
                    <input
                        id="manual-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={async (e) => {
                            if (e.target.files?.[0]) {
                                const settings = await extractBrandSettings("Simulated extraction...");
                                setFormData(settings);
                            }
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-6 sticky top-8">
                    <nav className="space-y-2">
                        <div className="px-4 pb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sections</span>
                        </div>
                        <TabButton
                            id="identity"
                            icon={Shield}
                            label="Identity & Strategy"
                            description="Mission, values, and audience."
                        />
                        <TabButton
                            id="voice"
                            icon={Mic}
                            label="Voice & Tone"
                            description="Persona, writing style, and mechanics."
                        />
                        <TabButton
                            id="style"
                            icon={PenTool}
                            label="Visual System"
                            description="Logo, color, typography, and motion."
                        />
                        <TabButton
                            id="compliance"
                            icon={Lock}
                            label="Governance"
                            description="Legal, restrictions, and inclusion."
                        />
                        <div className="px-4 py-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assets</span>
                        </div>
                        <TabButton
                            id="templates"
                            icon={Layout}
                            label="Master Templates"
                            description="Approved PPTX and DOCX layouts."
                        />
                    </nav>

                    <div className="bg-[#E2000F] rounded-2xl p-6 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Link2 className="h-24 w-24 rotate-12" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Need Help?</h3>
                        <p className="text-white/80 text-sm mb-4 relative z-10 leading-relaxed">
                            Contact the Brand Office for clarifications on complex use-cases.
                        </p>
                        <button className="w-full py-2 bg-white text-[#E2000F] rounded-lg font-bold text-xs hover:bg-slate-50 transition-colors relative z-10">
                            Open Support Ticket
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9 space-y-6">

                    {/* Tab: Identity */}
                    {activeTab === 'identity' && (
                        <>
                            <div className="prose prose-slate max-w-none">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Brand Identity & Strategy</h2>
                                <p className="text-slate-500">The philosophical engine that drives the brand's market presence.</p>
                            </div>

                            <ContentViewer
                                title="Brand Name & Nomenclature"
                                content={formData.brandName}
                                fieldKey="brandName"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ContentViewer
                                    title="Mission Statement"
                                    content={formData.mission}
                                    fieldKey="mission"
                                />
                                <ContentViewer
                                    title="Target Audience"
                                    content={formData.audience}
                                    fieldKey="audience"
                                />
                            </div>
                        </>
                    )}

                    {/* Tab: Voice */}
                    {activeTab === 'voice' && (
                        <>
                            <div className="prose prose-slate max-w-none">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Voice & Tone Archetype</h2>
                                <p className="text-slate-500">Defining how we speak, write, and interact with the world.</p>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 flex items-start gap-4">
                                <Info className="h-6 w-6 text-[#E2000F] mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">AI Analysis Instruction</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        The AI uses the parameters below to score "Tone" alignment.
                                        Ensure the pillars (Precision, Calm, Honesty) are clearly defined to minimize false positives.
                                    </p>
                                </div>
                            </div>

                            <ContentViewer
                                title="Voice Pillars & Style Guide"
                                content={formData.toneVoice}
                                fieldKey="toneVoice"
                            />
                        </>
                    )}

                    {/* Tab: Style */}
                    {activeTab === 'style' && (
                        <>
                            <div className="prose prose-slate max-w-none">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Visual Identity System</h2>
                                <p className="text-slate-500">Technical specifications for visual assets, layout, and motion.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                {['Logo', 'Typography', 'Color'].map(item => (
                                    <div key={item} className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-[#E2000F]/50 transition-colors cursor-pointer group">
                                        <div className="font-bold text-slate-700 group-hover:text-[#E2000F]">{item}</div>
                                        <div className="text-xs text-slate-400 mt-1">View Assets</div>
                                    </div>
                                ))}
                            </div>

                            <ContentViewer
                                title="Master Visual Guidelines"
                                content={formData.styleGuide}
                                fieldKey="styleGuide"
                            />
                        </>
                    )}

                    {/* Tab: Compliance */}
                    {activeTab === 'compliance' && (
                        <>
                            <div className="prose prose-slate max-w-none">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Governance & Compliance</h2>
                                <p className="text-slate-500">Negative constraints, legal guardrails, and prohibited terminology.</p>
                            </div>

                            <div className="bg-red-50 rounded-xl p-6 border border-red-100 flex flex-col gap-4">
                                <div className="flex items-center gap-3 border-b border-red-200/50 pb-4">
                                    <AlertCircle className="h-5 w-5 text-[#E2000F]" />
                                    <h3 className="font-bold text-red-900">Restricted Terminology Blocklist</h3>
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={formData.bannedTerms}
                                        onChange={(e) => setFormData({ ...formData, bannedTerms: e.target.value })}
                                        className="font-mono text-sm text-red-800 bg-white p-4 rounded-lg border border-red-100 outline-none focus:ring-2 focus:ring-red-500/20"
                                    />
                                ) : (
                                    <div className="font-mono text-sm text-red-800 bg-white/50 p-4 rounded-lg border border-red-100">
                                        {formData.bannedTerms}
                                    </div>
                                )}
                                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Matches against these terms trigger High Severity alerts.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-6 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Inclusive Language Protocol</h4>
                                    <p className="text-sm text-slate-500 mt-1">Enforce gender-neutral and culturally sensitive checks globally.</p>
                                </div>
                                <button
                                    onClick={() => isEditing && setFormData({ ...formData, inclusiveLanguage: !formData.inclusiveLanguage })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${formData.inclusiveLanguage
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}
                                >
                                    {formData.inclusiveLanguage ? 'Active' : 'Disabled'}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Tab: Templates */}
                    {activeTab === 'templates' && (
                        <>
                            <div className="prose prose-slate max-w-none">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Master Templates</h2>
                                <p className="text-slate-500">Approved layouts for automated conformance checking.</p>
                            </div>

                            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                    <Upload className="h-8 w-8 text-indigo-500" />
                                </div>
                                <h3 className="font-bold text-slate-700">Upload Master Template</h3>
                                <p className="text-sm text-slate-500 mt-1 mb-4">Support for .pptx, .docx, .idml</p>
                                <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                                    Browse Files
                                </button>
                            </div>

                            <div className="space-y-2 mt-4">
                                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <FileCheck className="h-5 w-5 text-emerald-500" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">Q3_Sales_Deck_Master_v2.pptx</div>
                                            <div className="text-xs text-slate-400">Uploaded 2 days ago • 4.2 MB</div>
                                        </div>
                                    </div>
                                    <button className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <FileCheck className="h-5 w-5 text-emerald-500" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">Legal_Memo_A4.docx</div>
                                            <div className="text-xs text-slate-400">Uploaded 1 week ago • 1.1 MB</div>
                                        </div>
                                    </div>
                                    <button className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};
