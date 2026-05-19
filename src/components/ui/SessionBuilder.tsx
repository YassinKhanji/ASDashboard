"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, AlertTriangle, AlertCircle, Clock, Eye, Loader2, Repeat } from "lucide-react";

// ─── Types ──────────────────────────────────────────────

export interface SessionPattern {
  days: number[];       // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string;    // "HH:MM" in 24h
  endTime: string;      // "HH:MM" in 24h
  frequency?: "weekly" | "biweekly" | "monthly" | "custom";
  customIntervalDays?: number;
}

interface ConflictInfo {
  projectId: string;
  projectName: string;
  projectStatus: string;
  roomName: string;
  day: string;
  dayNumber: number;
  time: string;
  sessionId: string;
}

interface ConflictResult {
  hardConflicts: ConflictInfo[];
  softConflicts: ConflictInfo[];
}

interface SessionBuilderProps {
  sessions: SessionPattern[];
  onChange: (sessions: SessionPattern[]) => void;
  roomId: string;
  startDate: string;
  endDate: string;
  excludeProjectId?: string;
  disabled?: boolean;
}

// ─── Constants ──────────────────────────────────────────

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const DAY_NAMES: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

// Generate time options in 30-min increments from 07:00 to 22:00
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 7; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break;
      const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

// ─── Component ──────────────────────────────────────────

