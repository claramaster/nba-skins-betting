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
    <nav className="sticky top-0 z-10 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold text-neutral-900"
        >
          NBA Skins
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                pathname === href
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              }`}
            >
              {label}
            </Link>
          ))}
          <form action={logout} className="ml-1">
            <button
              type="submit"
              className="rounded-xl px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              Changer de profil
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
