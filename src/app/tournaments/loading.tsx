function SkeletonRow() {
  return (
    <div className="grid grid-cols-8 gap-2 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 animate-pulse">
      <div className="h-3 w-4 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      <div className="col-span-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      </div>
      <div className="h-3 w-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" />
      <div className="h-3 w-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" />
      <div className="h-3 w-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" />
      <div className="h-3 w-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" />
    </div>
  );
}

export default function TournamentsLoading() {
  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="zva-container py-12 space-y-10">
        {[1, 2].map((n) => (
          <div key={n}>
            <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse mb-6" />
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
