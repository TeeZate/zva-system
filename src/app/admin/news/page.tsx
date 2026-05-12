"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Star, Trash2, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase, adminSupabase } from "@/lib/supabase";

const CATEGORY_LABELS: Record<string, string> = {
  match_report: "Match Report",
  announcement: "Announcement",
  transfer: "Transfer",
  national_team: "National Team",
  general: "General",
};

const CATEGORY_VARIANTS: Record<string, "primary" | "gold" | "outline"> = {
  match_report: "primary",
  national_team: "gold",
  announcement: "outline",
  transfer: "outline",
  general: "outline",
};

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false });
    setArticles(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFeaturedToggle(id: string, current: boolean) {
    const { error } = await adminSupabase
      .from("news_articles")
      .update({ is_featured: !current })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      setArticles((prev) => prev.map((a) => a.id === id ? { ...a, is_featured: !current } : a));
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    const { error } = await adminSupabase.from("news_articles").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success("Article deleted");
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  }

  function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">News</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{articles.length} articles</p>
        </div>
        <Link href="/admin/news/new">
          <Button variant="primary" className="gap-2">
            <Plus size={16} />
            Write Article
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-zinc-800 rounded-lg animate-pulse" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
          <Newspaper size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-zinc-400">No articles yet</p>
          <Link href="/admin/news/new" className="mt-4">
            <Button variant="primary" className="gap-2"><Plus size={15} />Write Article</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium w-12">Cover</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">Author</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Date</th>
                <th className="text-center px-4 py-3 text-zinc-500 font-medium">Featured</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    {a.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.thumbnail_url}
                        alt={a.title}
                        className="h-9 w-14 rounded object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="h-9 w-14 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <Newspaper size={14} className="text-zinc-600" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium line-clamp-1">{a.title}</p>
                    <p className="text-zinc-600 text-xs truncate">{a.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={CATEGORY_VARIANTS[a.category] ?? "outline"} className="text-xs">
                      {CATEGORY_LABELS[a.category] ?? a.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-400 text-xs">{a.author}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-400 text-xs">{fmt(a.published_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleFeaturedToggle(a.id, a.is_featured)}
                      className={`transition-colors ${a.is_featured ? "text-yellow-400 hover:text-yellow-300" : "text-zinc-600 hover:text-zinc-400"}`}
                      title={a.is_featured ? "Remove from featured" : "Mark as featured"}
                    >
                      <Star size={16} fill={a.is_featured ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/news/${a.id}`}
                        className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.title)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
