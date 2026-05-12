"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSupabase } from "@/lib/supabase";
import FileUpload from "@/components/admin/FileUpload";

export default function NewArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const nowStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "general",
    published_at: nowStr(),
    is_featured: false,
    tags: [] as string[],
    thumbnail_url: "",
    video_url: "",
    author: "ZVA Media",
    author_title: "",
    author_photo_url: "",
  });

  useEffect(() => {
    if (!slugManuallyEdited && form.title) {
      const base = form.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);
      setForm((p) => ({ ...p, slug: base + (base ? "-" + Date.now().toString(36) : "") }));
    }
  }, [form.title, slugManuallyEdited]);

  const set = (k: string, v: string | boolean | string[]) => setForm((p) => ({ ...p, [k]: v }));

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      set("tags", [...form.tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    set("tags", form.tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await adminSupabase.from("news_articles").insert({
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content,
      category: form.category,
      published_at: new Date(form.published_at).toISOString(),
      is_featured: form.is_featured,
      tags: form.tags,
      thumbnail_url: form.thumbnail_url || null,
      video_url: form.video_url || null,
      author: form.author,
      author_title: form.author_title || null,
      author_photo_url: form.author_photo_url || null,
    } as any);
    if (error) {
      toast.error("Failed to publish: " + error.message);
    } else {
      toast.success("Article published!");
      router.push("/admin/news");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/news" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ChevronLeft size={16} />News
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-black text-white">Write Article</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left col — content */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Title *</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Article headline..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-xl font-bold focus:outline-none focus:border-zva-green placeholder-zinc-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => { setSlugManuallyEdited(true); set("slug", e.target.value); }}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Excerpt</label>
                  <textarea
                    rows={3}
                    value={form.excerpt}
                    onChange={(e) => set("excerpt", e.target.value)}
                    placeholder="Brief summary shown in article cards..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Article Body — separate paragraphs with blank lines
                  </label>
                  <textarea
                    required
                    rows={16}
                    value={form.content}
                    onChange={(e) => set("content", e.target.value)}
                    placeholder="Write your article here..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-zva-green placeholder-zinc-600 resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right col — meta */}
          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                  >
                    <option value="general">General</option>
                    <option value="match_report">Match Report</option>
                    <option value="announcement">Announcement</option>
                    <option value="transfer">Transfer</option>
                    <option value="national_team">National Team</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Published At</label>
                  <input
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(e) => set("published_at", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={form.is_featured}
                    onChange={(e) => set("is_featured", e.target.checked)}
                    className="w-4 h-4 accent-zva-green"
                  />
                  <label htmlFor="featured" className="text-sm text-zinc-300">Featured article</label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="Add tag..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                    />
                    <Button type="button" variant="ghost" onClick={addTag} className="px-3 text-zinc-400 hover:text-white">
                      <Plus size={15} />
                    </Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-full px-2.5 py-1"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-red-400">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-800 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Media</p>
                  <FileUpload
                    folder="news"
                    onUpload={(url) => set("thumbnail_url", url)}
                    currentUrl={form.thumbnail_url}
                    label="Cover Image"
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Video URL</label>
                    <input
                      type="url"
                      value={form.video_url}
                      onChange={(e) => set("video_url", e.target.value)}
                      placeholder="YouTube or video URL..."
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Author</p>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Author Name</label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => set("author", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Author Title</label>
                    <input
                      type="text"
                      value={form.author_title}
                      onChange={(e) => set("author_title", e.target.value)}
                      placeholder="Communications Officer"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
                    />
                  </div>
                  <FileUpload
                    folder="authors"
                    onUpload={(url) => set("author_photo_url", url)}
                    currentUrl={form.author_photo_url}
                    label="Author Photo"
                  />
                </div>

                <Button type="submit" variant="primary" disabled={saving} className="w-full gap-2 mt-2">
                  <Save size={15} />
                  {saving ? "Publishing..." : "Publish Article"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
