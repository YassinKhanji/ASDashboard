"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCog,
  CalendarDays,
  MessageSquare,
  ClipboardCheck,
  Settings,
  Menu,
  X,
  Search,
  Bell,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface SidebarProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Overview", tooltip: "Overview" },
  { href: "/projets", icon: FolderKanban, label: "Projects", tooltip: "Projects" },
  { href: "/etudiants", icon: Users, label: "Students", tooltip: "Students" },
  { href: "/personnel", icon: UserCog, label: "Staff", tooltip: "Staff" },
  { href: "/calendrier", icon: CalendarDays, label: "Calendar", tooltip: "Calendar" },
  { href: "/discussions", icon: MessageSquare, label: "Discussions", tooltip: "Discussions" },
  { href: "/revue", icon: ClipboardCheck, label: "Governance", tooltip: "Governance" },
  { href: "/parametres", icon: Settings, label: "Settings", tooltip: "Settings" },
];

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Fetch notifications
  useEffect(() => {
    fetch("/api/notifications")
      .then(res => res.json())
      .then(setNotifications)
      .catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data);
            setShowSearch(true);
          })
          .catch(() => {});
      } else {
        setSearchResults(null);
        setShowSearch(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  function markAsRead(id: string) {
    fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 px-4 bg-background/80 backdrop-blur-xl border-b border-white/10 z-50 flex md:hidden items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-sm">Avenir Souriant</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="p-2 relative text-white/70 hover:text-white transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-yellow" />}
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 bg-black/60 backdrop-blur-md z-40 md:hidden animate-in fade-in slide-in-from-top-4">
          <nav className="bg-white/10 border-b border-white/20 p-4 flex flex-col gap-2">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                    active 
                      ? "bg-white/20 text-white shadow-inner" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Mobile Floating Search Button */}
      <button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent-cyan rounded-full shadow-[0_4px_20px_rgba(77,184,255,0.4)] flex items-center justify-center text-black z-40 md:hidden transition-transform active:scale-95 no-print"
        onClick={() => setIsMobileSearchOpen(true)}
      >
        <Search size={24} strokeWidth={2.5} />
      </button>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 md:hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="search"
                placeholder="Search projects, students, staff..."
                className="w-full bg-white/10 border border-white/20 rounded-full pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-cyan transition-all"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="p-3 text-white/70 hover:text-white bg-white/5 rounded-full"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery("");
                setSearchResults(null);
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery.trim().length >= 2 && searchResults ? (
              <div className="space-y-6 pb-20">
                {searchResults.projects?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-2 flex items-center gap-2"><FolderKanban size={14}/> Projects</div>
                    <div className="flex flex-col gap-2">
                      {searchResults.projects.map((p: any) => (
                        <Link key={p.id} href={`/projets/${p.id}`} onClick={() => setIsMobileSearchOpen(false)} className="bg-white/5 p-3 rounded-xl active:bg-white/10">
                          <div className="text-sm font-bold text-white mb-0.5">{p.title}</div>
                          <div className="text-[10px] text-white/50">{p.type} • {p.status}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.students?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-2 flex items-center gap-2"><Users size={14}/> Students</div>
                    <div className="flex flex-col gap-2">
                      {searchResults.students.map((s: any) => (
                        <Link key={s.id} href={`/etudiants/${s.id}`} onClick={() => setIsMobileSearchOpen(false)} className="bg-white/5 p-3 rounded-xl active:bg-white/10">
                          <div className="text-sm font-bold text-white">{s.firstName} {s.lastName}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.staff?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-2 flex items-center gap-2"><UserCog size={14}/> Staff</div>
                    <div className="flex flex-col gap-2">
                      {searchResults.staff.map((s: any) => (
                        <Link key={s.id} href={`/personnel/${s.id}`} onClick={() => setIsMobileSearchOpen(false)} className="bg-white/5 p-3 rounded-xl active:bg-white/10">
                          <div className="text-sm font-bold text-white mb-0.5">{s.name}</div>
                          <div className="text-[10px] text-white/50">{s.role}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {(!searchResults.projects?.length && !searchResults.students?.length && !searchResults.staff?.length) && (
                  <div className="text-center text-white/50 text-sm mt-10">No results found</div>
                )}
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <div className="flex justify-center mt-10">
                <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="text-center text-white/30 text-sm mt-10">Type to search across the platform</div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="
        hidden md:flex relative h-full w-[260px] flex-col py-6 px-4 rounded-[32px]
        bg-white/5 backdrop-blur-3xl border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.3)] shrink-0 z-50 no-print
      ">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-inner shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm leading-tight">Avenir Souriant</span>
            <span className="text-accent-cyan text-[10px] font-bold uppercase tracking-wider">Management</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-cyan transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults && setShowSearch(true)}
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showSearch && searchResults && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[300px] glass-card p-0 overflow-hidden z-50 animate-in fade-in">
              <div className="max-h-[360px] overflow-y-auto">
                {searchResults.projects?.map((p: any) => (
                  <Link key={p.id} href={`/projets/${p.id}`} onClick={() => setShowSearch(false)} className="block px-4 py-3 hover:bg-white/5 border-b border-white/5 text-sm text-white">{p.title}</Link>
                ))}
                {searchResults.students?.map((s: any) => (
                  <Link key={s.id} href={`/etudiants/${s.id}`} onClick={() => setShowSearch(false)} className="block px-4 py-3 hover:bg-white/5 border-b border-white/5 text-sm text-white">{s.firstName} {s.lastName}</Link>
                ))}
                {searchResults.staff?.map((s: any) => (
                  <Link key={s.id} href={`/personnel/${s.id}`} onClick={() => setShowSearch(false)} className="block px-4 py-3 hover:bg-white/5 border-b border-white/5 text-sm text-white">{s.name}</Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? "bg-accent-cyan/20 text-accent-cyan font-bold"
                    : "text-white/60 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between gap-2 px-2 relative">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-glass border border-white/20">
              {user?.name ? user.name.substring(0,2).toUpperCase() : "AS"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{user?.name || "User"}</span>
              <span className="text-[10px] text-white/50 truncate">{user?.role || "Admin"}</span>
            </div>
          </div>
          
          <button 
            className="p-2 relative text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-yellow" />}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute bottom-[calc(100%+10px)] left-0 w-[300px] glass-card p-0 overflow-hidden z-50">
              <div className="p-3 border-b border-white/10 font-bold text-sm text-white flex justify-between">
                Notifications
                {unreadCount > 0 && <span className="text-accent-cyan text-xs">{unreadCount} new</span>}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/50">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3 text-sm border-b border-white/5 cursor-pointer ${n.isRead ? 'text-white/70 hover:bg-white/5' : 'bg-accent-cyan/10 text-white font-medium'}`}>
                      {n.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
