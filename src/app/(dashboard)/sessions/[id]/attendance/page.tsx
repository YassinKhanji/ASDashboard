"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Save, UserCheck, AlertCircle, Clock, XCircle, MinusCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateTime } from "@/lib/utils";

interface AttendanceRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  attendance: {
    id: string;
    status: string;
  } | null;
}

export default function AttendancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch session info
      const sessionRes = await fetch(`/api/sessions/${id}`);
      if (!sessionRes.ok) throw new Error("Session not found");
      const sessionData = await sessionRes.json();
      setSessionInfo(sessionData);

      // Fetch attendance records
      const res = await fetch(`/api/sessions/${id}/attendance`);
      if (!res.ok) throw new Error("Failed to load attendance");
      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateStatus(studentId: string, status: string) {
    setRecords(prev => prev.map(r => 
      r.studentId === studentId 
        ? { ...r, attendance: { id: r.attendance?.id || "new", status } } 
        : r
    ));
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        records: records.map(r => ({
          studentId: r.studentId,
          status: r.attendance?.status || "PRESENT" // Default to present if not touched
        }))
      };

      const res = await fetch(`/api/sessions/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save attendance");
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "PRESENT": return <CheckCircle size={18} className="text-[#a8e063]" />;
      case "ABSENT": return <XCircle size={18} className="text-red-400" />;
      case "LATE": return <Clock size={18} className="text-[#f5c518]" />;
      case "EXCUSED": return <MinusCircle size={18} className="text-[#4db8ff]" />;
      default: return null;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !records.length) {
    return (
      <div className="glass-card text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Error</h3>
        <p className="text-text-secondary mb-6">{error}</p>
        <button onClick={() => router.back()} className="btn-glass">Go Back</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="header-hero">{t('mark_attendance')}</h1>
            <p className="text-text-secondary text-sm">
              {sessionInfo?.project?.title} · {formatDateTime(sessionInfo?.startTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-[#a8e063] text-sm font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4">
              <CheckCircle size={16} /> {t('attendance_recorded')}
            </span>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="btn-glass btn-glass-primary px-6"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} 
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Attendance Header Bar */}
      <div className="glass-card p-0 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 label-subtle w-1/3">Student</th>
                <th className="px-6 py-4 label-subtle text-center">{t('present')}</th>
                <th className="px-6 py-4 label-subtle text-center">{t('absent')}</th>
                <th className="px-6 py-4 label-subtle text-center">{t('late')}</th>
                <th className="px-6 py-4 label-subtle text-center">{t('excused')}</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* Attendance List / Content */}
      <div className="glass-card p-0 overflow-hidden min-h-[300px] flex flex-col">
        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <tbody className="divide-y divide-glass-border/30">
                {records.map((record) => (
                  <tr key={record.studentId} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5 w-1/3">
                      <div className="font-bold text-white">{record.firstName} {record.lastName}</div>
                      <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Enrolled Student</div>
                    </td>
                    
                    {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => {
                      const isActive = record.attendance?.status === status || (!record.attendance && status === "PRESENT");
                      return (
                        <td key={status} className="px-6 py-5 text-center">
                          <button
                            onClick={() => updateStatus(record.studentId, status)}
                            className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center mx-auto
                              ${isActive 
                                ? status === "PRESENT" ? "bg-[#a8e063]/20 border-[#a8e063]/40 text-[#a8e063]" :
                                  status === "ABSENT" ? "bg-red-500/20 border-red-500/40 text-red-400" :
                                  status === "LATE" ? "bg-[#f5c518]/20 border-[#f5c518]/40 text-[#f5c518]" :
                                  "bg-[#4db8ff]/20 border-[#4db8ff]/40 text-[#4db8ff]"
                                : "bg-white/5 border-white/5 text-white/20 hover:border-white/20 hover:text-white/40"
                              }
                            `}
                          >
                            {getStatusIcon(status)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-3xl bg-white/5 mb-4">
              <UserCheck size={40} className="text-text-secondary/40" />
            </div>
            <p className="text-text-secondary italic">No students enrolled in this project.</p>
          </div>
        )}
      </div>
    </div>
  );
}
