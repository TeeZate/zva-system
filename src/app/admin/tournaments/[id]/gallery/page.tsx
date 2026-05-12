"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft, Upload, X, Loader2, Video, Image as ImageIcon, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase, supabase } from "@/lib/supabase";

interface PendingFile {
  file: File;
  preview: string;
  caption: string;
}

interface MediaItem {
  id: string;
  gallery_id: string;
  url: string;
  type: "photo" | "video";
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export default function GalleryPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournamentName, setTournamentName] = useState("Tournament");
  const [gallery, setGallery] = useState<any | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadGallery(gId: string) {
    const { data } = await supabase
      .from("media_items")
      .select("*")
      .eq("gallery_id", gId)
      .order("sort_order");
    setItems((data ?? []) as MediaItem[]);
  }

  useEffect(() => {
    async function init() {
      const [tRes, gRes] = await Promise.all([
        supabase.from("tournaments").select("name").eq("id", tournamentId).single(),
        supabase.from("media_galleries").select("*").eq("tournament_id", tournamentId).maybeSingle(),
      ]);
      if (tRes.data) setTournamentName(tRes.data.name);
      if (gRes.data) {
        setGallery(gRes.data);
        await loadGallery(gRes.data.id);
      }
    }
    init();
  }, [tournamentId]);

  async function ensureGallery(): Promise<string> {
    if (gallery) return gallery.id;
    const { data, error } = await adminSupabase
      .from("media_galleries")
      .insert({
        tournament_id: tournamentId,
        title: `${tournamentName} Gallery`,
        date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error || !data) throw new Error("Failed to create gallery");
    setGallery(data);
    return data.id;
  }

  function handleFilePick(files: FileList | null) {
    if (!files) return;
    const newFiles: PendingFile[] = [];
    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file);
      newFiles.push({ file, preview, caption: "" });
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }

  function updateCaption(idx: number, caption: string) {
    setPendingFiles((prev) => prev.map((f, i) => i === idx ? { ...f, caption } : f));
  }

  function removePending(idx: number) {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadAll() {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    try {
      const gId = await ensureGallery();
      let order = items.length;
      for (const pf of pendingFiles) {
        const fd = new FormData();
        fd.append("file", pf.file);
        fd.append("folder", "galleries");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) { toast.error("Upload failed: " + json.error); continue; }
        const type = pf.file.type.startsWith("video") ? "video" : "photo";
        await adminSupabase.from("media_items").insert({
          gallery_id: gId,
          url: json.url,
          type,
          caption: pf.caption || null,
          sort_order: order++,
        });
      }
      toast.success(`${pendingFiles.length} file(s) uploaded!`);
      setPendingFiles([]);
      await loadGallery(gId);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function addVideoLink() {
    if (!videoUrl.trim()) { toast.error("Enter a video URL"); return; }
    try {
      const gId = await ensureGallery();
      const { error } = await adminSupabase.from("media_items").insert({
        gallery_id: gId,
        url: videoUrl.trim(),
        type: "video",
        caption: videoCaption || null,
        sort_order: items.length,
      });
      if (error) throw error;
      toast.success("Video link added!");
      setVideoUrl("");
      setVideoCaption("");
      await loadGallery(gId);
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Remove this media item?")) return;
    const { error } = await adminSupabase.from("media_items").delete().eq("id", id);
    if (error) { toast.error("Failed: " + error.message); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Removed");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/tournaments" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />Tournaments
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Media Gallery — {tournamentName}</h1>
      </div>

      {/* Existing items grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
              {item.type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.caption ?? ""}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video flex flex-col items-center justify-center bg-zinc-800 gap-2">
                  <Video size={28} className="text-zinc-500" />
                  <p className="text-xs text-zinc-500 px-2 text-center truncate w-full">{item.url}</p>
                </div>
              )}
              {item.caption && (
                <p className="px-2 py-1.5 text-xs text-zinc-400 truncate">{item.caption}</p>
              )}
              <button
                onClick={() => deleteItem(item.id)}
                className="absolute top-1.5 right-1.5 bg-zinc-900/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !pendingFiles.length && (
        <div className="flex flex-col items-center justify-center h-48 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-600">
          <ImageIcon size={36} className="mb-2 opacity-30" />
          <p className="text-sm">No media yet — upload photos or add video links below</p>
        </div>
      )}

      {/* Add Photos / Videos */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Add Photos / Videos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFilePick(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              dragging
                ? "border-zva-green bg-zva-green/5"
                : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files)}
            />
            <Upload size={24} className="text-zinc-500" />
            <p className="text-sm text-zinc-400">
              <span className="text-zva-green font-semibold">Click to select</span> or drag & drop
            </p>
            <p className="text-xs text-zinc-600">Images and videos supported</p>
          </div>

          {pendingFiles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-300">{pendingFiles.length} file(s) pending:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pendingFiles.map((pf, idx) => (
                  <div key={idx} className="space-y-1.5 relative">
                    {pf.file.type.startsWith("video") ? (
                      <div className="aspect-video bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center">
                        <Video size={20} className="text-zinc-500" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pf.preview}
                        alt=""
                        className="aspect-video w-full object-cover rounded-lg border border-zinc-700"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removePending(idx)}
                      className="absolute top-1 right-1 bg-zinc-900/80 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <input
                      type="text"
                      placeholder="Caption..."
                      value={pf.caption}
                      onChange={(e) => updateCaption(idx, e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-zva-green placeholder-zinc-600"
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                onClick={uploadAll}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploading ? "Uploading..." : `Upload All (${pendingFiles.length})`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Video Link */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Video size={16} />
            Add Video Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="url"
              placeholder="YouTube, Vimeo, or direct video URL..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={videoCaption}
              onChange={(e) => setVideoCaption(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
            />
            <Button variant="primary" onClick={addVideoLink} className="gap-2 shrink-0">
              <Plus size={15} />
              Add Video
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
