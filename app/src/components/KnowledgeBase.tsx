import React, { useState } from 'react';
import { Search, Book, Globe, Gavel, Type } from 'lucide-react';

const articles = [
    { id: 1, title: 'Global Tone Guidelines', category: 'Cultural', icon: Globe, snippet: 'How to adapt messaging for APAC and EMEA regions.' },
    { id: 2, title: 'Legal Disclaimers 2024', category: 'Compliance', icon: Gavel, snippet: 'Mandatory footer text for all public facing marketing assets.' },
    { id: 3, title: 'Inclusive Language Guide', category: 'Brand', icon: Type, snippet: 'Best practices for gender-neutral and accessible communication.' },
    { id: 4, title: 'Visual Identity Refresh', category: 'Visual', icon: Book, snippet: 'New color palette usage for digital presentations.' },
];

export const KnowledgeBase: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">How can we help you align?</h2>
            <div className="max-w-xl mx-auto relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search guidelines, regional rules, or compliance terms..." 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(article => (
                <div key={article.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${
                            article.category === 'Cultural' ? 'bg-blue-100 text-blue-600' :
                            article.category === 'Compliance' ? 'bg-red-100 text-red-600' :
                            'bg-emerald-100 text-emerald-600'
                        }`}>
                            <article.icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600">{article.category}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{article.title}</h3>
                    <p className="text-slate-600">{article.snippet}</p>
                </div>
            ))}
        </div>
        
        {filtered.length === 0 && (
            <div className="text-center py-12">
                <p className="text-slate-500">No guidelines found matching your search.</p>
            </div>
        )}
    </div>
  );
};