"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Users, Plus, Mail, Shield, ShieldOff, KeyRound,
  ChevronDown, X, Eye, EyeOff, Lock, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTeamAdmin, toggleAdminActive, resetAdminPassword, deleteAdmin } from "./actions";
import type { AdminUser } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  team_admin: "Team Admin",
  statistician: "Statistician",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 365) return `${Math.floor(d / 365)}y ago`;
  if (d > 30) return `${Math.floor(d / 30)}mo ago`;
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  return h > 0 ? `${h}h ago` : "just now";
}

export default function AdminsClient({
  admins,
  teams,
}: {
  admins: AdminUser[];
  teams: { id: string; name: string; short_name: string }[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ userId: string; email: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState("team_admin");
  const [teamId, setTeamId]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [usePassword, setUsePassword] = useState(true); // default: set password directly

  function resetForm() {
    setEmail(""); setRole("team_admin"); setTeamId("");
    setPassword(""); setShowPw(false); setUsePassword(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (usePassword && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const fd = new FormData();
    fd.append("email", email);
    fd.append("role", role);
    fd.append("team_id", teamId);
    if (usePassword) fd.append("password", password);
    startTransition(async () => {
      const { error } = await createTeamAdmin(fd);
      if (error) {
        toast.error(error);
      } else {
        toast.success(usePassword ? `Account created for ${email}` : `Invite sent to ${email}`);
        resetForm();
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  async function handleToggle(userId: string, currentlyActive: boolean) {
    startTransition(async () => {
      const { error } = await toggleAdminActive(userId, !currentlyActive);
      if (error) toast.error(error);
      else {
        toast.success(currentlyActive ? "Admin disabled" : "Admin enabled");
        router.refresh();
      }
    });
  }

  async function handleReset(userId: string, email: string) {
    startTransition(async () => {
      const { error } = await resetAdminPassword(userId);
      if (error) toast.error(error);
      else toast.success(`Password reset email sent to ${email}`);
    });
  }

  async function handleDelete(userId: string) {
    startTransition(async () => {
      const { error } = await deleteAdmin(userId);
      if (error) toast.error(error);
      else {
        toast.success("Admin account permanently deleted");
        setConfirmDelete(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Admin Users</h1>
          <p className="text-sm text-zinc-500">Manage team admin access and accounts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-zva-green hover:bg-zva-green/90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Add Admin
        </button>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-red-900/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Delete Admin Account?</h2>
                <p className="text-xs text-zinc-500 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              This will permanently delete <span className="text-white font-semibold">{confirmDelete.email}</span> from the system.
              They will lose all access immediately.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.userId)}
                disabled={isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white">Create Admin Account</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">

              {/* Method toggle */}
              <div className="flex rounded-xl overflow-hidden border border-zinc-700 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setUsePassword(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
                    usePassword ? "bg-zva-green text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Lock size={13} /> Set Password
                </button>
                <button
                  type="button"
                  onClick={() => setUsePassword(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
                    !usePassword ? "bg-zva-green text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Mail size={13} /> Email Invite
                </button>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@zva.co.zw"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                  />
                </div>
              </div>

              {/* Password field — only shown in Set Password mode */}
              {usePassword && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showPw ? "text" : "password"}
                      required={usePassword}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600">Account is created immediately — share credentials securely.</p>
                </div>
              )}

              {!usePassword && (
                <p className="text-xs text-zinc-600 -mt-1">An invitation email will be sent so they can set their own password.</p>
              )}

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green appearance-none"
                  >
                    <option value="team_admin">Team Admin</option>
                    <option value="statistician">Statistician (COURT Scout)</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Team selector */}
              {role === "team_admin" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Assigned Team</label>
                  <div className="relative">
                    <select
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green appearance-none"
                    >
                      <option value="">— Select team —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowCreate(false); }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-zva-green hover:bg-zva-green/90 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : usePassword ? (
                    <Lock size={14} />
                  ) : (
                    <Mail size={14} />
                  )}
                  {usePassword ? "Create Account" : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admins table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Users size={15} />
            {admins.length} Admin{admins.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-sm">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No admin accounts yet.</p>
              <p className="text-xs mt-1">Add a team admin to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => {
                const teamName = (admin.team as any)?.name ?? null;
                return (
                  <div
                    key={admin.user_id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      admin.is_active ? "bg-zinc-800" : "bg-zinc-900 opacity-60"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-zinc-300">
                        {admin.email?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">{admin.email ?? "—"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          admin.role === "super_admin"
                            ? "bg-zva-gold/20 text-amber-400"
                            : admin.role === "statistician"
                            ? "bg-purple-500/15 text-purple-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {ROLE_LABELS[admin.role] ?? admin.role}
                        </span>
                        {!admin.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">Disabled</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {teamName ? `Team: ${teamName}` : "No team assigned"}
                        {" · "}Created {timeAgo(admin.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReset(admin.user_id, admin.email ?? "")}
                        disabled={isPending || !admin.is_active}
                        className="p-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-zinc-400 hover:text-white transition-colors"
                        title="Send password reset email"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => handleToggle(admin.user_id, admin.is_active)}
                        disabled={isPending}
                        className={`p-2 rounded-xl transition-colors ${
                          admin.is_active
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                        }`}
                        title={admin.is_active ? "Disable account" : "Enable account"}
                      >
                        {admin.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ userId: admin.user_id, email: admin.email ?? "this user" })}
                        disabled={isPending}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete account permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
