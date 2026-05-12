"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { formatDateTime, MESSAGE_TAG_LABELS, getInitials } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

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
  const { data: session } = useSession();
  const [discussion, setDiscussion] = useState<DiscussionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tag, setTag] = useState("");
  const [sending, setSending] = useState(false);
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

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;
  if (!discussion) return <div style={{ padding: "48px", textAlign: "center" }}>Discussion not found</div>;

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--header-height) - 56px)" }}>
      <div style={{ marginBottom: "16px" }}>
        <Link href="/discussions" className="btn btn-ghost btn-sm" style={{ marginBottom: "8px", display: "inline-flex" }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">{discussion.title}</h1>
            <p className="page-subtitle">
              By {discussion.createdBy.name} · {formatDateTime(discussion.createdAt)}
              {discussion.project && (
                <> · Project: <Link href={`/projets/${discussion.project.id}`} style={{ color: "var(--primary)" }}>{discussion.project.title}</Link></>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="card" style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {discussion.messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>No messages yet. Be the first to post!</div>
        ) : (
          discussion.messages.map((msg) => {
            const isOwn = msg.author.id === session?.user?.id;
            return (
              <div key={msg.id} style={{ display: "flex", gap: "10px", flexDirection: isOwn ? "row-reverse" : "row" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: isOwn ? "var(--primary)" : "var(--text-light)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
                  {getInitials(msg.author.name)}
                </div>
                <div style={{ maxWidth: "70%", background: isOwn ? "var(--primary-light)" : "var(--background)", padding: "10px 14px", borderRadius: "var(--radius-lg)", borderTopLeftRadius: isOwn ? "var(--radius-lg)" : "4px", borderTopRightRadius: isOwn ? "4px" : "var(--radius-lg)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{msg.author.name}</span>
                    {msg.tag && <span className={`badge ${TAG_BADGE_MAP[msg.tag] || ""}`} style={{ fontSize: "0.65rem", padding: "1px 6px" }}>{MESSAGE_TAG_LABELS[msg.tag as keyof typeof MESSAGE_TAG_LABELS]}</span>}
                  </div>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{msg.content}</p>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-light)", marginTop: "6px", textAlign: isOwn ? "right" : "left" }}>{formatDateTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "flex-end" }}>
        <select className="form-select" style={{ width: "140px", fontSize: "0.8rem" }} value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">Tag...</option>
          <option value="QUESTION">Question</option>
          <option value="FEEDBACK">Feedback</option>
          <option value="DECISION">Decision</option>
          <option value="ACTION_ITEM">Action item</option>
        </select>
        <input className="form-input" style={{ flex: 1 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message..." />
        <button className="btn btn-primary" type="submit" disabled={sending || !message.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
