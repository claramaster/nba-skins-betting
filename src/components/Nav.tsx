"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/draft", label: "Draft" },
  { href: "/matchs", label: "Matchs" },
  { href: "/scores", label: "Scores" },
  { href: "/classement", label: "Saison" },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="sticky top-0 z-10 border-b border-court-700/50 bg-court-900/95 backdrop-blur">
      <div className="flex items-center justify-between px-3 py-2">
        <Link href="/" className="font-display text-xl tracking-wide text-court-300">
          NBA Skins
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded px-2 py-1.5 text-sm font-medium ${
                pathname === href
                  ? "bg-court-600 text-white"
                  : "text-court-200 hover:bg-court-800"
              }`}
            >
              {label}
            </Link>
          ))}
          <form action={logout} className="ml-1">
            <button type="submit" className="rounded px-2 py-1.5 text-sm text-gray-400 hover:bg-court-800 hover:text-white">
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
