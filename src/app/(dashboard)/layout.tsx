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
      
      <div className="relative z-10 flex w-full max-w-[1400px] h-full max-h-[900px] items-center gap-6 mt-20 md:mt-0">
        <Sidebar user={session.user as any} isOpen={false} onClose={() => {}} />
        <main className="flex-1 h-full min-w-0 bg-white/10 backdrop-blur-[40px] border border-white/20 rounded-[32px] p-6 sm:p-8 flex flex-col text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative">
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
