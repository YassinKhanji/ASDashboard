"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit3, Save, X, FolderKanban, Calendar,
  Phone, Mail, User, Clock, Shield, AlertTriangle
} from "lucide-react";
import { formatDate, formatTime, STAFF_ROLE_LABELS, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  availability: string | null;
  isActive: boolean;
  createdAt: string;
  projectAssignments: Array<{
    id: string;
    role: string;
    project: {
      id: string;
      title: string;
      type: string;
      status: string;
      startDate: string | null;
      endDate: string | null;
    };
  }>;
  upcomingSessions: Array<{
    id: string;
    startTime: string;
    endTime: string;
    project: { title: string };
    room: { name: string; color: string };
  }>;
}

export default function PersonnelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "schedule">("overview");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", availability: "",
  });

  useEffect(() => {
    fetchStaff();
  }, [id]);

  async function fetchStaff() {
    try {
      const res = await fetch(`/api/personnel/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setStaff(data);
      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        availability: data.availability || "",
      });
    } catch {
      setStaff(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/personnel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        setStaff((prev) => prev ? { ...prev, ...updated } : prev);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function getRoleBadgeClass(role: string) {
    if (role === "ADMIN") return "badge-cyan";
    if (role === "COMMITTEE") return "badge-yellow";
    return "badge-lime";
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle size={48} className="text-[#f5c518] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Staff member not found</h2>
        <Link href="/personnel" className="btn-glass btn-glass-primary mt-4">
          <ArrowLeft size={16} /> Back to Staff
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/personnel" className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {staff.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h1 className="header-hero">{staff.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`glass-badge ${getRoleBadgeClass(staff.role)}`}>
                  {(ROLE_LABELS as Record<string, string>)[staff.role] || staff.role}
                </span>
                {!staff.isActive && (
                  <span className="glass-badge bg-red-500/20 text-red-400 border-red-500/30">Inactive</span>
                )}
              </div>
            </div>
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
            <button onClick={() => setEditing(true)} className="btn-glass">
              <Edit3 size={16} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-full overflow-x-auto no-scrollbar">
        {(["overview", "projects", "schedule"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
              activeTab === tab
                ? "bg-accent-cyan text-black shadow-[0_0_15px_rgba(77,184,255,0.4)]"
                : "text-text-secondary hover:text-white hover:bg-white/10"
            }`}
          >
            {tab === "overview" ? "Overview" : tab === "projects" ? `Projects (${staff.projectAssignments.length})` : "Schedule"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="glass-card">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <User size={16} className="text-[#4db8ff]" /> Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label-subtle block mb-1">Full Name</label>
                {editing ? (
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                ) : (
                  <p className="text-white font-medium">{staff.name}</p>
                )}
              </div>
              <div>
                <label className="label-subtle block mb-1">Email</label>
                {editing ? (
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                ) : (
                  <p className="text-white font-medium flex items-center gap-2">
                    <Mail size={14} className="text-text-secondary" /> {staff.email}
                  </p>
                )}
              </div>
              <div>
                <label className="label-subtle block mb-1">Phone</label>
                {editing ? (
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent-cyan/50 min-h-[48px]" />
                ) : (
                  <p className="text-white font-medium flex items-center gap-2">
                    {staff.phone ? <><Phone size={14} className="text-text-secondary" /> {staff.phone}</> : "Not set"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Role & Availability */}
          <div className="glass-card">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#f5c518]" /> Role & Availability
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label-subtle block mb-1">Role</label>
                <p className="text-white font-medium">{(ROLE_LABELS as Record<string, string>)[staff.role]}</p>
              </div>
              <div>
                <label className="label-subtle block mb-1">Member Since</label>
                <p className="text-white font-medium">{formatDate(staff.createdAt)}</p>
              </div>
              <div>
                <label className="label-subtle block mb-1">Availability Notes</label>
                {editing ? (
                  <textarea value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} rows={3}
                    placeholder="e.g., Available Mon-Wed evenings, all day Saturday"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent-cyan/50 resize-none placeholder:text-white/30" />
                ) : (
                  <p className="text-white/80 text-sm">{staff.availability || "Not specified"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card md:col-span-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-white">{staff.projectAssignments.length}</div>
                <div className="label-subtle mt-1">Assigned Projects</div>
              </div>
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-white">
                  {staff.projectAssignments.filter(pa => pa.role === "LEAD").length}
                </div>
                <div className="label-subtle mt-1">Lead Instructor</div>
              </div>
              <div className="text-center py-2">
                <div className="text-2xl font-bold text-white">{staff.upcomingSessions.length}</div>
                <div className="label-subtle mt-1">Upcoming Sessions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div>
          {staff.projectAssignments.length === 0 ? (
            <div className="glass-card text-center py-12">
              <FolderKanban size={32} className="mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary">Not assigned to any projects</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.projectAssignments.map(pa => (
                <Link key={pa.id} href={`/projets/${pa.project.id}`}
                  className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 hover:border-accent-cyan/50 transition-all block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <FolderKanban size={16} className="text-[#4db8ff]" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{pa.project.title}</div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {(PROJECT_TYPE_LABELS as Record<string, string>)[pa.project.type]} ·{" "}
                        {pa.project.startDate && pa.project.endDate
                          ? `${formatDate(pa.project.startDate)} – ${formatDate(pa.project.endDate)}`
                          : "Dates not set"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`glass-badge ${
                      pa.role === "LEAD" ? "badge-cyan" : pa.role === "CO_INSTRUCTOR" ? "badge-yellow" : "badge-white"
                    }`}>
                      {(STAFF_ROLE_LABELS as Record<string, string>)[pa.role] || pa.role}
                    </span>
                    <span className={`glass-badge ${
                      pa.project.status === "ACTIVE" ? "badge-lime" : "badge-white"
                    }`}>
                      {(PROJECT_STATUS_LABELS as Record<string, string>)[pa.project.status] || pa.project.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div>
          {staff.upcomingSessions.length === 0 ? (
            <div className="glass-card text-center py-12">
              <Calendar size={32} className="mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary">No upcoming sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.upcomingSessions.map(s => (
                <div key={s.id} className="glass-card flex items-center gap-4 p-4">
                  <div className="w-1.5 h-12 rounded-full shrink-0" style={{ background: s.room.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white">{s.project.title}</div>
                    <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-2">
                      <Clock size={12} />
                      {formatDate(s.startTime)} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </div>
                  </div>
                  <div className="glass-badge badge-white text-xs">{s.room.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
