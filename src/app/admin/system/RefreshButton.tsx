"use client";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function SystemRefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 1200);
  }

  return (
    <button
      onClick={refresh}
      className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
    >
      <RefreshCw size={14} className={spinning ? "animate-spin" : ""} />
      Refresh
    </button>
  );
}
