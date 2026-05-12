"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MessageSquare, X, Tag, Search, Filter } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Discussion {
  id: string;
  title: string;
  createdAt: string;
  createdBy: { name: string };
  messages: Array<{ content: string; createdAt: string; author: { name: string } }>;
  _count: { messages: number };
}

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", tag: "" });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (activeTag) params.set("tag", activeTag);
    
    fetch(`/api/discussions?${params.toString()}`)
      .then((r) => r.json())
      .then(setDiscussions)
      .finally(() => setLoading(false));
  }, [searchQuery, activeTag]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const disc = await res.json();
        setDiscussions((prev) => [{ ...disc, messages: [], _count: { messages: form.message ? 1 : 0 }, createdBy: { name: "You" } }, ...prev]);
        setShowModal(false);
        setForm({ title: "", message: "", tag: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="header-hero mb-2">Discussions</h1>
          <p className="text-text-secondary text-sm">Committee-wide discussions and planning</p>
        </div>
        <button className="btn-glass btn-glass-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} strokeWidth={2.5} /> New discussion
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search discussions..."
            className="w-full bg-glass-surface border border-glass-border rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${!activeTag ? 'bg-white/10 text-white' : 'bg-glass-surface border border-glass-border text-text-secondary hover:text-white'}`}
            onClick={() => setActiveTag("")}
          >
            All
          </button>
          {["QUESTION", "FEEDBACK", "DECISION", "ACTION_ITEM"].map(tag => (
            <button 
              key={tag}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTag === tag ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' : 'bg-glass-surface border border-glass-border text-text-secondary hover:text-white'}`}
              onClick={() => setActiveTag(tag)}
            >
              <Tag size={12} /> {tag.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-text-secondary">
          <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : discussions.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center text-text-secondary">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <MessageSquare size={32} className="text-text-secondary opacity-50" />
          </div>
          <h3 className="font-bold text-white mb-1 text-xl">No discussions yet</h3>
          <p className="text-sm">Start a discussion to communicate with the team.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {discussions.map((d) => (
            <Link key={d.id} href={`/discussions/${d.id}`} className="glass-card !p-5 flex items-center justify-between gap-4 group hover:border-accent-cyan/50 hover:bg-white/10 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-base mb-1.5 truncate group-hover:text-accent-cyan transition-colors">{d.title}</div>
                <div className="text-xs text-text-secondary mb-2 flex items-center gap-1.5">
                  <span className="font-medium text-white/80">{d.createdBy.name}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{formatDateTime(d.createdAt)}</span>
                </div>
                {d.messages[0] && (
                  <div className="text-xs text-text-secondary/80 truncate max-w-2xl bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="font-semibold text-white/70 mr-2">{d.messages[0].author.name}</span>
                    {d.messages[0].content}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="glass-badge badge-white flex items-center gap-1.5 !px-3 !py-1">
                  <MessageSquare size={14} /> {d._count.messages}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Discussion Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="glass-card w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">New discussion</h3>
              <button className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Title <span className="text-accent-yellow">*</span></label>
                <input className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Discussion topic" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">First message</label>
                <textarea className="w-full bg-glass-surface border border-glass-border rounded-xl px-4 py-2.5 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-cyan transition-colors min-h-[120px] resize-y" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Your message..." />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Tag</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag size={16} className="text-text-secondary" />
                  </div>
                  <select className="form-select pl-10" value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))}>
                    <option value="">None</option>
                    <option value="QUESTION">Question</option>
                    <option value="FEEDBACK">Feedback</option>
                    <option value="DECISION">Decision</option>
                    <option value="ACTION_ITEM">Action item</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-border mt-6">
                <button type="button" className="btn-glass" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-glass btn-glass-primary" disabled={saving}>{saving ? "Creating..." : "Create discussion"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
