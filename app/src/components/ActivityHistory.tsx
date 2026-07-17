import React, { useState } from 'react';
import { FileText, Clock, ArrowUpRight, Search, Filter, CheckCircle2, AlertTriangle, AlertOctagon, Download } from 'lucide-react';
import { HistoryItem } from '../types';
import { clsx } from 'clsx';

interface ActivityHistoryProps {
    history: HistoryItem[];
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ history }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = history.filter(item =>
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.context.toLowerCase().includes(searchTerm.toLowerCase())
    );



    const handleExportCSV = () => {
        if (filteredHistory.length === 0) {
            alert("No data to export");
            return;
        }

        const headers = ["ID", "Filename", "Type", "Context", "Region", "Safety Status", "Issues Found", "Date"].join(",");
        const rows = filteredHistory.map(item => {
            return [
                item.id,
                `"${item.filename.replace(/"/g, '""')}"`, // Escape quotes
                item.type,
                item.context,
                item.region,
                item.safetyStatus,
                item.issuesCount,
                `"${new Date(item.date).toLocaleString()}"`
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `brand_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Actions */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by filename or purpose..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex-1 md:flex-none px-4 py-2 bg-[#E2000F] text-white font-medium text-sm rounded-lg hover:bg-[#c2000d] flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        Export Log
                    </button>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asset</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Context</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Issues</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Safety Status</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{item.filename}</div>
                                            <div className="text-xs text-slate-400">{item.type}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                                            {item.context}
                                        </span>
                                        {item.region !== "Global" && (
                                            <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                {item.region}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-slate-500 flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    {new Date(item.date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-center">
                                    <span className="font-bold text-slate-700">
                                        {item.issuesCount}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={clsx(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                                        item.safetyStatus === 'Safe' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                            item.safetyStatus === 'Caution' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                "bg-red-100 text-red-700 border-red-200"
                                    )}>
                                        {item.safetyStatus === 'Safe' && <CheckCircle2 className="h-3 w-3" />}
                                        {item.safetyStatus === 'Caution' && <AlertOctagon className="h-3 w-3" />}
                                        {item.safetyStatus === 'Unsafe' && <AlertTriangle className="h-3 w-3" />}
                                        {item.safetyStatus}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-all">
                                        <ArrowUpRight className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredHistory.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        <p>No activity found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};