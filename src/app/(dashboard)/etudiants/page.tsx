"use client";

import { useState, useEffect } from "react";
import { Plus, Users, X, AlertTriangle } from "lucide-react";

interface Student {
  id: string; firstName: string; lastName: string;
  parentName: string | null; parentEmail: string | null; parentPhone: string | null;
  notes: string | null; flags: string | null; createdAt: string;
  _count: { enrollments: number };
}

export default function EtudiantsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", parentName: "", parentEmail: "", parentPhone: "", notes: "", flags: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/etudiants").then(r => r.json()).then(setStudents).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/etudiants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const student = await res.json();
        setStudents(prev => [...prev, { ...student, _count: { enrollments: 0 } }]);
        setShowModal(false);
        setForm({ firstName: "", lastName: "", parentName: "", parentEmail: "", parentPhone: "", notes: "", flags: "" });
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="header-hero mb-2">Students</h1>
          <p className="text-text-secondary text-sm">
            {students.length} student{students.length !== 1 ? "s" : ""} in the directory
          </p>
        </div>
        <button className="btn-glass btn-glass-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} strokeWidth={2.5} /> New student
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-text-secondary">
          <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Users size={32} className="text-text-secondary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No students yet</h3>
          <p className="text-text-secondary mb-6">Add your first student to the directory.</p>
          <button className="btn-glass btn-glass-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add student
          </button>
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-glass-border/50 bg-white/5">
                  <th className="px-6 py-4 label-subtle">Name</th>
                  <th className="px-6 py-4 label-subtle">Parent / Guardian</th>
                  <th className="px-6 py-4 label-subtle">Contact</th>
                  <th className="px-6 py-4 label-subtle">Projects</th>
                  <th className="px-6 py-4 label-subtle">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                      {s.parentName || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-text-secondary">
                      {s.parentEmail && <div className="text-white mb-0.5">{s.parentEmail}</div>}
                      {s.parentPhone && <div>{s.parentPhone}</div>}
                      {(!s.parentEmail && !s.parentPhone) && "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="glass-badge badge-lime">{s._count.enrollments} Enrolled</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-secondary max-w-[200px] truncate">
                      {s.flags && (
                        <span className="inline-flex items-center gap-1 glass-badge badge-yellow mr-2 !px-2 !py-0.5">
                          <AlertTriangle size={10} /> {s.flags}
                        </span>
                      )}
                      <span className="truncate" title={s.notes || ""}>{s.notes || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="glass-card w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">New student</h3>
              <button className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">First name <span className="text-accent-yellow">*</span></label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Last name <span className="text-accent-yellow">*</span></label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Parent / Guardian</label>
                <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" value={form.parentName} onChange={e => setForm(p => ({ ...p, parentName: e.target.value }))} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Parent email</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" type="email" value={form.parentEmail} onChange={e => setForm(p => ({ ...p, parentEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1.5">Parent phone</label>
                  <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" value={form.parentPhone} onChange={e => setForm(p => ({ ...p, parentPhone: e.target.value }))} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Notes</label>
                <textarea className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors min-h-[100px]" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Important notes..." />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Flags</label>
                <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" value={form.flags} onChange={e => setForm(p => ({ ...p, flags: e.target.value }))} placeholder="e.g. Peanut allergy" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-border mt-6">
                <button type="button" className="btn-glass" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-glass btn-glass-primary" disabled={saving}>{saving ? "Saving..." : "Add student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
