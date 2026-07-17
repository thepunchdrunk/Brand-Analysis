
import React from 'react';
import { ShieldCheck, FileText, BookOpen, History, Globe, Settings, Users, Lock, SwitchCamera, LayoutDashboard } from 'lucide-react';
import { AppView, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userRole, setUserRole }) => {
  const NavButton = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${currentView === view || (view === AppView.UPLOAD && currentView === AppView.RESULTS)
        ? 'bg-[#E2000F] text-white shadow-lg shadow-red-900/20 font-medium'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon className={`h-5 w-5 transition-colors ${currentView === view ? 'text-white' : 'text-slate-400 group-hover:text-[#E2000F]'
        }`} />
      <span>{label}</span>
    </button>
  );

  const toggleRole = () => {
    const newRole = userRole === UserRole.GENERAL_USER ? UserRole.ADMIN : UserRole.GENERAL_USER;
    setUserRole(newRole);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-900 font-sans selection:bg-red-100 selection:text-red-900">
      {/* Sidebar Navigation - Light Theme */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col z-20">
        <div className="p-8 flex items-center gap-3 border-b border-slate-100">
          <div className={`p-2 rounded-lg ${userRole === UserRole.ADMIN ? 'bg-[#E2000F]' : 'bg-[#E2000F]'}`}>
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block leading-none text-slate-900">BrandAlign</span>
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1 block">
              {userRole === UserRole.ADMIN ? 'Admin Console' : 'Governance'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-8">

          {userRole === UserRole.GENERAL_USER && (
            <>
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="px-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  My Tasks
                </div>
                <div className="space-y-1">
                  <NavButton view={AppView.UPLOAD} icon={FileText} label="New Analysis" />
                  <NavButton view={AppView.HISTORY} icon={History} label="My Activity History" />
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-100">
                <div className="px-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                  <span>Resources</span>
                </div>
                <div className="space-y-1">
                  <NavButton view={AppView.KNOWLEDGE_BASE} icon={BookOpen} label="Knowledge Hub" />
                </div>
              </div>
            </>
          )}

          {userRole === UserRole.ADMIN && (
            <>
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="px-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-[#E2000F]">
                  Insights
                </div>
                <div className="space-y-1">
                  <NavButton view={AppView.ANALYTICS} icon={LayoutDashboard} label="Analytics Dashboard" />
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-100">
                <div className="px-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-[#E2000F]">
                  System Configuration
                </div>
                <div className="space-y-1">
                  <NavButton view={AppView.BRAND_GUIDELINES} icon={Settings} label="Brand Guidelines" />
                  <NavButton view={AppView.USER_MANAGEMENT} icon={Users} label="User Management" />
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-200">
                <div className="px-4 mb-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-[#E2000F]">
                  Governance
                </div>
                <div className="space-y-1">
                  <NavButton view={AppView.HISTORY} icon={Lock} label="Global Audit Logs" />
                </div>
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={toggleRole}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white hover:shadow-md transition-all group mb-2 border border-slate-200"
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm transition-all ${userRole === UserRole.ADMIN ? 'bg-slate-800' : 'bg-[#E2000F]'}`}>
              {userRole === UserRole.ADMIN ? 'AD' : 'JD'}
            </div>
            <div className="text-sm text-left overflow-hidden flex-1">
              <div className="font-semibold text-slate-900 truncate group-hover:text-[#E2000F] transition-colors">
                {userRole === UserRole.ADMIN ? 'Admin User' : 'Jane Doe'}
              </div>
              <div className="text-slate-500 text-xs truncate flex items-center gap-1">
                <SwitchCamera className="h-3 w-3" />
                Switch Role
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-white relative">

        <header className="px-8 py-6 flex-shrink-0 flex justify-between items-end z-10 relative border-b border-slate-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {currentView === AppView.HISTORY && (userRole === UserRole.ADMIN ? 'Global Audit Logs' : 'My Activity History')}
              {currentView === AppView.BRAND_GUIDELINES && 'Brand Guidelines'}
              {currentView === AppView.ANALYTICS && 'Analytics Dashboard'}
              {currentView === AppView.USER_MANAGEMENT && 'User Management'}
              {(currentView === AppView.UPLOAD || currentView === AppView.RESULTS) && 'Content Analysis'}
              {currentView === AppView.KNOWLEDGE_BASE && 'Knowledge Hub'}
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              {currentView === AppView.HISTORY && (userRole === UserRole.ADMIN ? 'Review system-wide compliance events and actions.' : 'Review your past analyses and scores.')}
              {currentView === AppView.BRAND_GUIDELINES && 'View official voice, tone, and compliance standards.'}
              {currentView === AppView.ANALYTICS && 'Real-time metrics on brand alignment, issue heatmaps, and adoption.'}
              {currentView === AppView.USER_MANAGEMENT && 'Manage roles, permissions, and regional access.'}
              {(currentView === AppView.UPLOAD || currentView === AppView.RESULTS) && 'AI-powered verification against your organization\'s standards.'}
              {currentView === AppView.KNOWLEDGE_BASE && 'Explore guidelines, tutorials, and regional policy documents.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-600 text-xs font-semibold rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <Globe className="h-3 w-3 text-slate-400" />
              Region: <span className="text-slate-900">Global</span>
            </div>
            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              System Active
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 pb-8 z-10">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
