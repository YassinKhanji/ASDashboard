"use client";

import { useRouter } from "next/navigation";
import { Users, UserCog, ClipboardCheck, Circle, Check, ChevronDown, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatTime, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardClient({ stats, activityData, upcomingSessions, recentProjects, userRole, currentRange }: any) {
  const { t } = useLanguage();
  const router = useRouter();
  const activePercent = stats.projectCount > 0 ? Math.round((stats.activeProjectCount / stats.projectCount) * 100) : 0;
  const pendingPercent = stats.projectCount > 0 ? Math.round((stats.pendingReviewCount / stats.projectCount) * 100) : 0;

  return (
    <div className="w-full h-auto md:h-full flex flex-col animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="mb-4 shrink-0">
        <h1 className="text-xl font-extrabold tracking-tight">Overview</h1>
        <p className="text-xs text-white/60">Avenir Souriant — Internal Management</p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-none md:h-[260px] min-h-0">
        
        {/* Left Column (Activity) */}
        <div className="col-span-1 md:col-span-5 bg-white/5 rounded-[24px] p-4 border border-white/10 flex flex-col relative overflow-hidden h-[220px] md:h-full">
          <div className="flex justify-between items-center mb-2 z-10 shrink-0">
            <h2 className="text-sm font-bold">{t('enrollments_activity')}</h2>
            <div className="relative group">
              <select 
                className="appearance-none bg-[#1a2f3a] border border-white/10 rounded-lg pl-2 pr-6 py-1 text-[10px] text-white/60 font-bold hover:text-white hover:bg-white/10 transition-colors cursor-pointer outline-none focus:border-accent-cyan/50 color-scheme-dark"
                value={currentRange || "week"}
                onChange={(e) => router.push(`/?range=${e.target.value}`)}
              >
                <option value="week" className="bg-[#1a2f3a] text-white">{t('week')}</option>
                <option value="month" className="bg-[#1a2f3a] text-white">{t('month')}</option>
                <option value="year" className="bg-[#1a2f3a] text-white">{t('year')}</option>
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-3 z-10 px-2 pt-2">
            {(activityData || []).map((day: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end group">
                <div className="w-full h-full flex items-end relative cursor-pointer bg-white/[0.03] rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className="w-full bg-gradient-to-t from-accent-cyan/40 to-accent-cyan/10 relative z-10 flex items-start justify-center pt-3 transition-all duration-700 ease-out group-hover:from-accent-cyan group-hover:to-accent-cyan/40 rounded-full" 
                    style={{ height: day.height }}
                  >
                    {Number(day.val) > 0 && (
                      <span className="text-[10px] font-black text-white group-hover:text-black transition-colors duration-300 drop-shadow-md">{day.val}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider group-hover:text-accent-cyan transition-colors">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column (Small stats) */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-2 h-auto md:h-full">
          <Link href="/etudiants" className="flex-1 bg-white/5 rounded-[20px] p-3 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-accent-cyan/20 transition-colors">
              <Users size={16} className="text-[#4db8ff]" />
            </div>
            <div>
              <div className="text-xl font-black leading-tight">{stats.studentCount}</div>
              <div className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{t('students')}</div>
            </div>
          </Link>
          <Link href="/personnel" className="flex-1 bg-white/5 rounded-[20px] p-3 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-accent-yellow/20 transition-colors">
              <UserCog size={16} className="text-[#f5c518]" />
            </div>
            <div>
              <div className="text-xl font-black leading-tight">{stats.staffCount}</div>
              <div className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{t('staff')}</div>
            </div>
          </Link>
          <Link href="/revue" className="flex-1 bg-white/5 rounded-[20px] p-3 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] group">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-accent-lime/20 transition-colors">
              <ClipboardCheck size={16} className="text-[#a8e063]" />
            </div>
            <div>
              <div className="text-xl font-black leading-tight">{stats.pendingReviewCount}</div>
              <div className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{t('review')}</div>
            </div>
          </Link>
        </div>

        {/* Right Column (Overview) */}
        <div className="col-span-1 md:col-span-4 bg-white/5 rounded-[24px] p-4 border border-white/10 relative h-[220px] md:h-full flex flex-col">
          <div className="flex justify-between items-center mb-1 shrink-0">
            <h2 className="text-sm font-bold">{t('project_breakdown')}</h2>
            <div className="text-[10px] text-white/60 font-bold">{stats.projectCount} {t('total')}</div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <svg className="h-full max-h-[80px] md:max-h-[90px] aspect-square transform -rotate-90" viewBox="0 0 100 100">
              {/* Background (Gray) */}
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
              {/* Pending (Cyan) */}
              <circle cx="50" cy="50" r="40" stroke="#4db8ff" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * pendingPercent) / 100} strokeLinecap="round" />
              {/* Active (Yellow) */}
              <circle cx="50" cy="50" r="40" stroke="#f5c518" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * activePercent) / 100} strokeLinecap="round" className="origin-center -rotate-90" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black">{activePercent}%</span>
              <span className="text-[7px] text-white/60 uppercase font-bold tracking-wider">Active</span>
            </div>
            
            {/* Legend overlays */}
            <div className="absolute right-0 top-0 flex flex-col gap-1.5 text-[9px] font-medium bg-black/20 p-2 rounded-xl border border-white/10 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-1.5 text-white/60 mb-0.5">
                  <div className="w-1 h-1 rounded-full bg-[#f5c518]" /> Active
                </div>
                <div className="font-bold ml-2.5">{stats.activeProjectCount}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-white/60 mb-0.5">
                  <div className="w-1 h-1 rounded-full bg-[#4db8ff]" /> Pending
                </div>
                <div className="font-bold ml-2.5">{stats.pendingReviewCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 flex-1 min-h-0">
        
        {/* Recent Projects (Like Challenges) */}
        <div className="col-span-1 md:col-span-8 bg-white/5 rounded-[24px] p-4 border border-white/10 flex flex-col h-[200px] md:h-full">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold">{t('recent_projects')}</h2>
            <Link href="/projets" className="text-[10px] text-white/60 hover:text-white flex items-center gap-1">{t('view_all')} <ArrowRight size={10}/></Link>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentProjects.slice(0, 3).map((p: any) => {
              const isApproved = p.status === "ACTIVE" || p.status === "APPROVED";
              return (
                <Link href={`/projets/${p.id}`} key={p.id} className="flex items-center justify-between group hover:bg-white/5 p-1.5 -mx-1.5 rounded-xl transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    {isApproved ? (
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                        <Check size={10} className="text-[#a8e063]" />
                      </div>
                    ) : (
                      <Circle size={24} className="text-white/20 shrink-0" strokeWidth={1.5} />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-xs truncate">{p.title}</div>
                      <div className="text-[9px] text-white/40">{p.createdBy.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[9px] text-white/60 hidden md:block">{PROJECT_TYPE_LABELS[p.type as keyof typeof PROJECT_TYPE_LABELS] || p.type}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${
                      isApproved ? "bg-[#a8e063] text-black" : "bg-[#f5c518] text-black"
                    }`}>
                      {PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS] || p.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="col-span-1 md:col-span-4 bg-white/5 rounded-[24px] p-4 border border-white/10 h-[200px] md:h-full flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              {t('upcoming_sessions')}
            </h2>
            <Link href="/calendrier" className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <CalendarDays size={10} />
            </Link>
          </div>
          
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
            {upcomingSessions.length === 0 ? (
              <div className="text-xs text-white/40 text-center mt-2">No sessions</div>
            ) : (
              upcomingSessions.slice(0, 3).map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: s.room?.color || '#4db8ff' }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold truncate">{s.project?.title || "Session"}</div>
                    <div className="text-[9px] text-white/60 mt-0.5 flex items-center gap-1.5">
                      <span>{formatTime(s.startTime)}</span> • <span>{s.room?.name || "Room"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
