function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-pulse">
      <div className="h-44 bg-zinc-200 dark:bg-zinc-700" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3" />
      </div>
    </div>
  );
}

export default function NewsLoading() {
  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="zva-container py-12">
        <div className="h-72 bg-zinc-200 dark:bg-zinc-700 rounded-2xl animate-pulse mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}
