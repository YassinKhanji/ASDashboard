"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Plus, FolderKanban, MoreHorizontal, ArrowRight, Edit3, Trash2, Eye } from "lucide-react";
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

  async function handleDeleteProject(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete project.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while deleting the project.");
    }
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
          {/* Filter Bar - Responsive Horizontal Scroll */}
          <div className="flex flex-nowrap overflow-x-auto gap-2 mb-6 p-2 rounded-2xl bg-white/5 border border-white/10 w-full no-scrollbar">
            {["", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACTIVE", "COMPLETED"].map(s => (
              <button 
                key={s} 
                className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === s 
                    ? "bg-accent-cyan text-black shadow-[0_0_15px_rgba(77,184,255,0.4)]" 
                    : "text-text-secondary hover:text-white hover:bg-white/10"
                }`} 
                onClick={() => setFilter(s)}
              >
                {s ? (PROJECT_STATUS_LABELS as any)[s] : "All"}
              </button>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-card p-0 overflow-hidden">
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
                        <ProjectActions 
                          project={p} 
                          onDelete={handleDeleteProject} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4">
            {filtered.map(p => (
              <Link key={p.id} href={`/projets/${p.id}`} className="glass-card p-5 flex flex-col gap-4 hover:border-accent-cyan/50 transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-lg leading-tight mb-1 truncate">{p.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{(PROJECT_TYPE_LABELS as any)[p.type]}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{p.targetAgeGroup || "All ages"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`glass-badge !px-2.5 !py-1 !text-[10px] ${getStatusColor(p.status)}`}>
                      {(PROJECT_STATUS_LABELS as any)[p.status]}
                    </span>
                    <ProjectActions 
                      project={p} 
                      onDelete={handleDeleteProject} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Students</span>
                    <span className="text-sm font-bold text-white">
                      {p._count.enrollments} {p.maxCapacity ? `/ ${p.maxCapacity}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Sessions</span>
                    <span className="text-sm font-bold text-white">{p._count.sessions}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  <span>Updated {formatDate(p.updatedAt)}</span>
                  <div className="flex items-center gap-1.5 text-accent-cyan">
                    Details <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectActions({ project, onDelete }: { project: Project, onDelete: (id: string, title: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", () => setIsOpen(false), { once: true });
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = 150; // Approximate height
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      if (left + menuWidth > screenWidth - 10) left = screenWidth - menuWidth - 10;
      
      let top = rect.bottom + 8;
      // If menu would go off bottom, show it above the button
      if (top + menuHeight > screenHeight - 20) {
        top = rect.top - menuHeight - 8;
      }
      
      setCoords({ top, left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      <button 
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>
      
      {isOpen && mounted && createPortal(
        <div 
          ref={menuRef}
          className="fixed w-48 glass-card p-1.5 z-[9999] shadow-2xl animate-in fade-in zoom-in-95 duration-200 !bg-[#1a2f3a]/95 backdrop-blur-xl border border-white/20"
          style={{ 
            top: `${coords.top}px`, 
            left: `${coords.left}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Link 
            href={`/projets/${project.id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Eye size={14} /> View Details
          </Link>
          <Link 
            href={`/projets/${project.id}/modifier`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Edit3 size={14} /> Edit Project
          </Link>
          <div className="h-px bg-white/10 my-1" />
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
              onDelete(project.id, project.title);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} /> Delete Project
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
