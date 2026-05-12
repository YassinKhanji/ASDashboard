"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Edit3, Trash2, Check, X, MessageSquare } from "lucide-react";
import { formatDateTime, MESSAGE_TAG_LABELS, getInitials } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  tag: string | null;
  createdAt: string;
  author: { id: string; name: string };
}

interface DiscussionData {
  id: string;
  title: string;
  createdAt: string;
  createdBy: { name: string };
  project: { id: string; title: string } | null;
  messages: Message[];
}

const TAG_BADGE_MAP: Record<string, string> = {
  QUESTION: "badge-question",
  FEEDBACK: "badge-feedback",
  DECISION: "badge-decision",
  ACTION_ITEM: "badge-action",
};

export default function DiscussionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  // Mock auth — matches the pattern in @/lib/auth.ts
  const session = { user: { id: "admin-id", name: "Admin" } };
  const [discussion, setDiscussion] = useState<DiscussionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tag, setTag] = useState("");
  const [sending, setSending] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/discussions/${id}`)
      .then((r) => r.json())
      .then(setDiscussion)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [discussion?.messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/discussions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message, tag: tag || null }),
      });
      if (res.ok) {
        const msg = await res.json();
        setDiscussion((prev) =>
          prev ? { ...prev, messages: [...prev.messages, msg] } : prev
        );
        setMessage("");
        setTag("");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleUpdateTitle() {
    if (!editedTitle.trim() || editedTitle === discussion?.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/discussions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editedTitle }),
      });
      if (res.ok) {
        setDiscussion(prev => prev ? { ...prev, title: editedTitle } : prev);
        setIsEditingTitle(false);
      }
    } catch (e) { console.error(e); }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      const res = await fetch(`/api/discussions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/discussions");
      }
    } catch (e) { console.error(e); }
  }

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  if (!discussion) return <div style={{ padding: "48px", textAlign: "center" }}>Discussion not found</div>;

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--header-height) - 56px)" }}>
      <div className="mb-6">
        <Link href="/discussions" className="btn-glass w-fit mb-4">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 max-w-xl">
                <input 
                  className="form-input text-xl font-bold" 
                  value={editedTitle} 
                  onChange={e => setEditedTitle(e.target.value)}
                  autoFocus
                />
                <button onClick={handleUpdateTitle} className="p-2 rounded-lg bg-accent-lime/20 text-accent-lime hover:bg-accent-lime/30 transition-colors">
                  <Check size={20} />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="header-hero">{discussion.title}</h1>
                <button 
                  onClick={() => { setEditedTitle(discussion.title); setIsEditingTitle(true); }}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
            <p className="text-text-secondary text-sm mt-1">
              Started by {discussion.createdBy.name} · {formatDateTime(discussion.createdAt)}
              {discussion.project && (
                <> · Project: <Link href={`/projets/${discussion.project.id}`} className="text-accent-cyan hover:underline">{discussion.project.title}</Link></>
              )}
            </p>
          </div>
          <button onClick={handleDelete} className="btn-glass bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 w-fit">
            <Trash2 size={16} /> Delete Conversation
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="glass-card flex-1 overflow-y-auto custom-scrollbar !p-6 flex flex-col gap-6">
        {discussion.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary opacity-50">
            <MessageSquare size={48} className="mb-4" />
            <p>No messages yet. Be the first to post!</p>
          </div>
        ) : (
          discussion.messages.map((msg) => {
            const isOwn = msg.author.id === session?.user?.id || msg.author.name === "ASC Administrator"; // Handle fallback admin name
            return (
              <div key={msg.id} className={`flex gap-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-lg ${isOwn ? "bg-accent-cyan text-background shadow-accent-cyan/20" : "bg-white/10 text-white shadow-black/20"}`}>
                  {getInitials(msg.author.name)}
                </div>
                <div className={`max-w-[80%] group ${isOwn ? "items-end" : "items-start"}`}>
                  <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-xs font-bold text-white/90">{msg.author.name}</span>
                    {msg.tag && (
                      <span className={`glass-badge ${TAG_BADGE_MAP[msg.tag] || ""} !text-[9px] !px-2 !py-0.5`}>
                        {MESSAGE_TAG_LABELS[msg.tag as keyof typeof MESSAGE_TAG_LABELS]}
                      </span>
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl relative ${isOwn ? "bg-accent-cyan/10 border border-accent-cyan/20 rounded-tr-none text-white" : "bg-white/5 border border-white/10 rounded-tl-none text-white/90"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className={`text-[10px] text-text-secondary/60 mt-1.5 ${isOwn ? "text-right" : "text-left"}`}>
                    {formatDateTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <form onSubmit={handleSend} className="flex gap-3 mt-4 items-center">
        <div className="w-[140px] shrink-0">
          <select className="form-select text-xs h-[42px]" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">Tag...</option>
            <option value="QUESTION">Question</option>
            <option value="FEEDBACK">Feedback</option>
            <option value="DECISION">Decision</option>
            <option value="ACTION_ITEM">Action item</option>
          </select>
        </div>
        <div className="flex-1">
          <input className="form-input h-[42px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message..." />
        </div>
        <button className="btn-glass btn-glass-primary h-[42px] px-5" type="submit" disabled={sending || !message.trim()}>
          {sending ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
