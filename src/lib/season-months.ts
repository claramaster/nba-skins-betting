/**
 * Organisation par mois de la saison.
 * Nov = novembre 2025, Dec = décembre 2025, Jan = janvier 2026, Fev = février 2026, Mar/Avr = mars et avril 2026.
 */

export type MonthSlug = "nov" | "dec" | "jan" | "fev" | "mar-avr";

export interface SeasonMonthConfig {
  slug: MonthSlug;
  year: number;
  month: number;
  /** Label court pour la nav (onglet) */
  navLabel: string;
  /** Nom complet pour affichage (ex: "novembre 2025") */
  fullName: string;
}

/** Mois de la saison, dans l’ordre d’affichage (accueil + onglets). */
export const SEASON_MONTHS: SeasonMonthConfig[] = [
  { slug: "nov", year: 2025, month: 11, navLabel: "Nov", fullName: "novembre 2025" },
  { slug: "dec", year: 2025, month: 12, navLabel: "Dec", fullName: "décembre 2025" },
  { slug: "jan", year: 2026, month: 1, navLabel: "Jan", fullName: "janvier 2026" },
  { slug: "fev", year: 2026, month: 2, navLabel: "Fev", fullName: "février 2026" },
  { slug: "mar-avr", year: 2026, month: 3, navLabel: "Mar/Avr", fullName: "mars et avril 2026" },
];

const slugToConfig = new Map<MonthSlug, SeasonMonthConfig>(
  SEASON_MONTHS.map((m) => [m.slug, m])
);

export function getMonthBySlug(slug: string): SeasonMonthConfig | null {
  return slugToConfig.get(slug as MonthSlug) ?? null;
}

export function isSeasonMonthSlug(slug: string): slug is MonthSlug {
  return slugToConfig.has(slug as MonthSlug);
}
