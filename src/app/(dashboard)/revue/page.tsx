import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardCheck, Clock, CheckCircle2, XCircle, AlertCircle, PlayCircle } from "lucide-react";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, formatDate, formatDateTime } from "@/lib/utils";
export const dynamic = "force-dynamic";

export default async function RevuePage() {

  const pendingProjects = await prisma.project.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { updatedAt: "asc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { enrollments: true, reviewActions: true } },
    },
  });

  const recentActions = await prisma.reviewAction.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      reviewer: { select: { name: true } },
      project: { select: { id: true, title: true } },
    },
  });

  function getStatusColor(status: string) {
    if (status === "ACTIVE" || status === "APPROVED") return "badge-lime";
    if (status === "UNDER_REVIEW") return "badge-yellow";
    return "badge-white";
  }

  function getActionColor(action: string) {
    if (action === "APPROVE") return "border-accent-lime text-accent-lime";
    if (action === "REJECT") return "border-red-500 text-red-500";
    return "border-accent-yellow text-accent-yellow";
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="header-hero mb-2">Review & Approvals</h1>
        <p className="text-text-secondary text-sm">
          {pendingProjects.length} project{pendingProjects.length !== 1 ? "s" : ""} pending action
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gap-card">
        {/* Pending Queue */}
        <div className="lg:col-span-2 glass-card flex flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-6 border-b border-glass-border">
            <Clock size={18} strokeWidth={1.5} className="text-accent-yellow" />
            <h3 className="font-bold text-white text-lg">Action Queue</h3>
          </div>

          {pendingProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary">
              <ClipboardCheck size={32} className="mb-4 opacity-50" />
              <h3 className="font-bold text-white mb-1">No projects pending</h3>
              <p className="text-sm">You're all caught up! All submitted projects have been reviewed.</p>
            </div>
          ) : (
            <>
            {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-glass-border/50 bg-white/5">
                  <th className="px-6 py-4 label-subtle">Project</th>
                  <th className="px-6 py-4 label-subtle">Status</th>
                  <th className="px-6 py-4 label-subtle">Revisions</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/50">
                {pendingProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/projets/${project.id}`} className="block font-bold text-white group-hover:text-accent-cyan transition-colors truncate">
                            {project.title}
                          </Link>
                          <div className="text-xs text-text-secondary mt-1">
                            By {project.createdBy.name} · <span className="glass-badge badge-white !px-1.5 !py-0.5 ml-1">{PROJECT_TYPE_LABELS[project.type as keyof typeof PROJECT_TYPE_LABELS]}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`glass-badge ${getStatusColor(project.status)}`}>
                        {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      {project._count.reviewActions}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/projets/${project.id}`} className="btn-glass btn-glass-primary inline-flex">
                        <PlayCircle size={16} /> Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-white/5">
            {pendingProjects.map((p) => (
              <div key={p.id} className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white truncate">{p.title}</h4>
                    <div className="text-[10px] text-white/40 mt-1 font-bold uppercase tracking-wider">
                      By {p.createdBy.name} · {PROJECT_TYPE_LABELS[p.type as keyof typeof PROJECT_TYPE_LABELS]}
                    </div>
                  </div>
                  <span className={`glass-badge !px-2 !py-0.5 !text-[9px] ${getStatusColor(p.status)}`}>
                    {PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {p._count.reviewActions} Revisions
                  </div>
                  <Link href={`/projets/${p.id}`} className="btn-glass btn-glass-primary !py-1.5 !px-4 !text-xs">
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        {/* Recent Actions Sidebar */}
        <div className="glass-card flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardCheck size={18} strokeWidth={1.5} className="text-accent-cyan" />
            <h3 className="font-bold text-white text-lg">Recent History</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
            {recentActions.length === 0 ? (
              <p className="text-sm text-text-secondary">No recent actions.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentActions.map((a) => (
                  <div key={a.id} className={`p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors border-l-4 ${getActionColor(a.action)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm flex items-center gap-1.5">
                        {a.action === "APPROVE" ? <CheckCircle2 size={14}/> : a.action === "REJECT" ? <XCircle size={14}/> : <AlertCircle size={14}/>}
                        {a.action === "APPROVE" ? "Approved" : a.action === "REJECT" ? "Rejected" : "Revision requested"}
                      </span>
                      <span className="text-[10px] text-text-secondary">{formatDateTime(a.createdAt)}</span>
                    </div>
                    <div className="text-xs text-white/80">
                      <Link href={`/projets/${a.project.id}`} className="font-semibold text-accent-cyan hover:underline">{a.project.title}</Link>
                      {" "}by {a.reviewer.name}
                    </div>
                    {a.notes && <p className="text-xs text-text-secondary mt-2 bg-black/20 p-2 rounded-lg">{a.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
