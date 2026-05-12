"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Calendar, DollarSign, Send,
  CheckCircle, XCircle, RotateCcw, Clock, MessageSquare,
  UserCog, BarChart3, History
} from "lucide-react";
import {
  PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, STAFF_ROLE_LABELS,
  ENROLLMENT_STATUS_LABELS, REVIEW_ACTION_LABELS,
  formatDate, formatDateTime, formatCurrency, formatTime
} from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/projets/${id}`)
      .then((r) => r.json())
      .then(setProject)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(action: string) {
    if ((action === "reject" || action === "request_revision") && !reviewNotes.trim()) {
      alert("Please provide notes for this action.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: reviewNotes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProject((prev: any) => ({ ...prev, status: updated.status }));
        setReviewNotes("");
        const full = await fetch(`/api/projets/${id}`).then(r => r.json());
        setProject(full);
      }
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusColor(status: string) {
    if (status === "ACTIVE" || status === "APPROVED") return "badge-lime";
    if (status === "UNDER_REVIEW") return "badge-yellow";
    return "badge-white";
  }

  if (loading) return (
    <div className="flex justify-center p-12 text-text-secondary">
      <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
    </div>
  );
  
  if (!project) return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary">
      <h3 className="font-bold text-white mb-1 text-xl">Project not found</h3>
      <Link href="/projets" className="btn-glass mt-4">Back to projects</Link>
    </div>
  );

  const isOwner = session?.user?.id === project.createdById;
  const isReviewer = session?.user?.role === "ADMIN" || session?.user?.role === "COMMITTEE";
  const canSubmit = isOwner && (project.status === "DRAFT" || project.status === "REJECTED");
  const canReview = isReviewer && (project.status === "SUBMITTED" || project.status === "UNDER_REVIEW");

  const tabs = [
    { id: "info", label: "Overview", icon: <BarChart3 size={16} /> },
    { id: "team", label: "Team", icon: <UserCog size={16} /> },
    { id: "students", label: "Students", icon: <Users size={16} /> },
    { id: "sessions", label: "Sessions", icon: <Calendar size={16} /> },
    { id: "budget", label: "Budget", icon: <DollarSign size={16} /> },
    { id: "history", label: "History", icon: <History size={16} /> },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link href="/projets" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-4">
          <ArrowLeft size={16} /> Back to projects
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="header-hero">{project.title}</h1>
              <span className={`glass-badge ${getStatusColor(project.status)}`}>{PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}</span>
              <span className="glass-badge badge-white">{PROJECT_TYPE_LABELS[project.type as keyof typeof PROJECT_TYPE_LABELS]}</span>
            </div>
            <p className="text-text-secondary text-sm">Created by {project.createdBy.name} · {formatDate(project.createdAt)}</p>
          </div>
          
          <div className="flex flex-wrap gap-3 shrink-0">
            {canSubmit && (
              <button className="btn-glass btn-glass-primary" onClick={() => handleAction("submit")} disabled={actionLoading}>
                {actionLoading ? <div className="w-4 h-4 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" /> : <Send size={16} strokeWidth={2.5} />} Submit for Review
              </button>
            )}
            {project.status === "APPROVED" && isReviewer && (
              <button className="btn-glass bg-accent-lime/20 text-accent-lime border-accent-lime/30 hover:bg-accent-lime/30" onClick={() => handleAction("activate")} disabled={actionLoading}>
                {actionLoading ? <div className="w-4 h-4 border-2 border-accent-lime/30 border-t-accent-lime rounded-full animate-spin" /> : <CheckCircle size={16} strokeWidth={2.5} />} Activate Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Panel */}
      {canReview && (
        <div className="glass-card border-l-4 border-l-accent-yellow mb-8">
          <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-4">
            <Clock size={18} className="text-accent-yellow" /> Pending review
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Review notes <span className="text-accent-yellow">*</span></label>
            <textarea 
              className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-yellow transition-colors min-h-[100px]" 
              value={reviewNotes} 
              onChange={e => setReviewNotes(e.target.value)} 
              placeholder="Your comments..." 
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-glass bg-accent-lime/20 text-accent-lime border-accent-lime/30 hover:bg-accent-lime/30" onClick={() => handleAction("approve")} disabled={actionLoading}>
              {actionLoading ? <div className="w-4 h-4 border-2 border-accent-lime/30 border-t-accent-lime rounded-full animate-spin" /> : <CheckCircle size={16} strokeWidth={2.5} />} Approve
            </button>
            <button className="btn-glass bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" onClick={() => handleAction("reject")} disabled={actionLoading}>
              {actionLoading ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <XCircle size={16} strokeWidth={2.5} />} Reject
            </button>
            <button className="btn-glass" onClick={() => handleAction("request_revision")} disabled={actionLoading}>
              {actionLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <RotateCcw size={16} strokeWidth={2.5} />} Request revision
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar mb-6 p-1 rounded-full bg-glass-surface border border-glass-border w-fit max-w-full">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? "bg-accent-cyan/20 text-accent-cyan shadow-sm" 
                : "text-text-secondary hover:text-white hover:bg-white/5"
            }`} 
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-card">
        {activeTab === "info" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-white text-lg mb-6">Project details</h3>
            {project.description && <p className="text-text-secondary leading-relaxed mb-8">{project.description}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="label-subtle block mb-1">Language</span>
                <div className="font-bold text-white">{project.language}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="label-subtle block mb-1">Age group</span>
                <div className="font-bold text-white">{project.targetAgeGroup || "—"}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="label-subtle block mb-1">Start</span>
                <div className="font-bold text-white">{project.startDate ? formatDate(project.startDate) : "—"}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="label-subtle block mb-1">End</span>
                <div className="font-bold text-white">{project.endDate ? formatDate(project.endDate) : "—"}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="label-subtle block mb-1">Capacity</span>
                <div className="font-bold text-white">{project.enrollments?.length || 0} / {project.maxCapacity}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="label-subtle block mb-1">Enrollment Period</span>
                <div className="font-bold text-white">
                  {project.enrollmentOpen ? formatDate(project.enrollmentOpen) : "—"} → {project.enrollmentClose ? formatDate(project.enrollmentClose) : "—"}
                </div>
              </div>
            </div>
            
            {project.publicDescription && (
              <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/5">
                <span className="label-subtle block mb-2">Public description</span>
                <p className="text-white/90 leading-relaxed">{project.publicDescription}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-white text-lg mb-6">Assigned team</h3>
            {project.staff.length === 0 ? (
              <p className="text-text-secondary italic">No members assigned.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {project.staff.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner flex items-center justify-center font-bold text-white shrink-0">
                      {s.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{s.user.name}</div>
                      <div className="text-xs text-text-secondary truncate">{s.user.email}</div>
                    </div>
                    <span className="glass-badge badge-white">{STAFF_ROLE_LABELS[s.role as keyof typeof STAFF_ROLE_LABELS]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-white text-lg mb-6">Enrolled students ({project.enrollments?.length || 0})</h3>
            {!project.enrollments?.length ? (
              <p className="text-text-secondary italic">No students enrolled.</p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar -mx-6 px-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border/50">
                      <th className="pb-3 label-subtle">Name</th>
                      <th className="pb-3 label-subtle">Status</th>
                      <th className="pb-3 label-subtle">Enrollment date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/30">
                    {project.enrollments.map((e: any) => (
                      <tr key={e.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-bold text-white">{e.student.firstName} {e.student.lastName}</td>
                        <td className="py-3">
                          <span className={`glass-badge ${e.status === 'CONFIRMED' ? 'badge-lime' : e.status === 'WAITLISTED' ? 'badge-yellow' : 'badge-white'}`}>
                            {ENROLLMENT_STATUS_LABELS[e.status as keyof typeof ENROLLMENT_STATUS_LABELS]}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-text-secondary">{formatDate(e.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-white text-lg mb-6">Sessions ({project.sessions?.length || 0})</h3>
            {!project.sessions?.length ? (
              <p className="text-text-secondary italic">No sessions scheduled.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {project.sessions.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-1.5 h-10 rounded-full" style={{ background: s.room.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">{formatDate(s.startTime)}</div>
                      <div className="text-xs text-text-secondary mt-1">{formatTime(s.startTime)} – {formatTime(s.endTime)} · {s.room.name}</div>
                    </div>
                    {s.isCancelled && <span className="glass-badge badge-white border-red-500/30 text-red-400 bg-red-500/10">Cancelled</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "budget" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-white text-lg mb-6">Budget</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                <span className="label-subtle mb-2">Registration fee</span>
                <div className="text-3xl font-extrabold text-white">{formatCurrency(project.registrationFee || 0)}</div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                <span className="label-subtle mb-2">Projected costs</span>
                <div className="text-3xl font-extrabold text-white">{formatCurrency(project.projectedCosts || 0)}</div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center border-t-accent-cyan/30">
                <span className="label-subtle mb-2">Estimated revenue</span>
                <div className="text-3xl font-extrabold text-accent-cyan">{formatCurrency(project.revenueEstimate || 0)}</div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center border-t-accent-lime/30">
                <span className="label-subtle mb-2">Actual revenue</span>
                <div className="text-3xl font-extrabold text-accent-lime">{formatCurrency(project.actualRevenue || 0)}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="font-bold text-white text-lg mb-6">Review history</h3>
            {!project.reviewActions?.length ? (
              <p className="text-text-secondary italic">No review actions yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {project.reviewActions.map((a: any) => {
                  let actionColor = "border-accent-yellow text-accent-yellow";
                  if (a.action === "APPROVE") actionColor = "border-accent-lime text-accent-lime";
                  if (a.action === "REJECT") actionColor = "border-red-500 text-red-500";
                  
                  return (
                    <div key={a.id} className={`p-4 bg-white/5 rounded-2xl border border-white/5 border-l-4 ${actionColor}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-white">
                          {REVIEW_ACTION_LABELS[a.action as keyof typeof REVIEW_ACTION_LABELS]}
                        </span>
                        <span className="text-xs text-text-secondary">{formatDateTime(a.createdAt)}</span>
                      </div>
                      <div className="text-xs text-text-secondary/80 mb-2">by <span className="font-medium text-white/90">{a.reviewer.name}</span></div>
                      {a.notes && <p className="text-sm text-white/80 bg-black/20 p-3 rounded-xl">{a.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
