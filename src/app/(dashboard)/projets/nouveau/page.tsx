"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Send, Check } from "lucide-react";

const STEPS = ["Basic Info", "Schedule", "Team", "Budget", "Marketing", "Review"];

interface Room { id: string; name: string; capacity: number; }
interface Staff { id: string; name: string; role: string; }

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", type: "COURSE" as string,
    targetAgeGroup: "", language: "Arabic",
    startDate: "", endDate: "",
    registrationFee: 0, projectedCosts: 0, revenueEstimate: 0, maxCapacity: 20,
    publicDescription: "", promoNotes: "",
    enrollmentOpen: "", enrollmentClose: "",
    leadInstructorId: "", coInstructorIds: [] as string[], helperIds: [] as string[],
    roomId: "", sessionTimes: "",
  });

  useEffect(() => {
    fetch("/api/rooms").then(r => r.json()).then(setRooms).catch(() => {});
    fetch("/api/personnel/list").then(r => r.json()).then(setStaffList).catch(() => {});
  }, []);

  function updateField(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave(submit = false) {
    if (!form.title) {
      alert("Please provide a project title before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, submit }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(submit ? "Project submitted successfully!" : "Draft saved successfully!");
        router.push(`/projets/${data.id}`);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "Failed to save project"}`);
      }
    } catch (e) { 
      console.error(e);
      alert("An unexpected error occurred while saving.");
    }
    finally { setSaving(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="header-hero mb-2">New Project</h1>
        <p className="text-text-secondary text-sm">Fill in the details to draft a new project proposal</p>
      </div>

      <div className="flex items-center gap-2 mb-10 overflow-x-auto custom-scrollbar pb-2">
        {STEPS.map((label, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <div key={i} className="flex items-center">
              <div 
                className={`flex items-center gap-2 cursor-pointer transition-colors ${isActive ? "" : isCompleted ? "opacity-100" : "opacity-50"}`}
                onClick={() => isCompleted && setCurrentStep(i)}
              >
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
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Project Title <span className="text-accent-yellow">*</span></label>
                <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" value={form.title} onChange={e => updateField("title", e.target.value)} placeholder="E.g. Arabic for Beginners" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Description</label>
                <textarea className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors min-h-[120px]" value={form.description} onChange={e => updateField("description", e.target.value)} placeholder="Describe the project objectives and scope..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Type <span className="text-accent-yellow">*</span></label>
                  <select className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none" value={form.type} onChange={e => updateField("type", e.target.value)}>
                    <option value="COURSE" className="bg-background text-white">Course</option>
                    <option value="WORKSHOP" className="bg-background text-white">Workshop</option>
                    <option value="ACTIVITY" className="bg-background text-white">Activity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Target Age Group</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" value={form.targetAgeGroup} onChange={e => updateField("targetAgeGroup", e.target.value)} placeholder="E.g. 6-10 years" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Language of Instruction</label>
                <select className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none" value={form.language} onChange={e => updateField("language", e.target.value)}>
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
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Start Date</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors color-scheme-dark" type="date" value={form.startDate} onChange={e => updateField("startDate", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">End Date</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors color-scheme-dark" type="date" value={form.endDate} onChange={e => updateField("endDate", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Room</label>
                <select className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none" value={form.roomId} onChange={e => updateField("roomId", e.target.value)}>
                  <option value="" className="bg-background text-white">Select a room</option>
                  {rooms.map(r => <option key={r.id} value={r.id} className="bg-background text-white">{r.name} (capacity: {r.capacity})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Session Times</label>
                <textarea className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors min-h-[100px]" value={form.sessionTimes} onChange={e => updateField("sessionTimes", e.target.value)} placeholder="E.g. Monday and Wednesday, 4:00 PM - 5:30 PM" />
                <span className="text-xs text-text-secondary mt-1.5 block">Describe the recurring days and times</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Team</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Lead Instructor</label>
                <select className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors appearance-none" value={form.leadInstructorId} onChange={e => updateField("leadInstructorId", e.target.value)}>
                  <option value="" className="bg-background text-white">Select an instructor</option>
                  {staffList.map(s => <option key={s.id} value={s.id} className="bg-background text-white">{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Team Notes</label>
                <textarea className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors min-h-[120px]" placeholder="Additional notes about team composition, co-instructors, or helpers..." />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Budget</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Registration Fee (per student)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className="w-full bg-glass-surface border border-glass-border rounded-xl pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors" type="number" min="0" step="0.01" value={form.registrationFee} onChange={e => updateField("registrationFee", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Projected Costs</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className="w-full bg-glass-surface border border-glass-border rounded-xl pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors" type="number" min="0" step="0.01" value={form.projectedCosts} onChange={e => updateField("projectedCosts", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Estimated Revenue (External funding)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-semibold">$</span>
                    <input className="w-full bg-glass-surface border border-glass-border rounded-xl pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors" type="number" min="0" step="0.01" value={form.revenueEstimate} onChange={e => updateField("revenueEstimate", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Maximum Capacity</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors" type="number" min="1" value={form.maxCapacity} onChange={e => updateField("maxCapacity", parseInt(e.target.value) || 20)} />
                </div>
              </div>
              
              {form.registrationFee > 0 && form.maxCapacity > 0 && (
                <div className="p-4 rounded-xl bg-accent-lime/10 border border-accent-lime/30 flex items-center justify-between">
                  <span className="text-sm font-semibold text-accent-lime">Maximum potential revenue from fees</span>
                  <span className="text-lg font-bold text-white">{(form.registrationFee * form.maxCapacity).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6">Marketing & Enrollment</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Public Description</label>
                <textarea className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors min-h-[120px]" value={form.publicDescription} onChange={e => updateField("publicDescription", e.target.value)} placeholder="Description formatted for public display..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Promotional Notes</label>
                <textarea className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors min-h-[80px]" value={form.promoNotes} onChange={e => updateField("promoNotes", e.target.value)} placeholder="Internal notes for the promotion team..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Enrollment Opens</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors color-scheme-dark" type="date" value={form.enrollmentOpen} onChange={e => updateField("enrollmentOpen", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Enrollment Closes</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-cyan transition-colors color-scheme-dark" type="date" value={form.enrollmentClose} onChange={e => updateField("enrollmentClose", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-2">Review</h3>
            <p className="text-sm text-text-secondary mb-6">Verify the information before submitting.</p>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
              {[
                ["Title", form.title || "—"],
                ["Type", form.type === "COURSE" ? "Course" : form.type === "WORKSHOP" ? "Workshop" : "Activity"],
                ["Age Group", form.targetAgeGroup || "—"],
                ["Dates", `${form.startDate || "—"} → ${form.endDate || "—"}`],
                ["Registration Fee", form.registrationFee.toLocaleString("en-CA", { style: "currency", currency: "CAD" })],
                ["Capacity", `${form.maxCapacity} students`],
              ].map(([label, val], idx) => (
                <div key={label} className={`flex justify-between items-center p-4 ${idx !== 0 ? 'border-t border-white/5' : ''}`}>
                  <span className="text-sm font-semibold text-text-secondary">{label}</span>
                  <span className="text-sm font-bold text-white text-right max-w-[60%] truncate">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-glass-border">
          <button className="btn-glass" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
            <ArrowLeft size={16} /> Previous
          </button>
          <div className="flex gap-3">
            <button className="btn-glass" onClick={() => handleSave(false)} disabled={saving || !form.title}>
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Save Draft
            </button>
            {currentStep < STEPS.length - 1 ? (
              <button className="btn-glass btn-glass-primary" onClick={() => setCurrentStep(currentStep + 1)}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn-glass bg-accent-lime/20 text-accent-lime border-accent-lime/30 hover:bg-accent-lime/30" onClick={() => handleSave(true)} disabled={saving || !form.title}>
                {saving ? <div className="w-4 h-4 border-2 border-accent-lime/30 border-t-accent-lime rounded-full animate-spin" /> : <Send size={16} strokeWidth={2.5} />} Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .color-scheme-dark {
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
}
