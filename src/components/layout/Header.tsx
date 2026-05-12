"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatDateTime, getInitials } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  content: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  title: string;
  userName: string;
  userEmail?: string;
  onMenuClick: () => void;
}

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(full: string): string {
  const t = full.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0];
}

export default function Header({ title, userName, userEmail, onMenuClick }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const greet = greetingForNow();
  const displayFirst = firstName(userName);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Silently fail
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Silently fail
    }
  }

  return (
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 px-6 lg:px-10 py-4 bg-background/80 backdrop-blur-xl border-b border-glass-border">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button type="button" className="lg:hidden p-2 rounded-lg text-text-primary hover:bg-glass-surface transition-colors" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-secondary leading-tight">
            {greet}, <span className="font-bold text-white">{displayFirst}</span>
          </p>
          <p className="text-xs font-bold text-accent-cyan uppercase tracking-wider mt-1">{title}</p>
        </div>
      </div>

      <div className="flex justify-center flex-[2] min-w-[260px] max-md:order-4 max-md:basis-full max-md:mt-2">
        <label className="flex items-center gap-3 w-full max-w-md px-4 py-2.5 rounded-full border border-glass-border bg-glass-surface focus-within:border-accent-cyan/50 focus-within:ring-2 focus-within:ring-accent-cyan/20 transition-all" aria-label="Search">
          <Search size={18} className="text-text-secondary flex-shrink-0" strokeWidth={2} />
          <input type="search" placeholder="Search projects, students…" className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-text-secondary" autoComplete="off" />
        </label>
      </div>

      <div className="flex items-center gap-3 relative flex-none ml-auto" ref={dropdownRef}>
        <button
          type="button"
          className="relative p-2 rounded-full border border-glass-border bg-glass-surface text-text-secondary hover:text-white hover:bg-glass-surface-hover transition-colors"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-accent-yellow border-2 border-background" />}
        </button>

        <div className="hidden md:flex items-center gap-3 pr-4 p-1 rounded-full border border-glass-border bg-glass-surface" title={userEmail}>
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {getInitials(userName)}
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate max-w-[140px]">{userName}</span>
            <span className="text-xs text-text-secondary truncate max-w-[140px] leading-tight">{userEmail ?? ""}</span>
          </span>
        </div>

        {showDropdown && (
          <div className="absolute top-[calc(100%+10px)] right-0 w-[360px] max-w-[calc(100vw-32px)] glass-card p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center p-4 border-b border-glass-border">
              <span className="font-bold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="glass-badge badge-cyan">{unreadCount} unread</span>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-secondary">No notifications</div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    className={`p-4 border-b border-glass-border/50 cursor-pointer transition-colors ${n.isRead ? "hover:bg-glass-surface" : "bg-accent-cyan/10 hover:bg-accent-cyan/20"}`}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.link) window.location.href = n.link;
                    }}
                  >
                    <div className="font-bold text-sm text-white mb-1">{n.title}</div>
                    {n.content && <div className="text-sm text-text-secondary leading-snug">{n.content}</div>}
                    <div className="text-xs text-text-secondary/60 mt-2">{formatDateTime(n.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
