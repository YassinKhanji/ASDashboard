"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Printer, Filter, X, UserCheck } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface SessionEvent {
  id: string; startTime: string; endTime: string; isCancelled: boolean;
  project: { id: string; title: string; type: string };
  room: { id: string; name: string; color: string };
}

interface CalendarEvent {
  id: string; title: string; description: string | null; type: string;
  startTime: string; endTime: string; allDay: boolean; color: string | null;
}

type ViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7:00 to 23:00 (Midnight)

export default function CalendrierPage() {
  const [sessions, setSessions] = useState<SessionEvent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string; color: string }[]>([]);
  const { t } = useLanguage();
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterRoom, setFilterRoom] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedSession, setSelectedSession] = useState<SessionEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState<{date: Date, hour: number, roomId: string | null}>({date: new Date(), hour: 9, roomId: null});
  const [projects, setProjects] = useState<{id: string, title: string}[]>([]);
  const [form, setForm] = useState({ projectId: "", duration: 1, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setLoading(true);
    Promise.all([
      fetch("/api/sessions").then(r => r.json()),
      fetch("/api/calendar-events").then(r => r.json()),
      fetch("/api/rooms").then(r => r.json()),
      fetch("/api/projets").then(r => r.json()),
    ]).then(([s, ce, r, p]) => { 
      setSessions(s); 
      setCalendarEvents(ce);
      setRooms(r); 
      setProjects(p.filter((proj: any) => proj.status === "ACTIVE" || proj.status === "APPROVED"));
    }).finally(() => setLoading(false));
  }

  function handleSlotClick(date: Date, hour: number, roomId?: string) {
    setNewSessionData({ date, hour, roomId: roomId || rooms[0]?.id || null });
    setForm({ projectId: "", duration: 1, notes: "" });
    setShowNewSessionModal(true);
  }

  function handleSessionClick(e: React.MouseEvent, session: SessionEvent) {
    e.stopPropagation();
    setSelectedSession(session);
    setShowSessionModal(true);
  }

  function handleEventClick(e: React.MouseEvent, event: CalendarEvent) {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventModal(true);
  }

  async function handleCancelSession() {
    if (!selectedSession) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCancelled: true }),
      });
      if (res.ok) {
        setShowSessionModal(false);
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleDeleteSession() {
    if (!selectedSession) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSession.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowSessionModal(false);
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId || !newSessionData.roomId) return;
    setSaving(true);
    try {
      const startTime = new Date(newSessionData.date);
      startTime.setHours(newSessionData.hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + form.duration);

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          roomId: newSessionData.roomId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: form.notes,
        }),
      });
      if (res.ok) {
        setShowNewSessionModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create session");
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

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

  function getEventsForDate(date: Date) {
    return calendarEvents.filter(e => {
      const sd = new Date(e.startTime);
      const ed = new Date(e.endTime);
      
      // Check if the date falls within the range
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const s = new Date(sd);
      s.setHours(0,0,0,0);
      const end = new Date(ed);
      end.setHours(0,0,0,0);
      
      return d >= s && d <= end;
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col gap-8">
        <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="header-hero mb-2">Calendar 2026</h1>
              <p className="text-text-secondary text-sm">Executive Overview & Scheduling System</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <select 
                  className="w-full appearance-none bg-glass-surface border border-glass-border rounded-xl pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:border-accent-cyan transition-colors"
                  value={filterRoom} 
                  onChange={e => setFilterRoom(e.target.value)}
                >
                  <option value="" className="bg-background">All rooms / Events</option>
                  {rooms.map(r => <option key={r.id} value={r.id} className="bg-background">{r.name}</option>)}
                </select>
              </div>
              
              <div className="flex p-1 bg-glass-surface border border-glass-border rounded-xl flex-1 sm:flex-none">
                {(["day", "week", "month"] as ViewMode[]).map(v => (
                  <button 
                    key={v} 
                    onClick={() => setView(v)} 
                    className={`flex-1 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                      view === v 
                        ? "bg-accent-cyan text-black shadow-sm" 
                        : "text-text-secondary hover:text-white"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:px-4 py-2 bg-glass-surface border border-glass-border rounded-xl text-xs font-bold text-white hover:bg-white/10" onClick={() => setCurrentDate(new Date())}>
                  Today
                </button>
                <button className="flex-1 sm:hidden px-4 py-2 btn-glass" onClick={() => window.print()}>
                  <Printer size={16} className="mx-auto" />
                </button>
              </div>
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
        <div className="glass-card p-0">
          {/* Week View */}
          {view === "week" && (() => {
            const HOUR_HEIGHT = 60;
            const firstHour = HOURS[0];
            const totalHeight = HOURS.length * HOUR_HEIGHT;
            return (
            <div className="overflow-x-auto custom-scrollbar rounded-xl">
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
                  <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: `${totalHeight}px` }}>
                    {/* Time labels column */}
                    <div className="relative">
                      {HOURS.map(hour => (
                        <div key={hour} className="border-b border-glass-border/30 text-[10px] font-semibold text-text-secondary text-right pr-2 pt-1" style={{ height: `${HOUR_HEIGHT}px` }}>
                          {hour}:00
                        </div>
                      ))}
                    </div>
                    {/* Day columns with absolute-positioned sessions */}
                    {getWeekDates().map((d, i) => {
                      const daySessions = getSessionsForDate(d);
                      const dayEvents = getEventsForDate(d).filter(e => !e.allDay);
                      return (
                        <div key={i} className="relative border-l border-glass-border/50">
                          {/* Background hour grid lines + click targets */}
                          {HOURS.map(hour => (
                            <div
                              key={hour}
                              className="border-b border-glass-border/30 hover:bg-white/5 transition-colors cursor-pointer"
                              style={{ height: `${HOUR_HEIGHT}px` }}
                              onClick={() => handleSlotClick(d, hour)}
                            />
                          ))}
                          {/* Calendar event overlays */}
                          {dayEvents.map(e => {
                            const start = new Date(e.startTime);
                            const end = new Date(e.endTime);
                            const startMin = start.getHours() * 60 + start.getMinutes();
                            const endMin = end.getHours() * 60 + end.getMinutes();
                            const topPx = ((startMin - firstHour * 60) / 60) * HOUR_HEIGHT;
                            const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                            return (
                              <div
                                key={e.id}
                                className="absolute left-1 right-1 rounded px-2 py-1 overflow-hidden cursor-pointer shadow-sm hover:brightness-110 transition-all z-10"
                                style={{
                                  top: `${topPx}px`,
                                  height: `${Math.max(heightPx, 20)}px`,
                                  backgroundColor: `${e.color}33`,
                                  borderLeft: `3px solid ${e.color || '#ccc'}`,
                                }}
                                title={e.title}
                                onClick={(ev) => handleEventClick(ev, e)}
                              >
                                <span className="text-[10px] font-bold text-white truncate block">{e.title}</span>
                              </div>
                            );
                          })}
                          {/* Session overlays */}
                          {daySessions.map(s => {
                            const start = new Date(s.startTime);
                            const end = new Date(s.endTime);
                            const startMin = start.getHours() * 60 + start.getMinutes();
                            const endMin = end.getHours() * 60 + end.getMinutes();
                            const topPx = ((startMin - firstHour * 60) / 60) * HOUR_HEIGHT;
                            const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                            return (
                              <div
                                key={s.id}
                                className={`absolute left-1 right-1 rounded px-2 py-1 overflow-hidden cursor-pointer shadow-sm hover:brightness-110 transition-all z-10 ${s.isCancelled ? 'opacity-50 line-through' : ''}`}
                                style={{
                                  top: `${topPx}px`,
                                  height: `${Math.max(heightPx, 20)}px`,
                                  backgroundColor: `${s.room.color}33`,
                                  borderLeft: `3px solid ${s.room.color}`,
                                }}
                                title={`${s.project.title} — ${s.room.name}\n${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} – ${end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`}
                                onClick={(e) => handleSessionClick(e, s)}
                              >
                                <span className="text-[10px] font-bold text-white truncate drop-shadow-md block">{s.project.title}</span>
                                {heightPx >= 40 && (
                                  <span className="text-[9px] text-white/60 block">
                                    {start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} – {end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                                  </span>
                                )}
                                {heightPx >= 56 && (
                                  <span className="text-[9px] text-white/50 block">{s.room.name}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* Month View */}
          {view === "month" && (
            <div className="w-full overflow-hidden">
              <div className="grid grid-cols-7 border-b border-glass-border/50 bg-white/5">
                {dayNames.map(d => (
                  <div key={d} className="p-2 sm:p-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {d.substring(0, 1)}<span className="hidden sm:inline">{d.substring(1)}</span>
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
                      className={`min-h-[60px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-glass-border/30 transition-colors relative
                        ${isToday ? "bg-accent-cyan/10" : isCurrentMonth ? "hover:bg-white/[0.02]" : "opacity-30 bg-black/20"}
                      `}
                    >
                      <div className={`text-xs sm:text-sm font-bold mb-1 sm:mb-2 ${isToday ? "text-accent-cyan" : "text-white/80"}`}>{d.getDate()}</div>
                      <div className="flex flex-col gap-1">
                        {getEventsForDate(d).map(e => (
                          <div 
                            key={e.id} 
                            className="px-1 py-0.5 rounded text-[9px] font-bold text-white truncate shadow-sm border-l-2 cursor-pointer hover:brightness-110"
                            style={{ backgroundColor: `${e.color}44`, borderLeftColor: e.color || '#ccc' }}
                            title={e.title}
                            onClick={(ev) => handleEventClick(ev, e)}
                          >
                            {e.title}
                          </div>
                        ))}
                        {daySessions.map(s => (
                          <div 
                            key={s.id} 
                            className={`w-1.5 h-1.5 sm:w-auto sm:h-auto sm:px-1.5 sm:py-0.5 rounded-full sm:rounded text-[9px] font-semibold text-white truncate cursor-pointer hover:brightness-110 ${s.isCancelled ? 'opacity-50 line-through' : ''}`}
                            style={{ 
                              backgroundColor: s.room.color,
                              borderLeft: 'none'
                            }}
                            title={`${s.project.title} — ${s.room.name}`}
                            onClick={(e) => handleSessionClick(e, s)}
                          >
                            <span className="hidden sm:inline">{s.project.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {view === "day" && (() => {
            const HOUR_HEIGHT = 60;
            const firstHour = HOURS[0];
            const totalHeight = HOURS.length * HOUR_HEIGHT;
            const filteredRooms = rooms.filter(r => !filterRoom || r.id === filterRoom);
            return (
            <div className="overflow-x-auto custom-scrollbar rounded-xl">
              <div className="min-w-[800px]">
                <div 
                  className="grid border-b border-glass-border/50 bg-white/5 sticky top-0 z-20" 
                  style={{ gridTemplateColumns: `60px ${filteredRooms.map(() => "1fr").join(" ")}` }}
                >
                  <div className="p-2 flex items-center justify-center border-r border-glass-border/30">
                    <div className="p-1 rounded bg-white/10 text-accent-cyan cursor-pointer hover:bg-white/20 transition-colors" title="Filter Rooms" onClick={() => setFilterRoom("")}>
                      <Filter size={14} />
                    </div>
                  </div>
                  {filteredRooms.map(r => {
                    const capacity = (rooms as any).find((rm: any) => rm.id === r.id)?.capacity;
                    return (
                      <div key={r.id} className="p-3 text-center border-l border-glass-border/50 font-bold text-white flex flex-col items-center justify-center gap-1 group relative bg-white/[0.02] min-w-0">
                        <div className="w-full h-1 absolute top-0 left-0 transition-all group-hover:h-1.5" style={{ backgroundColor: r.color }} />
                        <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold mt-1 block">Room</span>
                        <span className="text-sm font-bold truncate w-full px-1">{r.name}</span>
                        {capacity && <span className="text-[10px] opacity-40 font-medium italic">Cap: {capacity}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="h-[600px] overflow-y-auto custom-scrollbar">
                  <div 
                    className="grid"
                    style={{ gridTemplateColumns: `60px ${filteredRooms.map(() => "1fr").join(" ")}`, height: `${totalHeight}px` }}
                  >
                    {/* Time labels column */}
                    <div className="relative">
                      {HOURS.map(hour => (
                        <div key={hour} className="border-b border-glass-border/30 text-[10px] font-semibold text-text-secondary text-right pr-2 pt-1" style={{ height: `${HOUR_HEIGHT}px` }}>
                          {hour}:00
                        </div>
                      ))}
                    </div>
                    {/* Room columns with absolute-positioned sessions */}
                    {filteredRooms.map(room => {
                      const roomSessions = sessions.filter(s => s.room.id === room.id && new Date(s.startTime).toDateString() === currentDate.toDateString());
                      return (
                        <div key={room.id} className="relative border-l border-glass-border/50">
                          {/* Background hour grid lines + click targets */}
                          {HOURS.map(hour => (
                            <div
                              key={hour}
                              className="border-b border-glass-border/30 hover:bg-white/5 transition-colors cursor-pointer"
                              style={{ height: `${HOUR_HEIGHT}px` }}
                              onClick={() => handleSlotClick(currentDate, hour, room.id)}
                            />
                          ))}
                          {/* Session overlays */}
                          {roomSessions.map(s => {
                            const start = new Date(s.startTime);
                            const end = new Date(s.endTime);
                            const startMin = start.getHours() * 60 + start.getMinutes();
                            const endMin = end.getHours() * 60 + end.getMinutes();
                            const topPx = ((startMin - firstHour * 60) / 60) * HOUR_HEIGHT;
                            const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                            return (
                              <div
                                key={s.id}
                                className={`absolute left-1 right-1 rounded px-2 py-1 overflow-hidden cursor-pointer shadow-sm hover:brightness-110 transition-all z-10 ${s.isCancelled ? 'opacity-50 line-through' : ''}`}
                                style={{
                                  top: `${topPx}px`,
                                  height: `${Math.max(heightPx, 20)}px`,
                                  backgroundColor: `${room.color}33`,
                                  borderLeft: `3px solid ${room.color}`,
                                }}
                                title={`${s.project.title}\n${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} – ${end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`}
                                onClick={(e) => handleSessionClick(e, s)}
                              >
                                <span className="text-[10px] font-bold text-white truncate drop-shadow-md block">{s.project.title}</span>
                                {heightPx >= 40 && (
                                  <span className="text-[9px] text-white/60 block">
                                    {start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} – {end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      )}

        </div>{/* end main content area */}
        
        {/* Bottom Widgets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-8 border-t border-glass-border">
          {/* Legend */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-accent-cyan">●</span> Legend
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f87171' }} />
                <span className="text-white/80">Public Holidays</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fb923c' }} />
                <span className="text-white/80">Islamic Holidays</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#78350f' }} />
                <span className="text-white/80">Ramadan</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-white/80">Courses</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d2b48c' }} />
                <span className="text-white/80">Halakas</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#facc15' }} />
                <span className="text-white/80">Academic Pressure</span>
              </div>
            </div>
          </div>

          {/* Key Rules */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-accent-yellow">!</span> Key Rules
            </h3>
            <ul className="space-y-2 text-xs text-white/70 list-disc pl-4">
              <li>Public holidays = normal operations</li>
              <li>Islamic holidays = no courses or halakas</li>
              <li>Ramadan = no courses or halakas</li>
              <li>Before 6 PM weekdays = no volunteer availability</li>
              <li>Halakas only on weekdays (Mon-Fri)</li>
            </ul>
          </div>

          {/* Print & Sync */}
          <div className="glass-card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Printer size={18} className="text-accent-cyan" /> Print & Sync
            </h3>
            <div className="flex flex-col gap-3">
              <button className="btn-glass w-full justify-center text-xs py-2.5" onClick={() => window.print()}>
                Download PDF Calendar
              </button>
              <a href="/Calendar_2026_1.ics" download className="btn-glass w-full justify-center text-xs py-2.5">
                Download iCal File
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowNewSessionModal(false)}>
          <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Session</h3>
              <button className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10" onClick={() => setShowNewSessionModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Date</label>
                  <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-white">{newSessionData.date.toDateString()}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Time</label>
                  <div className="px-3 py-2 bg-white/5 rounded-lg text-sm text-white">{newSessionData.hour}:00</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Project <span className="text-accent-yellow">*</span></label>
                <select className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white" required value={form.projectId} onChange={e => setForm(f => ({...f, projectId: e.target.value}))}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Room <span className="text-accent-yellow">*</span></label>
                <select className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white" required value={newSessionData.roomId || ""} onChange={e => setNewSessionData(d => ({...d, roomId: e.target.value}))}>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Duration (hours)</label>
                <input type="number" min="1" max="8" className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white" value={form.duration} onChange={e => setForm(f => ({...f, duration: Number(e.target.value)}))} />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-glass-border">
                <button type="button" className="btn-glass" onClick={() => setShowNewSessionModal(false)}>Cancel</button>
                <button type="submit" className="btn-glass btn-glass-primary" disabled={saving || !form.projectId}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowSessionModal(false)}>
          <div className="glass-card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{selectedSession.project.title}</h3>
              <button className="p-1 rounded-lg text-text-secondary hover:text-white hover:bg-white/10" onClick={() => setShowSessionModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center justify-between border-b border-glass-border/50 pb-2">
                <span className="text-text-secondary">Room</span>
                <span className="font-semibold flex items-center gap-2 text-white">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSession.room.color }} />
                  {selectedSession.room.name}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border/50 pb-2">
                <span className="text-text-secondary">Date</span>
                <span className="font-semibold text-white">{new Date(selectedSession.startTime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border/50 pb-2">
                <span className="text-text-secondary">Time</span>
                <span className="font-semibold text-white">
                  {new Date(selectedSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                  {new Date(selectedSession.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-text-secondary">Status</span>
                <span className={`font-semibold ${selectedSession.isCancelled ? 'text-red-400' : 'text-accent-lime'}`}>
                  {selectedSession.isCancelled ? 'Cancelled' : 'Scheduled'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!selectedSession.isCancelled && (
                <Link href={`/sessions/${selectedSession.id}/attendance`} className="btn-glass w-full justify-center btn-glass-primary">
                  <UserCheck size={16} /> {t('mark_attendance')}
                </Link>
              )}
              <Link href={`/projets/${selectedSession.project.id}`} className="btn-glass w-full justify-center">
                View Project
              </Link>
              {!selectedSession.isCancelled && (
                <button className="btn-glass bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" onClick={handleCancelSession} disabled={saving}>
                  {saving ? "Processing..." : "Cancel Session"}
                </button>
              )}
              {selectedSession.isCancelled && (
                <button className="btn-glass bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/40" onClick={handleDeleteSession} disabled={saving}>
                  {saving ? "Deleting..." : "Delete Permanently"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowEventModal(false)}>
          <div className="glass-card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
              <button className="p-1 rounded-lg text-text-secondary hover:text-white hover:bg-white/10" onClick={() => setShowEventModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center justify-between border-b border-glass-border/50 pb-2">
                <span className="text-text-secondary">Type</span>
                <span className="font-semibold text-white capitalize">{selectedEvent.type.toLowerCase()}</span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border/50 pb-2">
                <span className="text-text-secondary">Date</span>
                <span className="font-semibold text-white">{new Date(selectedEvent.startTime).toLocaleDateString()}</span>
              </div>
              {!selectedEvent.allDay && (
                <div className="flex items-center justify-between border-b border-glass-border/50 pb-2">
                  <span className="text-text-secondary">Time</span>
                  <span className="font-semibold text-white">
                    {new Date(selectedEvent.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                    {new Date(selectedEvent.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              )}
              {selectedEvent.description && (
                <div className="pt-2">
                  <span className="text-text-secondary block mb-1">Notes</span>
                  <p className="text-white/80 text-xs italic">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <button className="btn-glass w-full justify-center" onClick={() => setShowEventModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
