"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const router = useRouter();
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
  const [pendingReviews, setPendingReviews] = useState(0);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const mobileBellButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setShowNotifications(false);
    setIsMenuOpen(false);
    setShowSearch(false);
  }, [pathname]);
  
  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node) && 
          bellButtonRef.current && !bellButtonRef.current.contains(event.target as Node) &&
          mobileBellButtonRef.current && !mobileBellButtonRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Fetch notifications & pending reviews
  useEffect(() => {
    fetch("/api/notifications")
      .then(res => res.json())
      .then(setNotifications)
      .catch(() => {});
      
    fetch("/api/projets")
      .then(res => res.json())
      .then(data => {
        const pending = data.filter((p: any) => p.status === "SUBMITTED").length;
        setPendingReviews(pending);
      })
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

  async function clearAllNotifications() {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
      setShowNotifications(false);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 px-4 bg-white/5 backdrop-blur-3xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-50 flex md:hidden items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-sm">Avenir Souriant</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            ref={mobileBellButtonRef}
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

      {/* Mobile Notifications Dropdown */}
      {showNotifications && (
        <div ref={notificationsRef} className="fixed top-20 right-4 w-[calc(100%-32px)] sm:w-[320px] overflow-hidden z-50 md:hidden animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-200 bg-white/40 backdrop-blur-[40px] border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[32px] flex flex-col">
          <div className="p-4 border-b border-white/10 font-bold text-white flex justify-between items-center bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 relative">
              <Bell size={18} className="text-accent-cyan animate-pulse" />
              <span className="tracking-tight text-lg">Notifications</span>
            </div>
            {unreadCount > 0 && <span className="glass-badge badge-cyan !px-2.5 !py-1 !text-[11px] font-bold shadow-lg ring-1 ring-white/20">{unreadCount} NEW</span>}
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Bell size={32} className="text-white/20" />
                </div>
                <div className="text-sm text-white/40 font-medium">Your inbox is empty</div>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = n.title.toLowerCase().includes('project') ? FolderKanban : 
                             n.title.toLowerCase().includes('student') ? Users : 
                             n.title.toLowerCase().includes('message') ? MessageSquare : Bell;
                return (
                  <Link 
                    key={n.id} 
                    href={n.link || "#"} 
                    onClick={() => { 
                      markAsRead(n.id); 
                      if (pathname === n.link) setShowNotifications(false);
                    }} 
                    className={`flex items-start gap-4 p-4 border-b border-white/5 transition-all hover:bg-white/10 group ${n.isRead ? 'opacity-50' : 'bg-white/[0.02]'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${n.isRead ? 'bg-white/5 text-white/30' : 'bg-accent-cyan/15 text-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm mb-1 leading-tight ${n.isRead ? 'text-white/70' : 'text-white font-bold'}`}>{n.title}</div>
                      <div className="text-xs text-white/40 line-clamp-2 leading-relaxed group-hover:text-white/60 transition-colors">{n.content}</div>
                      <div className="text-[10px] text-accent-cyan/40 mt-2 font-bold uppercase tracking-widest">{formatDateTime(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-accent-cyan mt-1.5 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
                  </Link>
                );
              })
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-3 bg-white/5 border-t border-white/10 text-center">
              <button onClick={clearAllNotifications} className="text-[11px] font-bold text-accent-cyan hover:text-white transition-colors uppercase tracking-widest">Clear all</button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden animate-in fade-in" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <nav 
            className="relative m-4 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[32px] p-4 flex flex-col gap-2 animate-in slide-in-from-top-4"
            onClick={(e) => e.stopPropagation()}
          >
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-full flex items-center justify-center text-white z-40 md:hidden transition-all active:scale-95 hover:bg-white/10 no-print"
        onClick={() => setIsMobileSearchOpen(true)}
      >
        <Search size={24} strokeWidth={2} />
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
        <div className="mb-6 relative" ref={searchRef}>
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
                <span className="text-sm flex-1">{item.label}</span>
                {item.label === "Governance" && pendingReviews > 0 && (
                  <span className="w-5 h-5 rounded-full bg-accent-yellow text-background text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                    {pendingReviews}
                  </span>
                )}
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
            ref={bellButtonRef}
            className="p-2 relative text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-yellow" />}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div ref={notificationsRef} className="absolute bottom-[calc(100%+12px)] left-0 w-[320px] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200 bg-white/40 backdrop-blur-[40px] border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[32px] flex flex-col">
              <div className="p-4 border-b border-white/10 font-bold text-white flex justify-between items-center bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 relative">
                  <Bell size={18} className="text-accent-cyan animate-pulse" />
                  <span className="tracking-tight text-lg">Notifications</span>
                </div>
                {unreadCount > 0 && <span className="glass-badge badge-cyan !px-2.5 !py-1 !text-[11px] font-bold shadow-lg ring-1 ring-white/20">{unreadCount} NEW</span>}
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Bell size={32} className="text-white/20" />
                    </div>
                    <div className="text-sm text-white/40 font-medium">Your inbox is empty</div>
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = n.title.toLowerCase().includes('project') ? FolderKanban : 
                                 n.title.toLowerCase().includes('student') ? Users : 
                                 n.title.toLowerCase().includes('message') ? MessageSquare : Bell;
                    return (
                      <Link 
                        key={n.id} 
                        href={n.link || "#"} 
                        onClick={() => { 
                          markAsRead(n.id); 
                          if (pathname === n.link) setShowNotifications(false);
                        }} 
                        className={`flex items-start gap-4 p-4 border-b border-white/5 transition-all hover:bg-white/10 group ${n.isRead ? 'opacity-50' : 'bg-white/[0.02]'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${n.isRead ? 'bg-white/5 text-white/30' : 'bg-accent-cyan/15 text-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm mb-1 leading-tight ${n.isRead ? 'text-white/70' : 'text-white font-bold'}`}>{n.title}</div>
                          <div className="text-xs text-white/40 line-clamp-2 leading-relaxed group-hover:text-white/60 transition-colors">{n.content}</div>
                          <div className="text-[10px] text-accent-cyan/40 mt-2 font-bold uppercase tracking-widest">{formatDateTime(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-accent-cyan mt-1.5 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
                      </Link>
                    );
                  })
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                  <button onClick={clearAllNotifications} className="text-[11px] font-bold text-accent-cyan hover:text-white transition-colors uppercase tracking-widest">Clear all notifications</button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
