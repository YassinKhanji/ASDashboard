"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCog,
  CalendarDays,
  MessageSquare,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Vue d'ensemble", tooltip: "Vue d'ensemble" },
  { href: "/projets", icon: FolderKanban, label: "Projets", tooltip: "Projets" },
  { href: "/etudiants", icon: Users, label: "Étudiants", tooltip: "Étudiants" },
  { href: "/personnel", icon: UserCog, label: "Personnel", tooltip: "Personnel" },
  { href: "/calendrier", icon: CalendarDays, label: "Calendrier", tooltip: "Calendrier" },
  { href: "/discussions", icon: MessageSquare, label: "Discussions", tooltip: "Discussions" },
  { href: "/revue", icon: ClipboardCheck, label: "Gouvernance", tooltip: "Gouvernance" },
];

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile Drawer Navigation */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
        <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-[#1a2f3a]/95 border-r border-white/10 backdrop-blur-2xl transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold text-lg">Avenir Souriant</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2 text-white/50 hover:text-white touch-target">
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
            {navItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 min-h-[52px] rounded-2xl transition-all active:scale-95 ${
                    active 
                      ? "bg-accent-cyan text-black font-bold shadow-[0_0_20px_rgba(77,184,255,0.3)]" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-6 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
                {user?.name ? user.name.substring(0,2).toUpperCase() : "AS"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold truncate text-sm">{user?.name || "Admin"}</div>
                <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest truncate">{user?.role || "Gérant"}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 px-4 bg-[#1a2f3a]/80 backdrop-blur-xl border-b border-white/10 z-[90] flex md:hidden items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Avenir Souriant</span>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu size={26} />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="
        hidden md:flex relative h-full w-[64px] flex-col px-0 py-6 rounded-[32px]
        bg-white/10 backdrop-blur-2xl border border-white/20
        shadow-[0_8px_32px_rgba(0,0,0,0.3)] shrink-0 z-50 items-center justify-between
      ">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-inner mb-4 shrink-0">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col gap-3 flex-1 justify-center items-center">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={index}
                href={item.href}
                className={`p-2.5 rounded-full transition-all duration-300 group relative ${
                  active
                    ? "bg-white/20 text-white shadow-inner"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon size={20} className="md:w-[18px] md:h-[18px]" strokeWidth={active ? 2.5 : 2} />
                
                {/* Tooltip - Desktop only */}
                <div className="hidden md:block absolute left-full ml-4 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.tooltip}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-glass border border-white/20 mt-4 cursor-pointer">
          {user?.name ? user.name.substring(0,2).toUpperCase() : "AS"}
        </div>
      </aside>
    </>
  );
}
