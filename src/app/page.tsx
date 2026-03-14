import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <section className="text-center">
        <h1 className="font-display text-4xl tracking-wide text-court-300">
          NBA Skins
        </h1>
        <p className="mt-2 text-gray-400">
          Paris amicaux sur les matchs NBA — Carlito, Papa, Vincent, Tonio
        </p>
      </section>
      <section className="grid gap-4">
        <Link
          href="/draft"
          className="flex items-center justify-between rounded-xl border border-court-700 bg-court-800/50 p-4 transition hover:border-court-600 hover:bg-court-800"
        >
          <span className="font-medium">Draft mensuelle</span>
          <span className="text-court-400">→</span>
        </Link>
        <Link
          href="/matchs"
          className="flex items-center justify-between rounded-xl border border-court-700 bg-court-800/50 p-4 transition hover:border-court-600 hover:bg-court-800"
        >
          <span className="font-medium">Matchs du mois</span>
          <span className="text-court-400">→</span>
        </Link>
        <Link
          href="/scores"
          className="flex items-center justify-between rounded-xl border border-court-700 bg-court-800/50 p-4 transition hover:border-court-600 hover:bg-court-800"
        >
          <span className="font-medium">Scores du mois</span>
          <span className="text-court-400">→</span>
        </Link>
        <Link
          href="/classement"
          className="flex items-center justify-between rounded-xl border border-court-700 bg-court-800/50 p-4 transition hover:border-court-600 hover:bg-court-800"
        >
          <span className="font-medium">Classement de saison</span>
          <span className="text-court-400">→</span>
        </Link>
      </section>
    </div>
  );
}
