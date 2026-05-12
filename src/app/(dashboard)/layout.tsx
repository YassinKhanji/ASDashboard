"use client";

import { useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/projets": "Projects",
  "/etudiants": "Students",
  "/personnel": "Staff",
  "/calendrier": "Calendar",
  "/discussions": "Discussions",
  "/revue": "Governance",
  "/parametres": "Settings",
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock user for public access
  const mockUser = {
    name: "ASC Administrator",
    role: "ADMIN",
  };

  // Get page title from pathname
  const baseRoute = "/" + (pathname.split("/")[1] || "");
  const pageTitle = PAGE_TITLES[baseRoute] || "Dashboard";

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url('/bg-plant.png')", backgroundColor: "#111c22" }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" />

      <div className="relative z-10 flex flex-1 w-full max-w-[1400px] mx-auto px-0 sm:px-4 md:px-12 lg:px-16 pt-20 md:pt-12 pb-0 sm:pb-4 md:pb-12 lg:pb-16 min-h-0 items-start gap-6">
        <Sidebar user={mockUser as any} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 h-full min-w-0 bg-white/10 backdrop-blur-[40px] border border-white/20 rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mr-4 pr-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardContent>{children}</DashboardContent>;
}
