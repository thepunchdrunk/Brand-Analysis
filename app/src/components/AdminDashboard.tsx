
import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';
import {
    ShieldAlert, Target, FileText, Activity,
    Cpu, Sparkles, ArrowRight, Lightbulb, AlertCircle
} from 'lucide-react';
import { HistoryItem } from '../types';

interface AdminDashboardProps {
    history: HistoryItem[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ history }) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    // --- ANALYTICS ENGINE ---
    const rawData = useMemo(() => {
        const limit = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        return history.slice(0, limit * 2);
    }, [history, timeRange]);

    // --- CORE KPIs ---
    const kpis = useMemo(() => {
        const total = rawData.length;
        if (total === 0) return { passRate: 0, totalAnalyzed: 0, blockers: 0, timeSaved: 0 };

        const safeCount = rawData.filter(h => h.safetyStatus === 'Safe').length;
        const blockers = rawData.filter(h => h.safetyStatus === 'Unsafe').length;
        const passRate = Math.round((safeCount / total) * 100);
        const timeSaved = Math.round(total * 0.75); // 45 mins per asset

        return { passRate, totalAnalyzed: total, blockers, timeSaved };
    }, [rawData]);

    // --- ASSET TYPE PERFORMANCE (Replacing Department) ---
    const assetTypePerformance = useMemo(() => {
        const typeMap: Record<string, { total: number; safe: number }> = {};
        rawData.forEach(h => {
            const assetType = h.type || 'Unknown';
            if (!typeMap[assetType]) typeMap[assetType] = { total: 0, safe: 0 };
            typeMap[assetType].total++;
            if (h.safetyStatus === 'Safe') typeMap[assetType].safe++;
        });

        return Object.entries(typeMap)
            .map(([name, data]) => ({
                name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                fullName: name,
                rate: data.total > 0 ? Math.round((data.safe / data.total) * 100) : 0,
                volume: data.total
            }))
            .sort((a, b) => a.rate - b.rate) // Worst first
            .slice(0, 6); // Top 6 for readability
    }, [rawData]);

    const worstAssetType = assetTypePerformance[0];

    // --- CATEGORY BREAKDOWN (Brand/Compliance/Cultural) ---
    const categoryBreakdown = useMemo(() => {
        const categories = { Brand: 0, Compliance: 0, Cultural: 0 };
        rawData.forEach(h => {
            h.topIssues?.forEach(issue => {
                const lower = issue.toLowerCase();
                if (lower.includes('tone') || lower.includes('voice') || lower.includes('font') || lower.includes('logo') || lower.includes('style')) {
                    categories.Brand++;
                } else if (lower.includes('banned') || lower.includes('claim') || lower.includes('legal') || lower.includes('verified') || lower.includes('policy')) {
                    categories.Compliance++;
                } else {
                    categories.Cultural++;
                }
            });
        });
        return [
            { name: 'Brand', value: categories.Brand, color: '#6366f1' },
            { name: 'Compliance', value: categories.Compliance, color: '#f59e0b' },
            { name: 'Cultural', value: categories.Cultural, color: '#10b981' },
        ].filter(c => c.value > 0);
    }, [rawData]);

    // --- TOP RECURRING ISSUES ---
    const topIssues = useMemo(() => {
        const issueCounts: Record<string, number> = {};
        rawData.forEach(h => {
            h.topIssues?.forEach(issue => {
                issueCounts[issue] = (issueCounts[issue] || 0) + 1;
            });
        });
        return Object.entries(issueCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([name]) => name);
    }, [rawData]);

    // --- AI INSIGHT (Action-Oriented) ---
    const insight = useMemo(() => {
        if (kpis.passRate < 50) return {
            title: "Immediate Action Required",
            text: `Only ${kpis.passRate}% of assets are passing. Focus on updating guidelines for your most common issues to quickly improve this rate.`,
            color: "text-red-400"
        };
        if (worstAssetType && worstAssetType.rate < 60) return {
            title: "Focus Area Identified",
            text: `"${worstAssetType.fullName}" has the lowest pass rate at ${worstAssetType.rate}%. Consider creating a specific template or checklist for this asset type.`,
            color: "text-amber-400"
        };
        return {
            title: "System Healthy",
            text: "Your brand governance is performing well. To reach 100%, address the minor issues listed in the 'Recommended Actions' section.",
            color: "text-emerald-400"
        };
    }, [kpis, worstAssetType]);


    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900 animate-in fade-in duration-700">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-slate-200 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#E2000F]/10 rounded-lg text-[#E2000F]"><Cpu className="h-6 w-6" /></div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">ANALYTICS</h2>
                    </div>
                    <p className="text-slate-500 font-medium tracking-wide">Brand Governance Intelligence</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 mt-4 md:mt-0">
                    {['7d', '30d', '90d'].map(range => (
                        <button key={range} onClick={() => setTimeRange(range as any)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${timeRange === range ? 'bg-[#E2000F] text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-900'}`}>
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* ROW 1: AI INSIGHT */}
            <div className="mb-10 relative group overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
                <div className="absolute top-0 right-0 p-32 bg-[#E2000F]/5 blur-[100px] rounded-full" />
                <div className="flex items-start gap-6 relative z-10">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm"><Sparkles className="h-8 w-8 text-[#E2000F]" /></div>
                    <div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${insight.color}`}>{insight.title}</span>
                        <h3 className="text-xl font-medium text-slate-700 leading-relaxed max-w-3xl mt-2">{insight.text}</h3>
                    </div>
                </div>
            </div>

            {/* ROW 2: KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <MetricCard label="Pass Rate" value={`${kpis.passRate}%`} icon={Target} color="indigo" />
                <MetricCard label="Assets Analyzed" value={kpis.totalAnalyzed.toString()} icon={FileText} color="blue" />
                <MetricCard label="Blocked from Publish" value={kpis.blockers.toString()} icon={ShieldAlert} color="red" sub="Critical issues found" />
                <MetricCard label="Review Time Saved" value={`${kpis.timeSaved}h`} icon={Activity} color="emerald" sub="vs. Manual Process" />
            </div>

            {/* ROW 3: CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Asset Type Performance */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><FileText className="h-5 w-5 text-slate-500" /> Pass Rate by Asset Type</h3>
                    {assetTypePerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={assetTypePerformance} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal vertical={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} formatter={(value: number | undefined) => [`${value || 0}%`, 'Pass Rate']} />
                                <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={18}>
                                    {assetTypePerformance.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.rate >= 80 ? '#10b981' : entry.rate >= 50 ? '#f59e0b' : '#ef4444'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-slate-500 text-center py-12">No asset data available.</p>}
                </div>

                {/* Issue Category Breakdown */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-[#E2000F]" /> Issue Breakdown</h3>
                    {categoryBreakdown.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                                        {categoryBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a' }} itemStyle={{ color: '#0f172a' }} labelStyle={{ color: '#64748b' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Detailed Legend */}
                            <div className="flex flex-col gap-3 mt-6">
                                {categoryBreakdown.map(cat => (
                                    <div key={cat.name} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: cat.color }} />
                                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${(cat.value / Math.max(rawData.length, 1)) * 300}%`, backgroundColor: cat.color, opacity: 0.8 }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900 w-4 text-right">{cat.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <p className="text-slate-500 text-center py-8 text-sm">No issue data available.</p>}
                </div>
            </div>

            {/* ROW 4: RECOMMENDED ACTIONS */}
            <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-[#E2000F]" /> Recommended Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topIssues.length > 0 ? topIssues.map((issue, idx) => (
                        <div key={idx} className="group flex items-center p-4 rounded-2xl bg-slate-50 hover:bg-[#E2000F]/5 border border-transparent hover:border-[#E2000F]/20 transition-all cursor-pointer">
                            <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center mr-4 group-hover:bg-[#E2000F] group-hover:text-white shrink-0 transition-colors shadow-sm">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-0.5 group-hover:text-[#E2000F]">Update guidelines</p>
                                <p className="text-sm text-slate-900 font-medium truncate">"{issue}"</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-[#E2000F] transition-all shrink-0 -translate-x-2 group-hover:translate-x-0" />
                        </div>
                    )) : <div className="col-span-full text-center text-slate-500 py-8">No actions required at this time.</div>}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, icon: Icon, color, sub }: any) => {
    const colors: Record<string, string> = {
        indigo: "text-[#E2000F] bg-[#E2000F]/10",
        emerald: "text-emerald-600 bg-emerald-50",
        red: "text-[#E2000F] bg-[#E2000F]/10",
        blue: "text-blue-600 bg-blue-50"
    };
    const theme = colors[color] || colors.indigo;
    return (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-[#E2000F]/30 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-700 transition-colors">{label}</span>
                <div className={`p-2 rounded-xl ${theme}`}><Icon className="h-5 w-5" /></div>
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
            {sub && <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[11px] font-medium text-slate-500">{sub}</p>
            </div>}
        </div>
    );
};
