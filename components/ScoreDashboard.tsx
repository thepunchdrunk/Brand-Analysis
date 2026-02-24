
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2, AlertTriangle, XCircle,
    Check, Shield, Zap, Maximize2, ArrowLeft, Globe, Clock
} from 'lucide-react';
import { AnalysisResult, BrandSettings, AssetType, CommunicationContext } from '../types';

import { VisualAnnotationLayer } from './VisualAnnotationLayer';
import { cn } from '../utils';

// Category Color Mapping
// Category Color Mapping
const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Brand': return { bg: 'bg-[#E2000F]', text: 'text-white', border: 'border-[#E2000F]', shadow: 'shadow-red-500/20' };
        case 'Compliance': return { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-800', shadow: 'shadow-slate-500/20' };
        case 'Cultural': return { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-500', shadow: 'shadow-slate-500/20' };
        default: return { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-400', shadow: 'shadow-slate-400/20' };
    }
};

interface ScoreDashboardProps {
    result: AnalysisResult;
    onReset: () => void;
    brandSettings: BrandSettings;
    originalText?: string;
    assetType?: AssetType;
    context: CommunicationContext;
    fileUrl?: string;
    htmlContent?: string; // New prop for DOCX
    mimeType?: string;    // New prop for robust rendering
    visualSlides?: { data: string; mimeType: string }[]; // Extracted slide/page images
}

// Score Ring Component
const ScoreRing = ({ score }: { score: number }) => {
    const radius = 30;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-20 h-20">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-white/10"
                />
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={cn(
                        score === 100 ? "text-emerald-400" :
                            score >= 50 ? "text-amber-400" : "text-red-400"
                    )}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-xl font-black",
                    score === 100 ? "text-emerald-600" :
                        score >= 50 ? "text-amber-500" : "text-[#E2000F]"
                )}>
                    {score}
                </span>
            </div>
        </div>
    );
};

