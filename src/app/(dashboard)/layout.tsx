"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Providers from "@/components/Providers";
import Sidebar from "@/components/layout/Sidebar";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="h-screen w-screen bg-[#111c22]" />;
  }

  if (!session?.user) return null;

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-0 sm:p-4 md:p-12 lg:p-16 overflow-hidden"
      style={{ backgroundImage: "url('/bg-plant.png')", backgroundColor: "#111c22" }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" />
      
      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-[1600px] h-full md:h-[calc(100vh-100px)] max-md:max-h-none md:max-h-[900px] items-stretch md:items-center gap-4 md:gap-6">
        <Sidebar user={session.user as any} isOpen={false} onClose={() => {}} />
        <main className="flex-1 min-w-0 bg-white/10 backdrop-blur-[40px] border-t border-white/20 md:border rounded-none md:rounded-[32px] p-4 sm:p-6 md:p-8 flex flex-col text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative mb-16 md:mb-0">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mr-4 pr-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  );
}
