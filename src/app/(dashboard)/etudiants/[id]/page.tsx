"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit3, Save, X, Trash2, Plus, UserCheck,
  BookOpen, Calendar, Phone, Mail, User, AlertTriangle,
  FileText, CheckCircle2, Clock, XCircle, MinusCircle
} from "lucide-react";
import { formatDate, formatDateTime, calculateAge, PROJECT_STATUS_LABELS, ATTENDANCE_STATUS_LABELS, ENROLLMENT_STATUS_LABELS } from "@/lib/utils";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  notes: string | null;
  flags: string | null;
  createdAt: string;
  enrollments: Array<{
    id: string;
    status: string;
    enrolledAt: string;
    project: { id: string; title: string; type: string; status: string };
  }>;
  attendance: Array<{
    id: string;
    status: string;
    session: {
      id: string;
      startTime: string;
      endTime: string;
      project: { title: string };
      room: { name: string };
    };
  }>;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "enrollments" | "attendance">("profile");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "",
    parentName: "", parentEmail: "", parentPhone: "",
    notes: "", flags: "",
  });

  useEffect(() => {
    fetchStudent();
  }, [id]);

  async function fetchStudent() {
    try {
      const res = await fetch(`/api/etudiants/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setStudent(data);
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
        parentName: data.parentName || "",
        parentEmail: data.parentEmail || "",
        parentPhone: data.parentPhone || "",
        notes: data.notes || "",
        flags: data.flags || "",
      });
    } catch {
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/etudiants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent((prev) => prev ? { ...prev, ...updated } : prev);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/etudiants/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/etudiants");
    } catch {
      // Silent fail
    }
  }

  async function handleEnroll() {
    if (!selectedProjectId) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/etudiants/${id}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });
      if (res.ok) {
        setShowEnrollModal(false);
        setSelectedProjectId("");
        fetchStudent();
      }
    } finally {
      setEnrolling(false);
    }
  }

  async function handleUnenroll(projectId: string) {
    try {
      const res = await fetch(`/api/etudiants/${id}/enrollments?projectId=${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchStudent();
    } catch {
      // Silent fail
    }
  }

  async function openEnrollModal() {
    const res = await fetch("/api/projets");
    if (res.ok) {
      const all = await res.json();
      const enrolledIds = new Set(student?.enrollments.map(e => e.project.id));
      setProjects(all.filter((p: Project) => !enrolledIds.has(p.id) && ["ACTIVE", "APPROVED"].includes(p.status)));
    }
    setShowEnrollModal(true);
  }

  function getAttendanceIcon(status: string) {
    switch (status) {
      case "PRESENT": return <CheckCircle2 size={14} className="text-[#a8e063]" />;
      case "ABSENT": return <XCircle size={14} className="text-red-400" />;
      case "LATE": return <Clock size={14} className="text-[#f5c518]" />;
      case "EXCUSED": return <MinusCircle size={14} className="text-[#4db8ff]" />;
      default: return null;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle size={48} className="text-[#f5c518] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Student not found</h2>
        <Link href="/etudiants" className="btn-glass btn-glass-primary mt-4">
          <ArrowLeft size={16} /> Back to Students
        </Link>
      </div>
    );
  }

  const age = student.dateOfBirth ? calculateAge(student.dateOfBirth) : null;
  const attendanceStats = {
    total: student.attendance.length,
    present: student.attendance.filter(a => a.status === "PRESENT").length,
    absent: student.attendance.filter(a => a.status === "ABSENT").length,
    late: student.attendance.filter(a => a.status === "LATE").length,
    excused: student.attendance.filter(a => a.status === "EXCUSED").length,
  };
  const attendanceRate = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/etudiants" className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="header-hero">{student.firstName} {student.lastName}</h1>
            <p className="text-text-secondary text-sm">
              {age !== null ? `${age} years old` : "Age not set"} · Enrolled since {formatDate(student.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="btn-glass btn-glass-primary">
                <Save size={16} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditing(false)} className="btn-glass">
                <X size={16} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-glass">
                <Edit3 size={16} /> Edit
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="btn-glass text-red-400 hover:text-red-300">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-full overflow-x-auto no-scrollbar">
        {(["profile", "enrollments", "attendance"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
              activeTab === tab
                ? "bg-accent-cyan text-black shadow-[0_0_15px_rgba(77,184,255,0.4)]"
                : "text-text-secondary hover:text-white hover:bg-white/10"
            }`}
          >
            {tab === "profile" ? "Profile" : tab === "enrollments" ? `Enrollments (${student.enrollments.length})` : `Attendance (${attendanceRate}%)`}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Info */}
          <div className="glass-card">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <User size={16} className="text-[#4db8ff]" /> Student Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-subtle block mb-1">First Name</label>
                  {editing ? (
                    <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                  ) : (
                    <p className="text-white font-medium">{student.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="label-subtle block mb-1">Last Name</label>
                  {editing ? (
                    <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                  ) : (
                    <p className="text-white font-medium">{student.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="label-subtle block mb-1">Date of Birth</label>
                {editing ? (
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px] color-scheme-dark" />
                ) : (
                  <p className="text-white font-medium">{student.dateOfBirth ? `${formatDate(student.dateOfBirth)} (${age} years)` : "Not set"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Parent/Guardian */}
          <div className="glass-card">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Phone size={16} className="text-[#f5c518]" /> Parent / Guardian
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label-subtle block mb-1">Name</label>
                {editing ? (
                  <input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                ) : (
                  <p className="text-white font-medium">{student.parentName || "Not set"}</p>
                )}
              </div>
              <div>
                <label className="label-subtle block mb-1">Email</label>
                {editing ? (
                  <input type="email" value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                ) : (
                  <p className="text-white font-medium flex items-center gap-2">
                    {student.parentEmail ? <><Mail size={14} className="text-text-secondary" /> {student.parentEmail}</> : "Not set"}
                  </p>
                )}
              </div>
              <div>
                <label className="label-subtle block mb-1">Phone</label>
                {editing ? (
                  <input value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                ) : (
                  <p className="text-white font-medium flex items-center gap-2">
                    {student.parentPhone ? <><Phone size={14} className="text-text-secondary" /> {student.parentPhone}</> : "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes & Flags */}
          <div className="glass-card md:col-span-2">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#a8e063]" /> Notes & Flags
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-subtle block mb-1">Notes</label>
                {editing ? (
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 resize-none min-h-[100px]" />
                ) : (
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{student.notes || "No notes"}</p>
                )}
              </div>
              <div>
                <label className="label-subtle block mb-1">Flags (allergies, accommodations)</label>
                {editing ? (
                  <textarea value={form.flags} onChange={e => setForm(f => ({ ...f, flags: e.target.value }))} rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 resize-none min-h-[100px]" />
                ) : (
                  <p className="text-white/80 text-sm whitespace-pre-wrap">
                    {student.flags ? (
                      <span className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-[#f5c518] mt-0.5 shrink-0" />
                        {student.flags}
                      </span>
                    ) : "No flags"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === "enrollments" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold">Enrolled Projects</h3>
            <button onClick={openEnrollModal} className="btn-glass btn-glass-primary text-xs">
              <Plus size={14} /> Enroll in Project
            </button>
          </div>
          {student.enrollments.length === 0 ? (
            <div className="glass-card text-center py-12">
              <BookOpen size={32} className="mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary">Not enrolled in any projects</p>
            </div>
          ) : (
            <div className="space-y-3">
              {student.enrollments.map(e => (
                <div key={e.id} className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-[#4db8ff]" />
                    </div>
                    <div>
                      <Link href={`/projets/${e.project.id}`} className="font-bold text-white hover:text-accent-cyan transition-colors">
                        {e.project.title}
                      </Link>
                      <div className="text-xs text-text-secondary mt-0.5">
                        Enrolled {formatDate(e.enrolledAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`glass-badge ${
                      e.status === "CONFIRMED" ? "badge-lime" : e.status === "WAITLIST" ? "badge-yellow" : "badge-white"
                    }`}>
                      {(ENROLLMENT_STATUS_LABELS as Record<string, string>)[e.status] || e.status}
                    </span>
                    <button
                      onClick={() => handleUnenroll(e.project.id)}
                      className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-white/10 transition-colors"
                      title="Remove enrollment"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total", value: attendanceStats.total, color: "text-white" },
              { label: "Present", value: attendanceStats.present, color: "text-[#a8e063]" },
              { label: "Absent", value: attendanceStats.absent, color: "text-red-400" },
              { label: "Late", value: attendanceStats.late, color: "text-[#f5c518]" },
              { label: "Excused", value: attendanceStats.excused, color: "text-[#4db8ff]" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {student.attendance.length === 0 ? (
            <div className="glass-card text-center py-12">
              <Calendar size={32} className="mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary">No attendance records</p>
            </div>
          ) : (
            <div className="glass-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-glass-border/50 bg-white/5">
                      <th className="px-6 py-3 label-subtle">Date</th>
                      <th className="px-6 py-3 label-subtle">Project</th>
                      <th className="px-6 py-3 label-subtle">Room</th>
                      <th className="px-6 py-3 label-subtle">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/50">
                    {student.attendance.map(a => (
                      <tr key={a.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3 text-sm text-white">{formatDateTime(a.session.startTime)}</td>
                        <td className="px-6 py-3 text-sm text-white font-medium">{a.session.project.title}</td>
                        <td className="px-6 py-3 text-sm text-text-secondary">{a.session.room.name}</td>
                        <td className="px-6 py-3">
                          <span className="flex items-center gap-1.5 text-sm">
                            {getAttendanceIcon(a.status)}
                            {(ATTENDANCE_STATUS_LABELS as Record<string, string>)[a.status] || a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-b-none sm:rounded-b-[24px] max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">Enroll in Project</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="text-text-secondary text-sm py-4">No available projects to enroll in.</p>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]"
                >
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <button
                  onClick={handleEnroll}
                  disabled={!selectedProjectId || enrolling}
                  className="btn-glass btn-glass-primary w-full justify-center"
                >
                  <UserCheck size={16} /> {enrolling ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm text-center rounded-b-none sm:rounded-b-[24px]">
            <AlertTriangle size={40} className="mx-auto text-[#f5c518] mb-4" />
            <h3 className="font-bold text-white text-lg mb-2">Delete Student?</h3>
            <p className="text-text-secondary text-sm mb-6">
              This will permanently delete {student.firstName} {student.lastName} and all their enrollment and attendance records.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-glass">Cancel</button>
              <button onClick={handleDelete} className="btn-glass bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
