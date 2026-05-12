"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderKanban, MoreHorizontal } from "lucide-react";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, formatDate } from "@/lib/utils";

interface Project {
  id: string; title: string; type: string; status: string;
  targetAgeGroup: string | null; language: string; maxCapacity: number | null;
  updatedAt: string; createdBy: { name: string };
  _count: { enrollments: number; sessions: number };
}

export default function ProjetsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/projets").then(r => r.json()).then(setProjects).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => !filter || p.status === filter);

  function getStatusColor(status: string) {
    if (status === "ACTIVE" || status === "APPROVED") return "badge-lime";
    if (status === "UNDER_REVIEW") return "badge-yellow";
    return "badge-white";
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="header-hero mb-2">Projects</h1>
          <p className="text-text-secondary text-sm">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in the directory
          </p>
        </div>
        <Link href="/projets/nouveau" className="btn-glass btn-glass-primary">
          <Plus size={18} strokeWidth={2.5} /> New Project
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-text-secondary">
          <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <FolderKanban size={32} className="text-text-secondary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects</h3>
          <p className="text-text-secondary mb-6 max-w-sm">Create your first project to start organizing classes, workshops, or activities.</p>
          <Link href="/projets/nouveau" className="btn-glass btn-glass-primary">
            <Plus size={18} /> Create a project
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-fit max-w-full overflow-x-auto custom-scrollbar">
            {["", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACTIVE", "COMPLETED"].map(s => (
              <button 
                key={s} 
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === s 
                    ? "bg-accent-cyan/20 text-accent-cyan" 
                    : "text-text-secondary hover:text-white hover:bg-white/5"
                }`} 
                onClick={() => setFilter(s)}
              >
                {s ? (PROJECT_STATUS_LABELS as any)[s] : "All"}
              </button>
            ))}
          </div>

          <div className="glass-card p-0 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-glass-border/50 bg-white/5">
                    <th className="px-6 py-4 label-subtle">Project</th>
                    <th className="px-6 py-4 label-subtle">Type</th>
                    <th className="px-6 py-4 label-subtle">Status</th>
                    <th className="px-6 py-4 label-subtle">Students</th>
                    <th className="px-6 py-4 label-subtle">Sessions</th>
                    <th className="px-6 py-4 label-subtle">Updated</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/projets/${p.id}`} className="block">
                          <div className="font-bold text-white group-hover:text-accent-cyan transition-colors">{p.title}</div>
                          {p.targetAgeGroup && <div className="text-xs text-text-secondary mt-1">{p.targetAgeGroup}</div>}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="glass-badge badge-white">{(PROJECT_TYPE_LABELS as any)[p.type]}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`glass-badge ${getStatusColor(p.status)}`}>{(PROJECT_STATUS_LABELS as any)[p.status]}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                        <span className="text-white font-bold">{p._count.enrollments}</span>
                        {p.maxCapacity ? <span className="opacity-50"> / {p.maxCapacity}</span> : ""}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{p._count.sessions}</td>
                      <td className="px-6 py-4 text-xs text-text-secondary">{formatDate(p.updatedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
