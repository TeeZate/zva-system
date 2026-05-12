import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatRelative, getCategoryLabel } from "@/lib/utils";
import type { NewsArticle, NewsCategory } from "@/lib/types";
import type { Metadata } from "next";

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  match_report: "bg-blue-100 text-blue-700",
  announcement: "bg-zva-green/10 text-zva-green",
  transfer: "bg-purple-100 text-purple-700",
  national_team: "bg-zva-gold/20 text-amber-700",
  general: "bg-zinc-100 text-zinc-600",
};

async function getArticle(slug: string): Promise<NewsArticle | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("news_articles")
      .select("*")
      .eq("slug", slug)
      .single();
    return data as NewsArticle | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: article.thumbnail_url
      ? { images: [{ url: article.thumbnail_url }] }
      : undefined,
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <div className="relative bg-zinc-900">
        {article.thumbnail_url ? (
          <img
            src={article.thumbnail_url}
            alt={article.title}
            className="w-full h-72 md:h-96 object-cover opacity-40"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <Newspaper size={64} className="text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 zva-container pb-10 pt-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to News
          </Link>
          <Badge className={`${CATEGORY_COLORS[article.category]} mb-3`}>
            {getCategoryLabel(article.category)}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight max-w-3xl">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-zinc-400 mt-4">
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              {formatRelative(article.published_at)}
            </div>
            <span>By {article.author}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="zva-container py-12">
        <div className="max-w-3xl mx-auto">
          {article.excerpt && (
            <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 font-medium border-l-4 border-zva-green pl-5">
              {article.excerpt}
            </p>
          )}

          <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-a:text-zva-green prose-img:rounded-xl">
            {article.content.split("\n").map((para, i) =>
              para.trim() ? (
                <p key={i} className="mb-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {para}
                </p>
              ) : (
                <br key={i} />
              )
            )}
          </div>

          {article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={14} className="text-zinc-400" />
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full px-3 py-1"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-zva-green hover:text-zva-green/80 font-semibold text-sm transition-colors"
            >
              <ArrowLeft size={14} />
              All news
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
