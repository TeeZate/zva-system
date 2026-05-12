function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center border-b border-zinc-100 dark:border-zinc-800 animate-pulse">
      <div className="col-span-1 h-3 w-4 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
      </div>
      <div className="col-span-2 h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
      <div className="col-span-3 h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
      <div className="col-span-1 h-3 w-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" />
      <div className="col-span-1 h-3 w-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto" />
    </div>
  );
}

export default function PlayersLoading() {
  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="zva-container py-12">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-zinc-50 dark:bg-zinc-800">
            <div className="col-span-12 h-3 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
          </div>
          {Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </div>
  );
}
