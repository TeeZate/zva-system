"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft, Download, Upload, UserPlus, Trash2,
  Plus, Loader2, Users, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase, supabase } from "@/lib/supabase";
import { getPositionLabel } from "@/lib/utils";
import type { Player } from "@/lib/types";

const VALID_POS = ["setter","outside_hitter","middle_blocker","opposite","libero","defensive_specialist"];
const STAFF_ROLES = ["Coach","Assistant Coach","Manager","Doctor","Physiotherapist","Other"];

interface ParsedPlayer {
  first_name: string;
  last_name: string;
  number: number | null;
  position: string | null;
  date_of_birth: string | null;
  height_cm: number | null;
  nationality: string;
  is_national_team: boolean;
}

function parseCSV(text: string): ParsedPlayer[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines
    .slice(1)
    .map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = vals[i] ?? ""; });
      return {
        first_name: o.first_name || "",
        last_name: o.last_name || "",
        number: o.number ? parseInt(o.number) : null,
        position: VALID_POS.includes(o.position) ? o.position : null,
        date_of_birth: o.date_of_birth || null,
        height_cm: o.height_cm ? parseInt(o.height_cm) : null,
        nationality: o.nationality || "Zimbabwean",
        is_national_team: o.is_national_team === "true",
      };
    })
    .filter((p) => p.first_name && p.last_name);
}

const CSV_TEMPLATE = `first_name,last_name,number,position,date_of_birth,height_cm,nationality,is_national_team\nJohn,Doe,7,setter,1998-05-15,185,Zimbabwean,false`;

