function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 animate-pulse">
      <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      </div>
      <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" />
    </div>
  );
}

export default function ScoresLoading() {
  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-8">
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="zva-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}
