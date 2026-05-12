"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Save, Check, AlertTriangle } from "lucide-react";
import SessionBuilder, { SessionPattern } from "@/components/ui/SessionBuilder";

const STEPS = ["Basic Info", "Schedule", "Team", "Budget", "Marketing"];

interface Room { id: string; name: string; capacity: number; }
interface Staff { id: string; name: string; role: string; }

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [conflictBlock, setConflictBlock] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "COURSE",
    targetAgeGroup: "", language: "Arabic",
    startDate: "", endDate: "",
    registrationFee: 0, projectedCosts: 0, revenueEstimate: 0,
    actualCosts: 0, actualRevenue: 0,
    maxCapacity: 20,
    publicDescription: "", promoNotes: "",
    enrollmentOpen: "", enrollmentClose: "",
    roomId: "",
    sessionPatterns: [{ days: [], startTime: "16:00", endTime: "17:30" }] as SessionPattern[],
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projets/${id}`).then(r => r.json()),
      fetch("/api/rooms").then(r => r.json()),
      fetch("/api/personnel/list").then(r => r.json()),
    ]).then(([project, roomsData, staffData]) => {
      setRooms(roomsData);
      setStaffList(staffData);

      // Parse session patterns from stored JSON
      let sessionPatterns: SessionPattern[] = [{ days: [], startTime: "16:00", endTime: "17:30" }];
      if (project.sessionPatterns && Array.isArray(project.sessionPatterns)) {
        sessionPatterns = project.sessionPatterns;
      } else if (project.sessionPatternsJson) {
        try {
          const parsed = JSON.parse(project.sessionPatternsJson);
          if (Array.isArray(parsed) && parsed.length > 0) sessionPatterns = parsed;
        } catch {}
      }

      setForm({
        title: project.title || "",
        description: project.description || "",
        type: project.type || "COURSE",
        targetAgeGroup: project.targetAgeGroup || "",
        language: project.language || "Arabic",
        startDate: project.startDate ? project.startDate.split("T")[0] : "",
        endDate: project.endDate ? project.endDate.split("T")[0] : "",
        registrationFee: project.registrationFee || 0,
        projectedCosts: project.projectedCosts || 0,
        revenueEstimate: project.revenueEstimate || 0,
        actualCosts: project.actualCosts || 0,
        actualRevenue: project.actualRevenue || 0,
        maxCapacity: project.maxCapacity || 20,
        publicDescription: project.publicDescription || "",
        promoNotes: project.promoNotes || "",
        enrollmentOpen: project.enrollmentOpen ? project.enrollmentOpen.split("T")[0] : "",
        enrollmentClose: project.enrollmentClose ? project.enrollmentClose.split("T")[0] : "",
        roomId: project.roomId || "",
        sessionPatterns,
      });
      setLoading(false);
    }).catch(() => {
      setError("Project not found");
      setLoading(false);
    });
  }, [id]);

  function updateField(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // ─── Conflict validation before save/next ─────────────

  async function validateConflicts(): Promise<boolean> {
    if (!form.roomId || !form.startDate || !form.endDate) return true;
    
    const validSessions = form.sessionPatterns.filter(s => s.days.length > 0 && s.startTime && s.endTime && s.startTime < s.endTime);
    if (validSessions.length === 0) return true;

    try {
      const res = await fetch("/api/conflicts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: form.roomId,
          startDate: form.startDate,
          endDate: form.endDate,
          sessions: validSessions,
          excludeProjectId: id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hardConflicts?.length > 0) {
          const conflictNames = [...new Set(data.hardConflicts.map((c: any) => c.projectName))].join(", ");
          alert(`Cannot proceed — scheduling conflict with approved project(s): ${conflictNames}. Please resolve the conflicts in the Schedule step.`);
          setConflictBlock(true);
          return false;
        }
      }
    } catch (e) {
      console.error("Conflict check failed:", e);
    }
    setConflictBlock(false);
    return true;
  }

  async function handleNext() {
    if (currentStep === 1) {
      const ok = await validateConflicts();
      if (!ok) return;
    }
    setCurrentStep(currentStep + 1);
  }

  async function handleSave() {
    // Validate conflicts before saving
    if (form.roomId && form.startDate && form.endDate) {
      const ok = await validateConflicts();
      if (!ok) return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/projets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push(`/projets/${id}`);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle size={48} className="text-[#f5c518] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
        <Link href="/projets" className="btn-glass btn-glass-primary mt-4">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
      </div>
    );
  }

  const inputClass = "w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors";
  const selectClass = "w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none";
  const labelClass = "block text-sm font-semibold text-text-secondary mb-1.5";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/projets/${id}`} className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="header-hero mb-1">Edit Project</h1>
          <p className="text-text-secondary text-sm">{form.title}</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto custom-scrollbar pb-2">
        {STEPS.map((label, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 cursor-pointer transition-colors ${isActive ? "" : isCompleted ? "opacity-100" : "opacity-50"}`}
                onClick={() => setCurrentStep(i)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isActive ? "bg-accent-cyan text-background shadow-[0_0_15px_rgba(77,184,255,0.4)]" : isCompleted ? "bg-accent-lime text-background" : "bg-white/10 text-white"}`}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : i + 1}
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ${isActive ? "text-accent-cyan" : isCompleted ? "text-white" : "text-text-secondary"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-[2px] mx-4 transition-colors ${isCompleted ? "bg-accent-lime" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card">
        {currentStep === 0 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Basic Information</h3>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Project Title <span className="text-accent-yellow">*</span></label>
                <input className={inputClass} value={form.title} onChange={e => updateField("title", e.target.value)} placeholder="E.g. Arabic for Beginners" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={`${inputClass} min-h-[120px]`} value={form.description} onChange={e => updateField("description", e.target.value)} placeholder="Describe the project objectives and scope..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Type <span className="text-accent-yellow">*</span></label>
                  <select className={selectClass} value={form.type} onChange={e => updateField("type", e.target.value)}>
                    <option value="COURSE" className="bg-background text-white">Course</option>
                    <option value="WORKSHOP" className="bg-background text-white">Workshop</option>
                    <option value="ACTIVITY" className="bg-background text-white">Activity</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Target Age Group</label>
                  <input className={inputClass} value={form.targetAgeGroup} onChange={e => updateField("targetAgeGroup", e.target.value)} placeholder="E.g. 6-10 years" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Language of Instruction</label>
                <select className={selectClass} value={form.language} onChange={e => updateField("language", e.target.value)}>
                  <option value="Arabic" className="bg-background text-white">Arabic</option>
                  <option value="French" className="bg-background text-white">French</option>
                  <option value="English" className="bg-background text-white">English</option>
                  <option value="Bilingual" className="bg-background text-white">Bilingual</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Schedule</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Start Date <span className="text-accent-yellow">*</span></label>
                  <input className={`${inputClass} color-scheme-dark`} type="date" value={form.startDate} onChange={e => updateField("startDate", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>End Date <span className="text-accent-yellow">*</span></label>
                  <input className={`${inputClass} color-scheme-dark`} type="date" value={form.endDate} onChange={e => updateField("endDate", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Room <span className="text-accent-yellow">*</span></label>
                <select className={selectClass} value={form.roomId} onChange={e => updateField("roomId", e.target.value)}>
                  <option value="" className="bg-background text-white">Select a room</option>
                  {rooms.map(r => <option key={r.id} value={r.id} className="bg-background text-white">{r.name} (capacity: {r.capacity})</option>)}
                </select>
              </div>

              {/* Session Builder */}
              <SessionBuilder
                sessions={form.sessionPatterns}
                onChange={(sessions) => updateField("sessionPatterns", sessions)}
                roomId={form.roomId}
                startDate={form.startDate}
                endDate={form.endDate}
                excludeProjectId={id}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Team</h3>
            <p className="text-sm text-text-secondary mb-4">Staff assignments are managed from the project detail page after saving.</p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Budget</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Registration Fee (per student)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className={`${inputClass} pl-8`} type="number" min="0" step="0.01" value={form.registrationFee} onChange={e => updateField("registrationFee", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Projected Costs</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className={`${inputClass} pl-8`} type="number" min="0" step="0.01" value={form.projectedCosts} onChange={e => updateField("projectedCosts", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Revenue Estimate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className={`${inputClass} pl-8`} type="number" min="0" step="0.01" value={form.revenueEstimate} onChange={e => updateField("revenueEstimate", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Maximum Capacity</label>
                  <input className={inputClass} type="number" min="1" value={form.maxCapacity} onChange={e => updateField("maxCapacity", parseInt(e.target.value) || 20)} />
                </div>
              </div>

              <h4 className="text-sm font-bold text-white mt-6 mb-3 pt-4 border-t border-glass-border">Actual Figures</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Actual Costs</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className={`${inputClass} pl-8`} type="number" min="0" step="0.01" value={form.actualCosts} onChange={e => updateField("actualCosts", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Actual Revenue</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className={`${inputClass} pl-8`} type="number" min="0" step="0.01" value={form.actualRevenue} onChange={e => updateField("actualRevenue", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Marketing & Enrollment</h3>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Public Description</label>
                <textarea className={`${inputClass} min-h-[120px]`} value={form.publicDescription} onChange={e => updateField("publicDescription", e.target.value)} placeholder="Description formatted for public display..." />
              </div>
              <div>
                <label className={labelClass}>Promotional Notes</label>
                <textarea className={`${inputClass} min-h-[80px]`} value={form.promoNotes} onChange={e => updateField("promoNotes", e.target.value)} placeholder="Internal notes for the promotion team..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Enrollment Opens</label>
                  <input className={`${inputClass} color-scheme-dark`} type="date" value={form.enrollmentOpen} onChange={e => updateField("enrollmentOpen", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Enrollment Closes</label>
                  <input className={`${inputClass} color-scheme-dark`} type="date" value={form.enrollmentClose} onChange={e => updateField("enrollmentClose", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-glass-border">
          <button className="btn-glass" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
            <ArrowLeft size={16} /> Previous
          </button>
          <div className="flex gap-3">
            <button className="btn-glass btn-glass-primary" onClick={handleSave} disabled={saving}>
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Save Changes
            </button>
            {currentStep < STEPS.length - 1 && (
              <button className="btn-glass" onClick={handleNext}>
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .color-scheme-dark { color-scheme: dark; }
      `}</style>
    </div>
  );
}
