"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCog,
  CalendarDays,
  MessageSquare,
  ClipboardCheck,
} from "lucide-react";

interface SidebarProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", icon: LayoutDashboard, tooltip: "Vue d'ensemble" },
  { href: "/projets", icon: FolderKanban, tooltip: "Projets" },
  { href: "/etudiants", icon: Users, tooltip: "Étudiants" },
  { href: "/personnel", icon: UserCog, tooltip: "Personnel" },
  { href: "/calendrier", icon: CalendarDays, tooltip: "Calendrier" },
  { href: "/discussions", icon: MessageSquare, tooltip: "Discussions" },
  { href: "/revue", icon: ClipboardCheck, tooltip: "Gouvernance" },
];

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[64px] h-full py-6 rounded-[32px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] shrink-0 z-50 flex flex-col items-center justify-between">
      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-inner mb-4 shrink-0">
        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col gap-3 flex-1 justify-center">
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
              <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
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
  );
}
