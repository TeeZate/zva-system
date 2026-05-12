import React from "react";
import Link from "next/link";
import { Newspaper, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { formatRelative, getCategoryLabel } from "@/lib/utils";
import type { NewsArticle, NewsCategory } from "@/lib/types";

export const metadata = { title: "News" };

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  match_report: "bg-blue-100 text-blue-700",
  announcement: "bg-zva-green/10 text-zva-green",
  transfer: "bg-purple-100 text-purple-700",
  national_team: "bg-zva-gold/20 text-amber-700",
  general: "bg-zinc-100 text-zinc-600",
};

async function getNews() {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("news_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(30);
    return (data ?? []) as NewsArticle[];
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const news = await getNews();
  const featured = news.filter((n) => n.is_featured).slice(0, 1)[0];
  const rest = news.filter((n) => !n.is_featured || n.id !== featured?.id);

  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zva-green/10 flex items-center justify-center">
              <Newspaper size={24} className="text-zva-green" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white">News & Media</h1>
              <p className="text-sm text-zinc-400">Latest from Zimbabwe volleyball</p>
            </div>
          </div>
        </div>
      </div>

      <div className="zva-container py-12">
        {/* Featured */}
        {featured && (
          <Link href={`/news/${featured.slug}`} className="group block mb-10">
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-zva-green/30">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="h-72 lg:h-auto bg-gradient-to-br from-zva-green to-zva-green-dark relative overflow-hidden">
                  {featured.thumbnail_url ? (
                    <img
                      src={featured.thumbnail_url}
                      alt={featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Newspaper size={64} className="text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge variant="gold">⭐ Featured</Badge>
                  </div>
                </div>
                <CardContent className="p-8 lg:p-10 flex flex-col justify-center">
                  <Badge className={`${CATEGORY_COLORS[featured.category]} mb-4 self-start`}>
                    {getCategoryLabel(featured.category)}
                  </Badge>
                  <h2 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white mb-4 leading-tight group-hover:text-zva-green transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-zinc-500 leading-relaxed mb-6 line-clamp-3">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {formatRelative(featured.published_at)}
                    </div>
                    <span>By {featured.author}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rest.map((article) => (
              <Link key={article.id} href={`/news/${article.slug}`} className="group">
                <Card className="h-full overflow-hidden hover:shadow-md hover:border-zva-green/30 transition-all duration-300">
                  <div className="h-44 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 relative overflow-hidden">
                    {article.thumbnail_url ? (
                      <img
                        src={article.thumbnail_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zva-green/20 to-zva-green-dark/20 flex items-center justify-center">
                        <Newspaper size={32} className="text-zinc-400" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <Badge className={`${CATEGORY_COLORS[article.category]} text-[10px]`}>
                        {getCategoryLabel(article.category)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-2 group-hover:text-zva-green transition-colors mb-2 leading-snug">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{article.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} />
                        {formatRelative(article.published_at)}
                      </div>
                      <span>{article.author}</span>
                    </div>
                    {article.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full px-2 py-0.5">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {news.length === 0 && (
          <div className="text-center py-24 text-zinc-400">
            <Newspaper size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No news articles yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
