"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "./actions";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const error = await signIn(email, password);
    if (error) {
      toast.error(error);
      setLoading(false);
    } else {
      // Full reload ensures the proxy picks up the new session cookie
      window.location.href = "/admin";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-zva-green flex items-center justify-center">
            <span className="text-white font-black text-lg">ZVA</span>
          </div>
          <div>
            <div className="font-black text-white text-lg leading-tight">Admin Panel</div>
            <div className="text-xs text-zinc-500">Zimbabwe Volleyball Association</div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-5">
          <div>
            <h1 className="text-xl font-black text-white mb-1">Sign in</h1>
            <p className="text-sm text-zinc-500">ZVA administrators only</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zva.org.zw"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-zva-green placeholder-zinc-600"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          This area is restricted to authorised ZVA personnel only.
        </p>
      </div>
    </div>
  );
}
