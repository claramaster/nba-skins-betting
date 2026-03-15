"use client";

import { useEffect, useState } from "react";
import { SEASON_MONTHS } from "@/lib/season-months";

type Player = { id: string; name: string; slug: string };
type MonthKey = { year: number; month: number };

const DISPLAY_ORDER = ["carlito", "papa", "vincent", "tonio"];

/** Points passés par mois (ordre joueurs : Carlito, Papa, Vincent, Tonio). */
const STATIC_SKIN_POINTS: Record<number, number[]> = {
  11: [6, 1, 3, 0],   // novembre
  12: [0, 6, 6, 1],   // décembre
  1: [0, 1, 6, 6],    // janvier
  2: [6, 3, 1, 1],   // février
};

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [months, setMonths] = useState<MonthKey[]>([]);
  const [pointsByPlayerMonth, setPointsByPlayerMonth] = useState<
    Record<string, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/season")
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players ?? []);
        setMonths(data.months ?? []);
        setPointsByPlayerMonth(data.pointsByPlayerMonth ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  const playersOrdered = [...(players ?? [])].sort(
    (a, b) => DISPLAY_ORDER.indexOf(a.slug) - DISPLAY_ORDER.indexOf(b.slug)
  );
  if (playersOrdered.length && DISPLAY_ORDER.indexOf(playersOrdered[0]!.slug) < 0) {
    playersOrdered.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  const overUnderPoints: Record<string, number> = {};
  if (playersOrdered.length >= 4) {
    const defaults = [16, 24, 23, 20];
    playersOrdered.forEach((p, i) => {
      overUnderPoints[p.id] = defaults[i] ?? 0;
    });
  }

  const skinRows = SEASON_MONTHS.map((m) => ({
    year: m.year,
    month: m.month,
    label: `Skins - ${m.fullName}`,
    staticPoints: STATIC_SKIN_POINTS[m.month],
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Récapitulatif des points
      </h1>

      {loading ? (
        <p className="text-neutral-500">Chargement…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="p-4 font-medium text-neutral-500">Jeu</th>
                {playersOrdered.map((p) => (
                  <th key={p.id} className="p-4 text-center font-medium text-neutral-500">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                <td className="p-4 font-medium text-neutral-900">Over / Under</td>
                {playersOrdered.map((p) => (
                  <td key={p.id} className="p-4 text-center font-semibold text-accent">
                    {overUnderPoints[p.id] ?? "—"}
                  </td>
                ))}
              </tr>
              {skinRows.map((row) => (
                <tr key={`${row.year}-${row.month}`} className="border-b border-neutral-100 last:border-0">
                  <td className="p-4 font-medium text-neutral-900">{row.label}</td>
                  {playersOrdered.map((p, i) => {
                    const staticVal = row.staticPoints?.[i];
                    const apiKey = `${row.year}-${row.month}`;
                    const apiVal = pointsByPlayerMonth[p.id]?.[apiKey];
                    const pts = staticVal != null ? staticVal : apiVal;
                    return (
                      <td key={p.id} className="p-4 text-center font-semibold text-accent">
                        {pts != null && pts > 0 ? pts : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
