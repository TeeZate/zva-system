export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-zva-green border-t-transparent animate-spin" />
        <p className="text-zinc-500 text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}