export default function RosterPage() {
  const params = useParams();
  const teamId = params.id as string;

  const [teamName, setTeamName] = useState("Team");
  const [players, setPlayers] = useState<Player[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedPlayer[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [csvDragging, setCsvDragging] = useState(false);

  // Staff form
  const [staffForm, setStaffForm] = useState({
    name: "", role: "Coach", email: "", phone: "",
  });
  const [addingStaff, setAddingStaff] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);

  async function loadPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("last_name");
    setPlayers((data ?? []) as Player[]);
    setLoadingPlayers(false);
  }

  async function loadStaff() {
    const { data } = await supabase
      .from("team_staff")
      .select("*")
      .eq("team_id", teamId)
      .order("name");
    setStaff(data ?? []);
  }

  useEffect(() => {
    supabase.from("teams").select("name").eq("id", teamId).single().then(({ data }) => {
      if (data) setTeamName(data.name);
    });
    loadPlayers();
    loadStaff();
  }, [teamId]);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zva-o2-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No valid rows found. Check CSV headers.");
        return;
      }
      setParsedRows(rows);
      toast.success(`Parsed ${rows.length} player(s) from CSV`);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setImportProgress(0);
    let count = 0;
    for (const p of parsedRows) {
      await adminSupabase.from("players").insert({
        ...p,
        team_id: teamId,
        career_points: 0,
        career_aces: 0,
        career_blocks: 0,
      });
      count++;
      setImportProgress(count);
    }
    toast.success(`Imported ${count} player(s)!`);
    setParsedRows([]);
    setImporting(false);
    loadPlayers();
  }

  async function removeFromTeam(playerId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this team?`)) return;
    const { error } = await adminSupabase
      .from("players")
      .update({ team_id: null })
      .eq("id", playerId);
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success(`${name} removed from roster`);
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  }

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!staffForm.name) return;
    setAddingStaff(true);
    const { error } = await adminSupabase.from("team_staff").insert({
      team_id: teamId,
      name: staffForm.name,
      role: staffForm.role,
      email: staffForm.email || null,
      phone: staffForm.phone || null,
    });
    if (error) {
      toast.error("Failed to add staff: " + error.message);
    } else {
      toast.success("Staff member added");
      setStaffForm({ name: "", role: "Coach", email: "", phone: "" });
      loadStaff();
    }
    setAddingStaff(false);
  }

  async function deleteStaff(id: string, name: string) {
    if (!window.confirm(`Remove ${name}?`)) return;
    await adminSupabase.from("team_staff").delete().eq("id", id);
    toast.success("Removed");
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/teams" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Teams
        </Link>
        <span className="text-zinc-700">/</span>
        <Link href={`/admin/teams/${teamId}`} className="text-sm text-zinc-400 hover:text-white">{teamName}</Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Roster</h1>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — Current Roster */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Users size={16} />
                Current Roster
                <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full font-normal">
                  {players.length}
                </span>
              </CardTitle>
              <Link href={`/admin/players/new?team_id=${teamId}`}>
                <Button variant="ghost" className="text-xs gap-1.5 text-zinc-400 hover:text-white">
                  <UserPlus size={13} />Add Player
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingPlayers ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />)}
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                <Users size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No players on this roster yet</p>
                <p className="text-xs mt-1">Import via CSV or add manually</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs">#</th>
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs">Name</th>
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs hidden md:table-cell">Position</th>
                      <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs hidden lg:table-cell">Height</th>
                      <th className="text-right px-4 py-2.5 text-zinc-500 font-medium text-xs"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {players.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">
                          {p.number != null ? `#${p.number}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-white font-medium text-sm">
                          {p.first_name} {p.last_name}
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          {p.position ? (
                            <span className="text-xs text-zinc-400">{getPositionLabel(p.position)}</span>
                          ) : <span className="text-zinc-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell text-zinc-500 text-xs">
                          {p.height_cm ? `${p.height_cm}cm` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => removeFromTeam(p.id, `${p.first_name} ${p.last_name}`)}
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                            title="Remove from team"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right — O2 CSV Upload */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText size={16} />
              Import via O2 Registration Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              Upload your ZVA O2 CSV to bulk-register players for this team.
            </p>

            <Button
              type="button"
              variant="ghost"
              onClick={downloadTemplate}
              className="gap-2 text-zinc-400 hover:text-white w-full justify-start"
            >
              <Download size={14} />
              Download Template CSV
            </Button>

            {/* Drop zone */}
            <div
              onClick={() => csvInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setCsvDragging(true); }}
              onDragLeave={() => setCsvDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setCsvDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleCsvFile(file);
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                csvDragging
                  ? "border-zva-green bg-zva-green/5"
                  : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"
              }`}
            >
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvFile(file);
                }}
              />
              <Upload size={22} className="mx-auto text-zinc-500 mb-2" />
              <p className="text-sm text-zinc-400">
                <span className="text-zva-green font-semibold">Click to select</span> or drag & drop
              </p>
              <p className="text-xs text-zinc-600 mt-1">CSV or TXT files</p>
            </div>

            {/* Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-300">{parsedRows.length} player(s) to import:</p>
                <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-900">
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-3 py-2 text-zinc-500">Name</th>
                        <th className="text-left px-3 py-2 text-zinc-500">#</th>
                        <th className="text-left px-3 py-2 text-zinc-500">Position</th>
                        <th className="text-left px-3 py-2 text-zinc-500">Height</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {parsedRows.map((p, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30">
                          <td className="px-3 py-1.5 text-white">{p.first_name} {p.last_name}</td>
                          <td className="px-3 py-1.5 text-zinc-400">{p.number ?? "—"}</td>
                          <td className="px-3 py-1.5 text-zinc-400">{p.position ?? "—"}</td>
                          <td className="px-3 py-1.5 text-zinc-400">{p.height_cm ? `${p.height_cm}cm` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {importing ? (
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <Loader2 size={16} className="animate-spin text-zva-green" />
                    Importing {importProgress}/{parsedRows.length}...
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleImport} className="gap-2 flex-1">
                      <Plus size={14} />
                      Import {parsedRows.length} Players
                    </Button>
                    <Button variant="ghost" onClick={() => setParsedRows([])} className="text-zinc-500">
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Staff Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Team Officials & Staff</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {staff.length > 0 && (
            <div className="border border-zinc-800 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs">Name</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs">Role</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs hidden md:table-cell">Phone</th>
                    <th className="text-right px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-white font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{s.role}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-zinc-500 text-xs">{s.email ?? "—"}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-zinc-500 text-xs">{s.phone ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => deleteStaff(s.id, s.name)}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add staff form */}
          <form onSubmit={addStaff} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              required
              type="text"
              placeholder="Name *"
              value={staffForm.name}
              onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
            />
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zva-green"
            >
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              type="email"
              placeholder="Email"
              value={staffForm.email}
              onChange={(e) => setStaffForm((p) => ({ ...p, email: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
            />
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Phone"
                value={staffForm.phone}
                onChange={(e) => setStaffForm((p) => ({ ...p, phone: e.target.value }))}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
              />
              <Button type="submit" variant="primary" disabled={addingStaff} className="gap-1.5 shrink-0">
                {addingStaff ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
