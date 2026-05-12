import React from "react";
import Link from "next/link";
import { Trophy, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

const links = {
  competition: [
    { href: "/tournaments", label: "Tournaments" },
    { href: "/scores", label: "Live Scores" },
    { href: "/standings", label: "Standings" },
    { href: "/fixtures", label: "Fixtures" },
  ],
  association: [
    { href: "/teams", label: "Teams" },
    { href: "/players", label: "Players" },
    { href: "/officials", label: "Officials" },
    { href: "/news", label: "News" },
  ],
  info: [
    { href: "/about", label: "About ZVA" },
    { href: "/contact", label: "Contact Us" },
    { href: "/rules", label: "Rules & Regulations" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-300 border-t border-zinc-800">
      {/* Top section */}
      <div className="zva-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-zva-green flex items-center justify-center">
                <span className="text-white font-black text-xl leading-none">ZVA</span>
              </div>
              <div>
                <div className="font-black text-white text-base leading-none">ZIMBABWE VOLLEYBALL</div>
                <div className="font-semibold text-zva-gold text-sm mt-0.5">ASSOCIATION</div>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              The governing body for volleyball in Zimbabwe — promoting, developing, and growing the sport at all levels across the nation since 1980.
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2.5 text-zinc-400">
                <MapPin size={14} className="text-zva-gold shrink-0" />
                <span>8 Josiah Tongogara Ave, Harare, Zimbabwe</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Phone size={14} className="text-zva-gold shrink-0" />
                <span>+263 4 706 611</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Mail size={14} className="text-zva-gold shrink-0" />
                <span>info@zva.co.zw</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">
                {section === "competition" ? "Competition" : section === "association" ? "Association" : "Information"}
              </h3>
              <ul className="space-y-2.5">
                {items.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-zinc-400 hover:text-zva-gold transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Flag stripe */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-zva-green" />
        <div className="flex-1 bg-zva-gold" />
        <div className="flex-1 bg-zva-red" />
        <div className="flex-1 bg-black" />
      </div>

      {/* Bottom */}
      <div className="zva-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} Zimbabwe Volleyball Association. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Trophy size={12} className="text-zva-gold" />
            Affiliated to FIVB & CAV
          </span>
          <Link href="https://www.fivb.com" target="_blank" className="hover:text-zva-gold transition-colors flex items-center gap-1">
            FIVB <ExternalLink size={10} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
