"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Settings, Users, DoorOpen, Plus, X, Save } from "lucide-react";
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
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "INSTRUCTOR", phone: "" });
  const [roomForm, setRoomForm] = useState({ name: "", capacity: 20, color: "#3b82f6" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") { router.push("/"); return; }
    Promise.all([
      fetch("/api/parametres/users").then(r => r.json()),
      fetch("/api/rooms").then(r => r.json()),
    ]).then(([u, r]) => { setUsers(u); setRooms(r); }).finally(() => setLoading(false));
  }, [session, router]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/parametres/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm) });
      if (res.ok) {
        const user = await res.json();
        setUsers(prev => [...prev, user]);
        setShowUserModal(false);
        setUserForm({ name: "", email: "", password: "", role: "INSTRUCTOR", phone: "" });
      }
    } finally { setSaving(false); }
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(roomForm) });
      if (res.ok) {
        const room = await res.json();
        setRooms(prev => [...prev, room]);
        setShowRoomModal(false);
        setRoomForm({ name: "", capacity: 20, color: "#3b82f6" });
      }
    } finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage users and rooms</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          <Users size={16} /> Users
        </button>
        <button className={`tab ${activeTab === "rooms" ? "active" : ""}`} onClick={() => setActiveTab("rooms")}>
          <DoorOpen size={16} /> Rooms
        </button>
      </div>

      {activeTab === "users" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
              <Plus size={18} /> New user
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontSize: "0.85rem" }}>{u.email}</td>
                    <td><span className="badge badge-active">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</span></td>
                    <td style={{ fontSize: "0.85rem" }}>{u.phone || "—"}</td>
                    <td><span className={`badge ${u.isActive ? "badge-approved" : "badge-archived"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "rooms" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button className="btn btn-primary" onClick={() => setShowRoomModal(true)}>
              <Plus size={18} /> New room
            </button>
          </div>
          <div className="card-grid">
            {rooms.map(r => (
              <div key={r.id} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: r.color }} />
                  <h3 style={{ fontWeight: 600 }}>{r.name}</h3>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Capacity: {r.capacity} people</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New user</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group"><label className="form-label">Full name <span className="form-required">*</span></label><input className="form-input" required value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Email <span className="form-required">*</span></label><input className="form-input" type="email" required value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Password <span className="form-required">*</span></label><input className="form-input" type="password" required value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="COMMITTEE">Committee</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New room</h3>
              <button className="modal-close" onClick={() => setShowRoomModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group"><label className="form-label">Name <span className="form-required">*</span></label><input className="form-input" required value={roomForm.name} onChange={e => setRoomForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Room D" /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Capacity</label><input className="form-input" type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: parseInt(e.target.value) || 20 }))} /></div>
                <div className="form-group"><label className="form-label">Color</label><input className="form-input" type="color" value={roomForm.color} onChange={e => setRoomForm(p => ({ ...p, color: e.target.value }))} style={{ padding: "4px", height: "42px" }} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