export const ScoreDashboard: React.FC<ScoreDashboardProps> = ({ result, onReset, originalText = "", assetType = AssetType.DOCUMENT, context, fileUrl, htmlContent, mimeType, visualSlides }) => {
    // ... existing hooks ...
    console.log("ScoreDashboard Render:", { assetType, hasVisualSlides: visualSlides?.length, htmlContentLen: htmlContent?.length });
    const [activeFilter, setActiveFilter] = useState<'Brand' | 'Compliance' | 'Cultural'>('Brand');
    const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set());
    const [hoveredIssue, setHoveredIssue] = useState<string | null>(null);

    const handleFix = (issueId: string) => {
        setFixedIssues(prev => {
            const newSet = new Set(prev);
            if (newSet.has(issueId)) newSet.delete(issueId);
            else newSet.add(issueId);
            return newSet;
        });
    };

    // Deductive Scoring Model (100% = No Issues)
    const PENALTY_VALUES = { 'High': 20, 'Medium': 10, 'Low': 5 };

    // Derived State: Dynamic Score
    const boostedScore = React.useMemo(() => {
        // Start perfect, deduct for every ACTIVE issue
        let score = 100;
        const activeIssues = result.issues.filter(i => !fixedIssues.has(i.id));

        activeIssues.forEach(issue => {
            score -= PENALTY_VALUES[issue.severity as keyof typeof PENALTY_VALUES] || 5;
        });

        return Math.max(0, score); // Floor at 0
    }, [fixedIssues, result.issues]);

    // Derived State: Dynamic Safety Status (Zero Tolerance)
    const currentSafetyStatus = React.useMemo(() => {
        const remainingIssues = result.issues.filter(i => !fixedIssues.has(i.id));
        const hasBlocking = remainingIssues.some(i => i.blocking);

        // 1. Unsafe if Blocking OR Score < 50
        if (hasBlocking || boostedScore < 50) return 'Unsafe';

        // 2. Safe ONLY if Perfect Score (100)
        if (boostedScore === 100) return 'Safe';

        // 3. Otherwise Caution (50-99)
        return 'Caution';
    }, [result.issues, fixedIssues, boostedScore]);



    const filteredIssues = result.issues.filter(i => i.category === activeFilter);

    // Sort: Blocking first, then High severity
    const sortedIssues = [...filteredIssues].sort((a, b) => {
        if (a.blocking && !b.blocking) return -1;
        if (!a.blocking && b.blocking) return 1;
        return 0; // Keep stable otherwise
    });

    // Helper to determine if we should show visual layer
    const showVisualLayer = React.useMemo(() => {
        return !!(fileUrl || htmlContent);
    }, [fileUrl, htmlContent]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 flex flex-col items-center">
            {/* BACKGROUND FX */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-200/40 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-500/5 blur-[100px] rounded-full" />
            </div>

            {/* HEADER */}
            <header className="w-full max-w-7xl flex flex-col gap-6 mb-8 relative z-10">
                <div className="flex justify-between items-center">
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#E2000F] transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="h-4 w-4" /> Upload New
                    </button>

                    <div className="flex items-center gap-6">
                        {/* BRAND ALIGNMENT SCORE CARD */}
                        <div className="flex items-center gap-4 px-6 py-2 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Brand Alignment</span>
                                <span className="text-xs font-medium text-slate-400">Score</span>
                            </div>
                            <ScoreRing score={boostedScore || 0} />
                        </div>

                        {/* OVERALL SAFETY STATUS BANNER */}
                        <div className={cn(
                            "px-6 py-4 rounded-2xl border backdrop-blur-md flex items-center gap-3 shadow-xl transition-all duration-500",
                            currentSafetyStatus === 'Unsafe' ? "bg-red-50 border-red-200 text-red-700 shadow-red-200/50" :
                                currentSafetyStatus === 'Caution' ? "bg-amber-50 border-amber-200 text-amber-700 shadow-amber-200/50" :
                                    "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-200/50"
                        )}>
                            {currentSafetyStatus === 'Unsafe' ? <XCircle className="h-8 w-8" /> :
                                currentSafetyStatus === 'Caution' ? <AlertTriangle className="h-8 w-8" /> :
                                    <CheckCircle2 className="h-8 w-8" />}

                            <div className="flex flex-col">
                                <span className="font-black text-xs uppercase tracking-widest opacity-70">Publish Status</span>
                                <span className="font-black text-lg uppercase tracking-wider">
                                    {currentSafetyStatus === 'Safe' ? "Ready to Publish" :
                                        currentSafetyStatus === 'Caution' ? "Review Required" : "Action Required"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN SPLIT VIEW */}
            <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-280px)] relative z-10">

                {/* LEFT: CONTENT VIEWER (2/3 width) */}
                <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col relative group shadow-xl shadow-slate-200/40">

                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Maximize2 className="h-3 w-3" /> {assetType} Analysis View
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                context === CommunicationContext.NOT_SURE ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            )}>
                                {context} Mode
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative bg-slate-50">
                        {/* VISUAL MODE CHECK - Now permissive based on content presence */}
                        {showVisualLayer ? (
                            fileUrl || htmlContent ? (
                                <VisualAnnotationLayer
                                    assetType={assetType as AssetType}
                                    src={fileUrl || ""}
                                    issues={sortedIssues}
                                    selectedIssueId={hoveredIssue || undefined}
                                    onIssueSelect={(id) => {
                                        setHoveredIssue(id);
                                    }}
                                    htmlContent={htmlContent}
                                    mimeType={mimeType}
                                    visualSlides={visualSlides}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                    <p>Visual preview unavailable (Missing File URL)</p>
                                </div>
                            )
                        ) : (
                            /* TEXT MODE */
                            <div className="h-full overflow-y-auto p-8 font-mono text-sm leading-relaxed scrollbar-hide text-slate-700 bg-white">
                                <p className="whitespace-pre-wrap max-w-2xl mx-auto">{originalText}</p>
                            </div>
                        )}
                    </div>
                </section >

                {/* RIGHT: UNIFIED ISSUE STREAM (1/3 width) */}
                < section className="flex flex-col h-full overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40" >

                    {/* FILTER TABS */}
                    < div className="flex p-1 gap-1 border-b border-slate-100 bg-slate-50/50 overflow-x-auto scrollbar-hide" >
                        {
                            ['Brand', 'Compliance', 'Cultural'].map((tab) => {
                                const colors = getCategoryColor(tab);
                                const isActive = activeFilter === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveFilter(tab as any)}
                                        className={cn(
                                            "flex-1 min-w-[80px] py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border border-transparent",
                                            isActive ? cn(colors.bg, "text-white border-transparent shadow-md") :
                                                "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                );
                            })
                        }
                    </div >

                    {/* METRICS HEADER */}
                    < div className="px-5 py-3 border-b border-slate-100 bg-white flex justify-between items-center" >
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {activeFilter} Issues
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                            {sortedIssues.filter(i => !fixedIssues.has(i.id)).length} / {sortedIssues.length}
                        </span>
                    </div >

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                        {sortedIssues.map((issue, index) => (
                            <motion.div
                                key={issue.id}
                                layoutId={issue.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "rounded-lg border transition-all cursor-pointer relative group overflow-hidden",
                                    hoveredIssue === issue.id ? "border-[#E2000F] bg-red-50 translate-x-1" : "bg-white border-slate-100 hover:border-slate-300",
                                    fixedIssues.has(issue.id) ? "opacity-40 grayscale" : ""
                                )}
                                onMouseEnter={() => setHoveredIssue(issue.id)}
                                onMouseLeave={() => setHoveredIssue(null)}
                                onClick={() => setHoveredIssue(issue.id)}
                            >
                                {/* HEADER */}
                                <div className="p-3 border-b border-slate-100 flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {/* NUMBER BADGE */}
                                            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                                issue.severity === 'High' ? "bg-red-500/20 text-red-300" :
                                                    issue.severity === 'Medium' ? "bg-amber-500/20 text-amber-300" :
                                                        "bg-indigo-500/20 text-indigo-300"
                                            )}>
                                                #{index + 1}
                                            </span>

                                            {issue.blocking ? (
                                                <span className="px-1.5 py-0.5 rounded-sm bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider">BLOCKING</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">ADVISORY</span>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{issue.category}</span>
                                            {issue.timestamp !== undefined && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-bold tabular-nums">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {Math.floor(issue.timestamp / 60)}:{String(Math.floor(issue.timestamp % 60)).padStart(2, '0')}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{issue.description}</h4>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded flex items-center justify-center shrink-0",
                                        issue.category === 'Brand' ? "bg-indigo-500/20 text-indigo-400" :
                                            issue.category === 'Compliance' ? "bg-amber-500/20 text-amber-400" :
                                                "bg-purple-500/20 text-purple-400"
                                    )}>
                                        {issue.category === 'Brand' ? <Shield className="h-3 w-3" /> :
                                            issue.category === 'Compliance' ? <AlertTriangle className="h-3 w-3" /> :
                                                <Globe className="h-3 w-3" />}
                                    </div>
                                </div>

                                {/* DETAILS */}
                                <div className="p-3">
                                    {/* Recommended Action Card */}
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />

                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="h-3 w-3 text-emerald-600" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Recommended Fix</span>
                                        </div>

                                        <p className="text-xs text-slate-600 leading-relaxed font-medium pl-1">
                                            {issue.fix}
                                        </p>
                                    </div>
                                </div>

                                {/* ACTION FOOTER */}
                                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-end">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleFix(issue.id); }}
                                        className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors",
                                            fixedIssues.has(issue.id) ? "text-emerald-600" : "text-slate-400 hover:text-[#E2000F]"
                                        )}
                                    >
                                        {fixedIssues.has(issue.id) ? <><Check className="h-3 w-3" /> Resolved</> : "Resolve"}
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {sortedIssues.length === 0 && (
                            <div className="py-12 text-center flex flex-col items-center opacity-50">
                                <CheckCircle2 className="h-8 w-8 mb-2" />
                                <span className="text-xs font-bold uppercase tracking-widest">No Issues Found</span>
                            </div>
                        )}
                    </div>
                </section >
            </main >
        </div >
    );
};
