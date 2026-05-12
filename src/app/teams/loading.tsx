function SkeletonTeamCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-pulse">
      <div className="h-24 bg-zinc-200 dark:bg-zinc-700" />
      <div className="p-4 -mt-6 relative space-y-3">
        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 border-4 border-white dark:border-zinc-900" />
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
      </div>
    </div>
  );
}

export default function TeamsLoading() {
  return (
    <div className="pt-16 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="zva-container py-12">
          <div className="h-8 w-36 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="zva-container py-12 space-y-12">
        {[8, 6, 4].map((n, i) => (
          <div key={i}>
            <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: n }).map((_, j) => <SkeletonTeamCard key={j} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
