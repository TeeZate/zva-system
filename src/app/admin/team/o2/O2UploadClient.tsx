"use client";
import React, { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, CheckCircle, Clock, XCircle, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadO2Form } from "./actions";

const CURRENT_SEASON = "2025/2026";
const SEASONS = ["2025/2026", "2024/2025", "2023/2024"];

const statusConfig = {
  pending: { label: "Pending Review", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  approved: { label: "Approved", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  return bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

// This component receives uploads + teamId as props from a server wrapper
export default function O2UploadPageClient({
  uploads,
  teamId,
  teamName,
}: {
  uploads: any[];
  teamId: string;
  teamName: string;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [season, setSeason] = useState(CURRENT_SEASON);
  const [playerCount, setPlayerCount] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, JPG, PNG, or WEBP files accepted");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("season", season);
    fd.append("team_id", teamId);
    if (playerCount) fd.append("player_count", playerCount);

    startTransition(async () => {
      const result = await uploadO2Form(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("O2 form submitted for review");
        setSelectedFile(null);
        setPlayerCount("");
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/team" className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">O2 Form Upload</h1>
          <p className="text-sm text-zinc-500">FIVB Player Registration · {teamName}</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <span className="font-semibold">What is an O2 form?</span> The FIVB O2 is the official player registration document required to register players for international and national competitions. Upload one PDF per season. Your submission will be reviewed by the ZVA registrar.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Upload form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Upload size={15} />
                New Submission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Season */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Season</label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                  >
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Player count */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Player Count <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={playerCount}
                    onChange={(e) => setPlayerCount(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                  />
                </div>

                {/* File drop zone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">O2 Document</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`
                      relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                      ${dragOver ? "border-zva-green bg-zva-green/5" : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"}
                      ${selectedFile ? "border-emerald-500/50" : ""}
                    `}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-medium text-white truncate">{selectedFile.name}</div>
                          <div className="text-xs text-zinc-500">{formatBytes(selectedFile.size)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto mb-2 text-zinc-500" />
                        <p className="text-sm text-zinc-400 font-medium">Drop file here or click to browse</p>
                        <p className="text-xs text-zinc-600 mt-1">PDF, JPG, PNG, WEBP · Max 10 MB</p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || isPending}
                  className="w-full bg-zva-green hover:bg-zva-green/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      Submit for Review
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText size={15} />
                Submission History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploads.length === 0 ? (
                <div className="py-10 text-center text-zinc-600 text-sm">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  No submissions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {uploads.map((upload) => {
                    const cfg = statusConfig[upload.status as keyof typeof statusConfig];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={upload.id}
                        className={`flex items-start gap-3 p-4 rounded-xl bg-zinc-800 border ${cfg.border}`}
                      >
                        <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={15} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold text-white truncate">{upload.file_name}</span>
                            <span className={`text-xs font-semibold shrink-0 ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <div className="text-xs text-zinc-500 mb-1">
                            Season: <span className="text-zinc-400">{upload.season}</span>
                            {upload.player_count && (
                              <> · <span className="text-zinc-400">{upload.player_count} players</span></>
                            )}
                            {" "}· {formatBytes(upload.file_size_bytes)}
                          </div>
                          {upload.reviewer_notes && (
                            <div className="text-xs bg-zinc-700 rounded-lg px-3 py-2 text-zinc-300 mt-2">
                              <span className="font-semibold text-zinc-400">Reviewer note: </span>
                              {upload.reviewer_notes}
                            </div>
                          )}
                          <div className="text-xs text-zinc-600 mt-1">Submitted {timeAgo(upload.uploaded_at)}</div>
                        </div>
                        <a
                          href={upload.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-xs text-zva-green hover:underline"
                        >
                          View
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