export default function SessionBuilder({
  sessions,
  onChange,
  roomId,
  startDate,
  endDate,
  excludeProjectId,
  disabled: externalDisabled,
}: SessionBuilderProps) {

  const [conflicts, setConflicts] = useState<ConflictResult>({ hardConflicts: [], softConflicts: [] });
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if the section should be gated
  const isGated = !startDate || !endDate;
  const isDisabled = externalDisabled || isGated;

  // ─── Conflict checking with debounce ──────────────────

  const checkConflicts = useCallback(async () => {
    if (!roomId || !startDate || !endDate || sessions.length === 0) {
      setConflicts({ hardConflicts: [], softConflicts: [] });
      return;
    }

    // Only check if sessions have valid data
    const validSessions = sessions.filter(s => s.days.length > 0 && s.startTime && s.endTime);
    if (validSessions.length === 0) {
      setConflicts({ hardConflicts: [], softConflicts: [] });
      return;
    }

    setCheckingConflicts(true);
    try {
      const res = await fetch("/api/conflicts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          startDate,
          endDate,
          sessions: validSessions,
          excludeProjectId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConflicts(data);
      }
    } catch (e) {
      console.error("Conflict check failed:", e);
    } finally {
      setCheckingConflicts(false);
    }
  }, [roomId, startDate, endDate, sessions, excludeProjectId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(checkConflicts, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [checkConflicts]);

  // ─── Session mutation helpers ─────────────────────────

  function updateSession(index: number, patch: Partial<SessionPattern>) {
    const updated = sessions.map((s, i) => i === index ? { ...s, ...patch } : s);
    onChange(updated);
  }

  function toggleDay(index: number, day: number) {
    const current = sessions[index].days;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    updateSession(index, { days: updated });
  }

  function addSession() {
    onChange([...sessions, { days: [], startTime: "16:00", endTime: "17:30", frequency: "weekly" }]);
  }

  function removeSession(index: number) {
    onChange(sessions.filter((_, i) => i !== index));
  }

  // ─── Validation helpers ───────────────────────────────

  function getRowErrors(session: SessionPattern): string[] {
    const errors: string[] = [];
    if (session.days.length === 0) errors.push("Select at least one day");
    if (session.startTime && session.endTime && session.startTime >= session.endTime) {
      errors.push("End time must be after start time");
    }
    if (session.frequency === "custom" && (!session.customIntervalDays || session.customIntervalDays < 1)) {
      errors.push("Set a valid interval (≥ 1 day)");
    }
    return errors;
  }

  const hasHardConflicts = conflicts.hardConflicts.length > 0;

  // ─── Frequency display helper ─────────────────────────

  function getFrequencyHint(session: SessionPattern): string | null {
    const freq = session.frequency || "weekly";
    switch (freq) {
      case "biweekly": return "Sessions repeat every 2 weeks";
      case "monthly": return "Sessions repeat on the first occurrence of each selected day per month";
      case "custom": return `Sessions repeat every ${session.customIntervalDays || "?"} days`;
      default: return null;
    }
  }

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-text-secondary">
          Session Schedule <span className="text-accent-yellow">*</span>
        </label>
        {checkingConflicts && (
          <span className="flex items-center gap-1.5 text-xs text-text-secondary animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Checking conflicts...
          </span>
        )}
      </div>

      {/* Gate message */}
      {isGated && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-text-secondary">
          <Clock size={18} className="shrink-0 opacity-60" />
          <p className="text-sm">
            Please select <strong className="text-white">Start Date</strong> and <strong className="text-white">End Date</strong> above before configuring sessions.
          </p>
        </div>
      )}

      {/* Hard conflict banner */}
      {hasHardConflicts && !isGated && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-400 mb-1">Scheduling Conflict Detected</p>
            <p className="text-xs text-red-300/80">
              This schedule conflicts with {conflicts.hardConflicts.length} approved session{conflicts.hardConflicts.length !== 1 ? "s" : ""}. 
              You cannot save or advance until conflicts are resolved.
            </p>
          </div>
        </div>
      )}

      {/* Session rows */}
      <div className={`space-y-3 ${isDisabled ? "opacity-40 pointer-events-none select-none" : ""}`}>
        {sessions.map((session, index) => {
          const errors = getRowErrors(session);
          const freq = session.frequency || "weekly";
          const frequencyHint = getFrequencyHint(session);
          // Find conflicts for this row
          const rowHardConflicts = conflicts.hardConflicts.filter(c =>
            session.days.includes(c.dayNumber)
          );
          const rowSoftConflicts = conflicts.softConflicts.filter(c =>
            session.days.includes(c.dayNumber)
          );

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border animate-in slide-in-from-left-4 duration-300 transition-colors ${
                rowHardConflicts.length > 0
                  ? "bg-red-500/5 border-red-500/30"
                  : rowSoftConflicts.length > 0
                  ? "bg-accent-yellow/5 border-accent-yellow/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {/* Day chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider mr-1 shrink-0">Days</span>
                {DAYS.map(day => {
                  const isSelected = session.days.includes(day.value);
                  const hasConflict = conflicts.hardConflicts.some(
                    c => c.dayNumber === day.value && session.days.includes(day.value)
                  );
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(index, day.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                        isSelected
                          ? hasConflict
                            ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                            : "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40 shadow-[0_0_8px_rgba(77,184,255,0.15)]"
                          : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>

              {/* Time pickers */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0">From</span>
                  <select
                    className="form-select text-sm h-[42px] flex-1 min-w-[110px]"
                    value={session.startTime}
                    onChange={e => updateSession(index, { startTime: e.target.value })}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <span className="text-text-secondary font-bold">—</span>
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0">To</span>
                  <select
                    className="form-select text-sm h-[42px] flex-1 min-w-[110px]"
                    value={session.endTime}
                    onChange={e => updateSession(index, { endTime: e.target.value })}
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Remove button */}
                {sessions.length > 1 && (
                  <button
                    type="button"
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    onClick={() => removeSession(index)}
                    title="Remove session"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Frequency selector */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Repeat size={14} className="text-text-secondary shrink-0" />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0">Frequency</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FREQUENCY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSession(index, { frequency: opt.value as SessionPattern["frequency"] })}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                        freq === opt.value
                          ? "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40"
                          : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Custom interval input */}
                {freq === "custom" && (
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-xs text-text-secondary">Every</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="w-16 bg-glass-surface border border-glass-border rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-accent-cyan transition-colors"
                      value={session.customIntervalDays || ""}
                      onChange={e => updateSession(index, { customIntervalDays: parseInt(e.target.value) || undefined })}
                      placeholder="7"
                    />
                    <span className="text-xs text-text-secondary">days</span>
                  </div>
                )}
              </div>

              {/* Frequency hint */}
              {frequencyHint && (
                <p className="text-[11px] text-text-secondary/70 mt-2 pl-0.5 italic">{frequencyHint}</p>
              )}

              {/* Validation errors */}
              {errors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {errors.map((err, i) => (
                    <span key={i} className="text-xs text-accent-yellow flex items-center gap-1">
                      <AlertCircle size={12} /> {err}
                    </span>
                  ))}
                </div>
              )}

              {/* Hard conflict warnings */}
              {rowHardConflicts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {rowHardConflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>
                        Conflict with <strong>{c.projectName}</strong> (Approved) — {c.day} {c.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Soft conflict warnings */}
              {rowSoftConflicts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {rowSoftConflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-accent-yellow bg-accent-yellow/10 rounded-lg px-3 py-2">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>
                        Potential conflict with <strong>{c.projectName}</strong> (Pending Approval)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add session button */}
      {!isDisabled && (
        <button
          type="button"
          className="btn-glass btn-glass-primary !py-2 !px-4 text-xs"
          onClick={addSession}
        >
          <Plus size={14} /> Add another session
        </button>
      )}

      {/* Info text */}
      {!isGated && (
        <span className="text-xs text-text-secondary mt-2 block">
          Each session will be automatically added to the calendar when the project is approved ({startDate || "..."} to {endDate || "..."}).
        </span>
      )}

      {/* View Available Times toggle */}
      {roomId && !isGated && (
        <button
          type="button"
          className="flex items-center gap-2 text-xs text-accent-cyan hover:underline mt-1"
          onClick={() => setShowAvailability(!showAvailability)}
        >
          <Eye size={14} />
          {showAvailability ? "Hide" : "View"} Available Times
        </button>
      )}

      {showAvailability && roomId && !isGated && (
        <AvailabilityPanel roomId={roomId} startDate={startDate} endDate={endDate} excludeProjectId={excludeProjectId} />
      )}
    </div>
  );
}

// ─── Availability Panel ─────────────────────────────────

function AvailabilityPanel({ roomId, startDate, endDate, excludeProjectId }: {
  roomId: string;
  startDate: string;
  endDate: string;
  excludeProjectId?: string;
}) {
  const [bookedSlots, setBookedSlots] = useState<{ day: number; startMinutes: number; endMinutes: number; project: string }[]>([]);
  const [tentativeSlots, setTentativeSlots] = useState<{ day: number; startMinutes: number; endMinutes: number; project: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(excludeProjectId ? { excludeProjectId } : {}),
    });

    fetch(`/api/rooms/${roomId}/availability?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setBookedSlots(
          (data.bookedSlots || []).map((s: any) => ({
            day: s.day,
            startMinutes: s.startMinutes,
            endMinutes: s.endMinutes,
            project: s.projectName,
          }))
        );
        setTentativeSlots(
          (data.tentativeSlots || []).map((s: any) => ({
            day: s.day,
            startMinutes: s.startMinutes,
            endMinutes: s.endMinutes,
            project: s.projectName,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId, startDate, endDate, excludeProjectId]);

  const HOURS_DISPLAY = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  function getSlotStatus(day: number, hour: number): { status: "available" | "booked" | "tentative"; project?: string } {
    const slotStart = hour * 60;
    const slotEnd = (hour + 1) * 60;

    // Check booked first (higher priority)
    const booked = bookedSlots.find(
      s => s.day === day && s.startMinutes < slotEnd && s.endMinutes > slotStart
    );
    if (booked) return { status: "booked", project: booked.project };

    // Check tentative
    const tentative = tentativeSlots.find(
      s => s.day === day && s.startMinutes < slotEnd && s.endMinutes > slotStart
    );
    if (tentative) return { status: "tentative", project: tentative.project };

    return { status: "available" };
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Loader2 size={16} className="animate-spin text-text-secondary" />
        <span className="text-xs text-text-secondary ml-2">Loading availability...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <Eye size={14} className="text-accent-cyan" />
        <span className="text-xs font-bold text-white">Room Availability</span>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-[10px] border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-2 text-text-secondary text-left font-semibold">Day</th>
              {HOURS_DISPLAY.map(h => (
                <th key={h} className="p-1.5 text-text-secondary font-semibold text-center">
                  {h > 12 ? h - 12 : h}{h >= 12 ? "p" : "a"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day.value} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-2 text-white font-bold">{day.label}</td>
                {HOURS_DISPLAY.map(h => {
                  const { status, project } = getSlotStatus(day.value, h);
                  const title = status === "booked"
                    ? `Booked: ${project}`
                    : status === "tentative"
                    ? `Tentative: ${project} (pending approval)`
                    : "Available";

                  return (
                    <td key={h} className="p-1" title={title}>
                      <div className={`w-full h-5 rounded-sm transition-colors ${
                        status === "booked"
                          ? "bg-red-500/30 border border-red-500/40"
                          : status === "tentative"
                          ? "bg-amber-500/25 border border-amber-500/35"
                          : "bg-accent-lime/15 border border-accent-lime/20"
                      }`} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-white/10 flex items-center gap-4 text-[10px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-accent-lime/15 border border-accent-lime/20" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500/25 border border-amber-500/35" /> Tentative
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/40" /> Booked
        </span>
      </div>
    </div>
  );
}

// Export the hasHardConflicts check utility
export function useConflictCheck() {
  const [conflicts, setConflicts] = useState<ConflictResult>({ hardConflicts: [], softConflicts: [] });

  const checkConflicts = async (
    roomId: string,
    startDate: string,
    endDate: string,
    sessions: SessionPattern[],
    excludeProjectId?: string
  ): Promise<ConflictResult> => {
    if (!roomId || !startDate || !endDate || sessions.length === 0) {
      return { hardConflicts: [], softConflicts: [] };
    }

    const validSessions = sessions.filter(s => s.days.length > 0 && s.startTime && s.endTime);
    if (validSessions.length === 0) {
      return { hardConflicts: [], softConflicts: [] };
    }

    try {
      const res = await fetch("/api/conflicts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, startDate, endDate, sessions: validSessions, excludeProjectId }),
      });
      if (res.ok) {
        const data = await res.json();
        setConflicts(data);
        return data;
      }
    } catch (e) {
      console.error("Conflict check failed:", e);
    }
    return { hardConflicts: [], softConflicts: [] };
  };

  return { conflicts, checkConflicts };
}
