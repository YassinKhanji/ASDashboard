"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Users, DoorOpen, Plus, X, Save, Edit3, Trash2, Power, Shield,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";

interface UserData {
  id: string; name: string; email: string; role: string; phone: string | null; isActive: boolean;
}
interface RoomData {
  id: string; name: string; capacity: number; color: string;
}

export default function ParametresPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "INSTRUCTOR", phone: "" });
  const [roomForm, setRoomForm] = useState({ name: "", capacity: 20, color: "#3b82f6" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") { router.push("/"); return; }
    Promise.all([
      fetch("/api/parametres/users").then(r => r.json()),
      fetch("/api/rooms").then(r => r.json()),
    ]).then(([u, r]) => { setUsers(u); setRooms(r); }).finally(() => setLoading(false));
  }, [session, router]);

  // ─── User CRUD ────────────────────────────────────────
  function openCreateUser() {
    setEditingUser(null);
    setUserForm({ name: "", email: "", password: "", role: "INSTRUCTOR", phone: "" });
    setError("");
    setShowUserModal(true);
  }

  function openEditUser(u: UserData) {
    setEditingUser(u);
    setUserForm({ name: u.name, email: u.email, password: "", role: u.role, phone: u.phone || "" });
    setError("");
    setShowUserModal(true);
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editingUser) {
        // Edit existing user
        const res = await fetch(`/api/parametres/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          setShowUserModal(false);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to update user");
        }
      } else {
        // Create new user
        if (!userForm.password) { setError("Password is required"); setSaving(false); return; }
        const res = await fetch("/api/parametres/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        if (res.ok) {
          const user = await res.json();
          setUsers(prev => [...prev, user]);
          setShowUserModal(false);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to create user");
        }
      }
    } finally { setSaving(false); }
  }

  async function toggleUserActive(u: UserData) {
    try {
      const res = await fetch(`/api/parametres/users/${u.id}`, { method: "PATCH" });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(x => x.id === updated.id ? updated : x));
      }
    } catch { /* silent */ }
  }

  // ─── Room CRUD ────────────────────────────────────────
  function openCreateRoom() {
    setEditingRoom(null);
    setRoomForm({ name: "", capacity: 20, color: "#3b82f6" });
    setError("");
    setShowRoomModal(true);
  }

  function openEditRoom(r: RoomData) {
    setEditingRoom(r);
    setRoomForm({ name: r.name, capacity: r.capacity, color: r.color });
    setError("");
    setShowRoomModal(true);
  }

  async function handleSaveRoom(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editingRoom) {
        const res = await fetch(`/api/rooms/${editingRoom.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
          setShowRoomModal(false);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to update room");
        }
      } else {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomForm),
        });
        if (res.ok) {
          const room = await res.json();
          setRooms(prev => [...prev, room]);
          setShowRoomModal(false);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to create room");
        }
      }
    } finally { setSaving(false); }
  }

  async function handleDeleteRoom(r: RoomData) {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/rooms/${r.id}`, { method: "DELETE" });
      if (res.ok) {
        setRooms(prev => prev.filter(x => x.id !== r.id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete room");
      }
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-glass-border border-t-accent-cyan rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-accent-cyan/50 transition-colors";
  const selectClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-accent-cyan/50 transition-colors appearance-none";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="header-hero mb-2">Settings</h1>
          <p className="text-text-secondary text-sm">Manage users, rooms, and system settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-fit">
        {[
          { key: "users", icon: Users, label: "Users" },
          { key: "rooms", icon: DoorOpen, label: "Rooms" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "bg-accent-cyan text-black shadow-[0_0_15px_rgba(77,184,255,0.4)]"
                : "text-text-secondary hover:text-white hover:bg-white/10"
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateUser} className="btn-glass btn-glass-primary">
              <Plus size={16} /> New User
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block glass-card p-0 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border/50 bg-white/5">
                  <th className="px-6 py-4 label-subtle">Name</th>
                  <th className="px-6 py-4 label-subtle">Email</th>
                  <th className="px-6 py-4 label-subtle">Role</th>
                  <th className="px-6 py-4 label-subtle">Phone</th>
                  <th className="px-6 py-4 label-subtle">Status</th>
                  <th className="px-6 py-4 label-subtle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`glass-badge ${
                        u.role === "ADMIN" ? "badge-cyan" : u.role === "COMMITTEE" ? "badge-yellow" : "badge-lime"
                      }`}>
                        {(ROLE_LABELS as Record<string, string>)[u.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{u.phone || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`glass-badge ${u.isActive ? "badge-lime" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditUser(u)} className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => toggleUserActive(u)} className={`p-2 rounded-lg transition-colors ${u.isActive ? "text-text-secondary hover:text-red-400 hover:bg-red-500/10" : "text-text-secondary hover:text-[#a8e063] hover:bg-[#a8e063]/10"}`} title={u.isActive ? "Deactivate" : "Activate"}>
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {users.map(u => (
              <div key={u.id} className="glass-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-xs text-text-secondary">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/10"><Edit3 size={14} /></button>
                    <button onClick={() => toggleUserActive(u)} className="p-1.5 rounded-lg text-text-secondary hover:text-red-400"><Power size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`glass-badge ${u.role === "ADMIN" ? "badge-cyan" : u.role === "COMMITTEE" ? "badge-yellow" : "badge-lime"}`}>
                    {(ROLE_LABELS as Record<string, string>)[u.role]}
                  </span>
                  <span className={`glass-badge ${u.isActive ? "badge-lime" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rooms Tab */}
      {activeTab === "rooms" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateRoom} className="btn-glass btn-glass-primary">
              <Plus size={16} /> New Room
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(r => (
              <div key={r.id} className="glass-card p-5 hover:border-accent-cyan/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md shrink-0" style={{ background: r.color }} />
                    <h3 className="font-bold text-white">{r.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditRoom(r)} className="p-2 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteRoom(r)} className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">Capacity: {r.capacity} people</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUserModal(false)}>
          <div className="glass-card w-full max-w-md rounded-b-none sm:rounded-b-[24px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg">
                {editingUser ? "Edit User" : "New User"}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="label-subtle block mb-1">Full Name <span className="text-[#f5c518]">*</span></label>
                <input className={inputClass} required value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label-subtle block mb-1">Email <span className="text-[#f5c518]">*</span></label>
                <input className={inputClass} type="email" required value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              {!editingUser && (
                <div>
                  <label className="label-subtle block mb-1">Password <span className="text-[#f5c518]">*</span></label>
                  <input className={inputClass} type="password" required value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-subtle block mb-1">Role</label>
                  <select className={selectClass} value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="INSTRUCTOR" className="bg-[#1a2f3a]">Instructor</option>
                    <option value="COMMITTEE" className="bg-[#1a2f3a]">Committee</option>
                    <option value="ADMIN" className="bg-[#1a2f3a]">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="label-subtle block mb-1">Phone</label>
                  <input className={inputClass} value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-glass">Cancel</button>
                <button type="submit" className="btn-glass btn-glass-primary" disabled={saving}>
                  <Save size={14} /> {saving ? "Saving..." : editingUser ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRoomModal(false)}>
          <div className="glass-card w-full max-w-md rounded-b-none sm:rounded-b-[24px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg">
                {editingRoom ? "Edit Room" : "New Room"}
              </h3>
              <button onClick={() => setShowRoomModal(false)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="label-subtle block mb-1">Room Name <span className="text-[#f5c518]">*</span></label>
                <input className={inputClass} required value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Room D" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-subtle block mb-1">Capacity</label>
                  <input className={inputClass} type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: parseInt(e.target.value) || 20 }))} />
                </div>
                <div>
                  <label className="label-subtle block mb-1">Color</label>
                  <input className={`${inputClass} h-[42px] p-1`} type="color" value={roomForm.color} onChange={e => setRoomForm(p => ({ ...p, color: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => setShowRoomModal(false)} className="btn-glass">Cancel</button>
                <button type="submit" className="btn-glass btn-glass-primary" disabled={saving}>
                  <Save size={14} /> {saving ? "Saving..." : editingRoom ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
