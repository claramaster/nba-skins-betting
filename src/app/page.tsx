import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-lg space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          NBA Skins
        </h1>
        <p className="mt-2 text-neutral-500">
          Paris amicaux — Carlito, Papa, Vincent, Tonio
        </p>
      </section>
      <section className="grid gap-3">
        <Link
          href="/draft"
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-card transition hover:border-neutral-300 hover:shadow-card-hover active:scale-[0.99]"
        >
          <span className="font-medium text-neutral-900">Draft mensuelle</span>
          <span className="text-neutral-400">→</span>
        </Link>
        <Link
          href="/matchs"
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-card transition hover:border-neutral-300 hover:shadow-card-hover active:scale-[0.99]"
        >
          <span className="font-medium text-neutral-900">Matchs du mois</span>
          <span className="text-neutral-400">→</span>
        </Link>
        <Link
          href="/scores"
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-card transition hover:border-neutral-300 hover:shadow-card-hover active:scale-[0.99]"
        >
          <span className="font-medium text-neutral-900">Scores du mois</span>
          <span className="text-neutral-400">→</span>
        </Link>
        <Link
          href="/classement"
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-card transition hover:border-neutral-300 hover:shadow-card-hover active:scale-[0.99]"
        >
          <span className="font-medium text-neutral-900">Classement de saison</span>
          <span className="text-neutral-400">→</span>
        </Link>
      </section>
    </div>
  );
}
