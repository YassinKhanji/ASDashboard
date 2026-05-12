"use client";

import { Bell, Users, UserCog, ClipboardCheck, Circle, Check, ChevronDown, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatTime, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/utils";

export default function DashboardClient({ stats, upcomingSessions, recentProjects, userRole }: any) {
  const activePercent = stats.projectCount > 0 ? Math.round((stats.activeProjectCount / stats.projectCount) * 100) : 0;
  const pendingPercent = stats.projectCount > 0 ? Math.round((stats.pendingReviewCount / stats.projectCount) * 100) : 0;

  return (
    <div className="w-full h-auto md:h-full flex flex-col animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Overview</h1>
          <p className="text-xs text-white/60">Avenir Souriant — Internal Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-white/60 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/10">
            < Bell size={16} />
          </button>
        </div>
      </header>

      {/* Main Grid - Stacks to single column on mobile (<768px) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-none md:flex-1 min-h-0">
        
        {/* Left Column (Activity) */}
        <div className="col-span-1 md:col-span-5 glass-card !p-5 flex flex-col relative overflow-hidden min-h-[280px] md:h-full">
          <div className="flex justify-between items-center mb-6 z-10 shrink-0">
            <h2 className="text-base font-bold">Enrollments</h2>
            <button className="text-xs text-white/60 flex items-center gap-1.5 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 touch-target">
              Week <ChevronDown size={14} />
            </button>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2.5 z-10 pb-2">
            {[
              { label: "Sun", height: "45%", val: "12" },
              { label: "Mon", height: "65%", val: "18" },
              { label: "Tue", height: "55%", val: "15" },
              { label: "Wed", height: "80%", val: "22" },
              { label: "Thu", height: "40%", val: "10" },
              { label: "Fri", height: "75%", val: "20" },
              { label: "Sat", height: "90%", val: "28" },
            ].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end">
                <div className="w-full h-full max-h-[140px] flex items-end relative group">
                  <div className="w-full bg-white/10 rounded-full absolute bottom-0 h-full" />
                  <div 
                    className="w-full bg-white/30 rounded-full relative z-10 flex items-start justify-center pt-2 transition-all active:bg-[#4db8ff]" 
                    style={{ height: day.height }}
                  >
                    <span className="text-[10px] font-bold text-white/80">{day.val}</span>
                  </div>
                </div>
                <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column (Small stats) */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-4 h-auto md:h-full">
          <div className="glass-card !p-4 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-2xl bg-[#4db8ff]/10 flex items-center justify-center shrink-0 border border-[#4db8ff]/20">
              <Users size={20} className="text-[#4db8ff]" />
            </div>
            <div>
              <div className="text-xl font-black text-white">{stats.studentCount}</div>
              <div className="text-xs text-white/50 font-bold uppercase tracking-widest leading-none mt-1">Students</div>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-2xl bg-[#f5c518]/10 flex items-center justify-center shrink-0 border border-[#f5c518]/20">
              <UserCog size={20} className="text-[#f5c518]" />
            </div>
            <div>
              <div className="text-xl font-black text-white">{stats.staffCount}</div>
              <div className="text-xs text-white/50 font-bold uppercase tracking-widest leading-none mt-1">Staff</div>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-2xl bg-[#a8e063]/10 flex items-center justify-center shrink-0 border border-[#a8e063]/20">
              <ClipboardCheck size={20} className="text-[#a8e063]" />
            </div>
            <div>
              <div className="text-xl font-black text-white">{stats.pendingReviewCount}</div>
              <div className="text-xs text-white/50 font-bold uppercase tracking-widest leading-none mt-1">Review</div>
            </div>
          </div>
        </div>

        {/* Right Column (Overview) */}
        <div className="col-span-1 md:col-span-4 glass-card !p-5 relative min-h-[240px] md:h-full flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-base font-bold">Projects</h2>
            <div className="text-[10px] text-black bg-accent-cyan px-2 py-0.5 rounded-md font-black uppercase tracking-wider">{stats.projectCount} Total</div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative min-h-0 py-4">
            <svg className="h-full max-h-[120px] md:max-h-[140px] aspect-square transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
              <circle cx="50" cy="50" r="40" stroke="#4db8ff" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * pendingPercent) / 100} strokeLinecap="round" />
              <circle cx="50" cy="50" r="40" stroke="#f5c518" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * activePercent) / 100} strokeLinecap="round" className="origin-center -rotate-90" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{activePercent}%</span>
              <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">Active</span>
            </div>
            
            <div className="absolute right-0 top-0 flex flex-col gap-3 text-[10px] font-bold bg-black/40 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#f5c518] shadow-[0_0_8px_rgba(245,197,24,0.5)]" />
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase tracking-tighter">Active</span>
                  <span className="text-white text-xs">{stats.activeProjectCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#4db8ff] shadow-[0_0_8px_rgba(77,184,255,0.5)]" />
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase tracking-tighter">Pending</span>
                  <span className="text-white text-xs">{stats.pendingReviewCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Responsive Stacking */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 shrink-0 h-auto md:h-[180px]">
        
        {/* Recent Projects */}
        <div className="col-span-1 md:col-span-8 glass-card !p-5 flex flex-col min-h-[240px] md:h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold">Recent Projects</h2>
            <Link href="/projets" className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 touch-target px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              View all <ArrowRight size={14}/>
            </Link>
          </div>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 no-scrollbar">
            {recentProjects.slice(0, 3).map((p: any) => {
              const isApproved = p.status === "ACTIVE" || p.status === "APPROVED";
              return (
                <Link href={`/projets/${p.id}`} key={p.id} className="flex items-center justify-between group p-3 -mx-2 rounded-2xl transition-all active:bg-white/10 active:scale-[0.98] border border-transparent active:border-white/10">
                  <div className="flex items-center gap-4">
                    {isApproved ? (
                      <div className="w-8 h-8 rounded-full bg-[#a8e063]/10 flex items-center justify-center shrink-0 border border-[#a8e063]/20">
                        <Check size={14} className="text-[#a8e063]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                        <Circle size={14} className="text-white/20" strokeWidth={2} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate text-white">{p.title}</div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">{p.createdBy.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[10px] text-white/40 hidden sm:block font-bold uppercase tracking-widest">{PROJECT_TYPE_LABELS[p.type as keyof typeof PROJECT_TYPE_LABELS] || p.type}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      isApproved ? "bg-[#a8e063] text-black shadow-[0_0_12px_rgba(168,224,99,0.3)]" : "bg-[#f5c518] text-black shadow-[0_0_12px_rgba(245,197,24,0.3)]"
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
        <div className="col-span-1 md:col-span-4 glass-card !p-5 min-h-[240px] md:h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              Sessions
            </h2>
            <Link href="/calendrier" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all border border-white/10">
              <CalendarDays size={18} />
            </Link>
          </div>
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
            {upcomingSessions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20 italic text-sm">
                No upcoming sessions
              </div>
            ) : (
              upcomingSessions.slice(0, 3).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 transition-transform active:scale-[0.98]">
                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: s.room?.color || '#4db8ff', boxShadow: `0 0 10px ${s.room?.color || '#4db8ff'}44` }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black truncate text-white">{s.project?.title || "Session"}</div>
                    <div className="text-[10px] text-white/50 mt-1 font-bold flex items-center gap-2 uppercase tracking-tight">
                      <span>{formatTime(s.startTime)}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="truncate">{s.room?.name || "Room"}</span>
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
