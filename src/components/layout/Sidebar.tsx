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
      {/* Mobile Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 px-6 bg-white/10 backdrop-blur-2xl border-b border-white/20 z-50 flex md:hidden items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-sm">Avenir Souriant</span>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-white/70 hover:text-white transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
