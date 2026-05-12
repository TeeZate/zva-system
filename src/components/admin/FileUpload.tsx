"use client";
import React, { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  accept?: string;
  currentUrl?: string | null;
  label?: string;
}

export default function FileUpload({
  onUpload,
  folder = "general",
  accept = "image/*",
  currentUrl,
  label = "Upload File",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://");

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      const isImage = file.type.startsWith("image/");
      setFileName(file.name);

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      if (!isConfigured) {
        const fakeUrl = `https://example.com/zva-uploads/${folder}/${file.name}`;
        toast.info("Supabase not configured — using placeholder URL");
        onUpload(fakeUrl);
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        onUpload(json.url);
        toast.success("File uploaded successfully");
      } catch (err: any) {
        toast.error("Upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
    },
    [folder, isConfigured, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-zinc-300">{label}</p>}

      {preview ? (
        <div className="relative inline-block">
          {preview.startsWith("data:image") || preview.startsWith("https://") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="max-h-40 max-w-xs rounded-lg border border-zinc-700 object-cover"
            />
          ) : null}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : fileName ? (
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300">
          <ImageIcon size={14} className="text-zinc-500" />
          <span className="truncate">{fileName}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto text-zinc-500 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors select-none",
          dragging
            ? "border-zva-green bg-zva-green/5"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50",
          uploading && "opacity-60 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        {uploading ? (
          <>
            <Loader2 size={22} className="text-zva-green animate-spin" />
            <p className="text-sm text-zinc-400">Uploading...</p>
          </>
        ) : (
          <>
            <Upload size={22} className="text-zinc-500" />
            <p className="text-sm text-zinc-400">
              <span className="text-zva-green font-semibold">Click to upload</span> or drag & drop
            </p>
            {accept && (
              <p className="text-xs text-zinc-600">{accept}</p>
            )}
            {!isConfigured && (
              <p className="text-xs text-amber-500 mt-1">Supabase not configured — uploads use placeholder URLs</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
