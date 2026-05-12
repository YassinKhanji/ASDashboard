"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Printer, Filter } from "lucide-react";

interface SessionEvent {
  id: string; startTime: string; endTime: string; isCancelled: boolean;
  project: { id: string; title: string; type: string };
  room: { id: string; name: string; color: string };
}

type ViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

export default function CalendrierPage() {
  const [sessions, setSessions] = useState<SessionEvent[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string; color: string }[]>([]);
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterRoom, setFilterRoom] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/sessions").then(r => r.json()),
      fetch("/api/rooms").then(r => r.json()),
    ]).then(([s, r]) => { setSessions(s); setRooms(r); }).finally(() => setLoading(false));
  }, []);

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  }

  function getWeekDates() {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function getMonthDates() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const dates: Date[] = [];
    const d = new Date(startDate);
    while (d <= lastDay || dates.length % 7 !== 0) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + 1);
      if (dates.length > 42) break;
    }
    return dates;
  }

  function getSessionsForDate(date: Date) {
    return sessions.filter(s => {
      const sd = new Date(s.startTime);
      return sd.toDateString() === date.toDateString() && (!filterRoom || s.room.id === filterRoom);
    });
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function formatHeader() {
    if (view === "day") return currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (view === "week") {
      const dates = getWeekDates();
      return `${dates[0].getDate()} – ${dates[6].getDate()} ${monthNames[dates[6].getMonth()]} ${dates[6].getFullYear()}`;
    }
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="header-hero mb-2">Calendar</h1>
          <p className="text-text-secondary text-sm">Schedule and sessions overview</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <select 
              className="appearance-none bg-glass-surface border border-glass-border rounded-xl pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan transition-colors"
              value={filterRoom} 
              onChange={e => setFilterRoom(e.target.value)}
            >
              <option value="" className="bg-background">All rooms</option>
              {rooms.map(r => <option key={r.id} value={r.id} className="bg-background">{r.name}</option>)}
            </select>
          </div>
          
          <div className="flex p-1 bg-glass-surface border border-glass-border rounded-xl">
            {(["day", "week", "month"] as ViewMode[]).map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)} 
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  view === v 
                    ? "bg-accent-cyan/20 text-accent-cyan shadow-sm" 
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          
          <button className="btn-glass max-sm:hidden" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6 bg-glass-surface border border-glass-border rounded-2xl p-2 px-4 backdrop-blur-sm">
        <button className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-white capitalize">{formatHeader()}</h2>
        <button className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors" onClick={() => navigate(1)}>
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-text-secondary">
          <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          {/* Week View */}
          {view === "week" && (
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-glass-border/50 bg-white/5">
                  <div className="p-2" />
                  {getWeekDates().map((d, i) => {
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className={`p-3 text-center border-l border-glass-border/50 ${isToday ? "text-accent-cyan" : "text-text-secondary"}`}>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-1">{dayNames[d.getDay()]}</div>
                        <div className={`text-xl font-bold ${isToday ? "text-white" : "text-white/80"}`}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="h-[600px] overflow-y-auto custom-scrollbar">
                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] group hover:bg-white/[0.02] transition-colors">
                      <div className="p-2 text-[10px] font-semibold text-text-secondary text-right border-b border-glass-border/30">
                        {hour}:00
                      </div>
                      {getWeekDates().map((d, i) => {
                        const daySessions = getSessionsForDate(d).filter(s => new Date(s.startTime).getHours() === hour);
                        return (
                          <div key={i} className="border-l border-b border-glass-border/30 p-1 min-h-[48px]">
                            {daySessions.map(s => (
                              <div 
                                key={s.id} 
                                className="px-2 py-1 mb-1 rounded flex items-center gap-1.5 overflow-hidden group/item cursor-pointer shadow-sm hover:brightness-110 transition-all"
                                style={{ backgroundColor: `${s.room.color}33`, borderLeft: `3px solid ${s.room.color}` }}
                                title={`${s.project.title} — ${s.room.name}`}
                              >
                                <span className="text-[10px] font-bold text-white truncate drop-shadow-md">{s.project.title}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Month View */}
          {view === "month" && (
            <div className="min-w-[600px] overflow-x-auto custom-scrollbar">
              <div className="grid grid-cols-7 border-b border-glass-border/50 bg-white/5">
                {dayNames.map(d => (
                  <div key={d} className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {getMonthDates().map((d, i) => {
                  const daySessions = getSessionsForDate(d);
                  const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div 
                      key={i} 
                      className={`min-h-[100px] p-2 border-r border-b border-glass-border/30 transition-colors
                        ${isToday ? "bg-accent-cyan/10" : isCurrentMonth ? "hover:bg-white/[0.02]" : "opacity-30 bg-black/20"}
                      `}
                    >
                      <div className={`text-sm font-bold mb-2 ${isToday ? "text-accent-cyan" : "text-white/80"}`}>{d.getDate()}</div>
                      <div className="flex flex-col gap-1">
                        {daySessions.slice(0, 3).map(s => (
                          <div 
                            key={s.id} 
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white truncate"
                            style={{ backgroundColor: `${s.room.color}44`, borderLeft: `2px solid ${s.room.color}` }}
                          >
                            {s.project.title}
                          </div>
                        ))}
                        {daySessions.length > 3 && <div className="text-[10px] font-bold text-text-secondary pl-1">+{daySessions.length - 3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {view === "day" && (
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px]">
                <div 
                  className="grid border-b border-glass-border/50 bg-white/5" 
                  style={{ gridTemplateColumns: `60px ${rooms.filter(r => !filterRoom || r.id === filterRoom).map(() => "1fr").join(" ")}` }}
                >
                  <div className="p-2" />
                  {rooms.filter(r => !filterRoom || r.id === filterRoom).map(r => (
                    <div key={r.id} className="p-3 text-center border-l border-glass-border/50 font-bold text-white flex items-center justify-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: r.color }} />
                      <span className="text-sm">{r.name}</span>
                    </div>
                  ))}
                </div>
                <div className="h-[600px] overflow-y-auto custom-scrollbar">
                  {HOURS.map(hour => (
                    <div 
                      key={hour} 
                      className="grid hover:bg-white/[0.02] transition-colors group"
                      style={{ gridTemplateColumns: `60px ${rooms.filter(r => !filterRoom || r.id === filterRoom).map(() => "1fr").join(" ")}` }}
                    >
                      <div className="p-2 text-[10px] font-semibold text-text-secondary text-right border-b border-glass-border/30">
                        {hour}:00
                      </div>
                      {rooms.filter(r => !filterRoom || r.id === filterRoom).map(room => {
                        const roomSessions = sessions.filter(s => s.room.id === room.id && new Date(s.startTime).toDateString() === currentDate.toDateString() && new Date(s.startTime).getHours() === hour);
                        return (
                          <div key={room.id} className="border-l border-b border-glass-border/30 p-1 min-h-[48px]">
                            {roomSessions.map(s => (
                              <div 
                                key={s.id} 
                                className="px-2 py-1 mb-1 rounded flex items-center gap-1.5 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                                style={{ backgroundColor: `${room.color}33`, borderLeft: `3px solid ${room.color}` }}
                              >
                                <span className="text-xs font-bold text-white truncate drop-shadow-md">{s.project.title}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
