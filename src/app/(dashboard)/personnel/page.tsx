import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/permissions";
import Link from "next/link";
import { UserCog, Plus, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PersonnelPage() {

  const staff = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      projectStaff: {
        include: { project: { select: { id: true, title: true, status: true } } },
      },
    },
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="header-hero mb-2">Staff Directory</h1>
          <p className="text-text-secondary text-sm">
            {staff.length} active staff member{staff.length !== 1 ? "s" : ""}
          </p>
        </div>
        {true && (
          <Link href="/parametres" className="btn-glass btn-glass-primary">
            <Plus size={18} strokeWidth={2.5} /> Manage accounts
          </Link>
        )}
      </div>

      {staff.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center text-text-secondary">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <UserCog size={32} className="text-text-secondary opacity-50" />
          </div>
          <h3 className="font-bold text-white mb-1 text-xl">No staff</h3>
          <p className="text-sm">There are no active staff members in the directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gap-card">
          {staff.map((member) => (
            <div key={member.id} className="glass-card flex flex-col p-6 group">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner flex items-center justify-center font-bold text-lg text-white shrink-0 group-hover:border-accent-cyan/50 transition-colors">
                  {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white truncate text-base leading-tight mb-1" title={member.name}>{member.name}</div>
                  <span className="glass-badge badge-lime !px-2 !py-0.5 text-[10px]">{ROLE_LABELS[member.role]}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 text-xs text-text-secondary mb-6">
                <div className="flex items-center gap-2 truncate" title={member.email}>
                  <Mail size={14} className="opacity-70 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="opacity-70 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-glass-border">
                <div className="label-subtle mb-3">
                  Assigned projects ({member.projectStaff.length})
                </div>
                {member.projectStaff.length === 0 ? (
                  <p className="text-xs text-text-secondary/50 italic">No active assignments</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {member.projectStaff.slice(0, 3).map(ps => (
                      <Link 
                        key={ps.id} 
                        href={`/projets/${ps.project.id}`} 
                        className="text-xs text-white/80 hover:text-accent-cyan truncate transition-colors"
                      >
                        • {ps.project.title}
                      </Link>
                    ))}
                    {member.projectStaff.length > 3 && (
                      <span className="text-[10px] text-text-secondary font-medium mt-1">
                        +{member.projectStaff.length - 3} more project{member.projectStaff.length - 3 !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
