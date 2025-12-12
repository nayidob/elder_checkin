"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/call", label: "Call", icon: "📞" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
  { href: "/pricing", label: "Settings", icon: "⚙️" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-20 mx-auto flex h-16 max-w-md items-center justify-between rounded-t-3xl bg-white px-6 shadow-[0_-6px_30px_rgba(0,0,0,0.1)] ring-1 ring-amber-100">
      {links.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-1 flex-col items-center justify-center text-xs font-semibold transition ${
              isActive ? "text-amber-500" : "text-slate-500"
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

