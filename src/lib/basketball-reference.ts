/**
 * Récupère et parse les scores des matchs NBA d’un mois depuis basketball-reference.com.
 */

const BBREF_ABBR_TO_OUR: Record<string, string> = {
  BRK: "BKN",
  CHO: "CHA",
  PHO: "PHX",
};

export type BRefGame = {
  date: string; // YYYY-MM-DD
  visitor_abbreviation: string;
  visitor_pts: number;
  home_abbreviation: string;
  home_pts: number;
  winner_abbreviation: string; // celui qui a le plus de pts
};

function normalizeAbbr(abbr: string): string {
  return BBREF_ABBR_TO_OUR[abbr] ?? abbr;
}

/**
 * Parse le HTML de la page "Schedule and Results" d’un mois (ex. mars 2026).
 * Retourne la liste des matchs avec scores.
 */
export function parseScheduleMonthHtml(html: string, year: number, month: number): BRefGame[] {
  const games: BRefGame[] = [];
  // Rows: chaque <tr> peut contenir deux liens /teams/XXX/YYYY.html et deux scores
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const teamLinkRegex = /\/teams\/([A-Z]{2,3})\/\d+\.html/gi;
  const rows = html.match(rowRegex) ?? [];

  const monthStr = String(month).padStart(2, "0");
  let dayCounter = 0;

  for (const row of rows) {
    const teamMatches = [...row.matchAll(teamLinkRegex)];
    if (teamMatches.length < 2) continue;

    const visitorAbbr = teamMatches[0][1]!;
    const homeAbbr = teamMatches[1][1]!;

    // Scores: deux nombres entre 50 et 200 (typique NBA)
    const scoreRegex = /\b(8\d|9\d|1[0-4]\d|15[0-5])\b/g;
    const scores = row.match(scoreRegex);
    if (!scores || scores.length < 2) continue;

    const visitorPts = parseInt(scores[0], 10);
    const homePts = parseInt(scores[1], 10);

    // Date: box score link contient 20260301 (YYYYMMDD)
    const boxMatch = row.match(/\/boxscores\/(20\d{2})(\d{2})(\d{2})\d*\.html/);
    let dateStr: string;
    if (boxMatch) {
      dateStr = `${boxMatch[1]}-${boxMatch[2]}-${boxMatch[3]}`;
    } else {
      const dateParam = row.match(/month=(\d+)&day=(\d+)&year=(\d+)/);
      if (dateParam) {
        const m = dateParam[1]!.padStart(2, "0");
        const d = dateParam[2]!.padStart(2, "0");
        dateStr = `${dateParam[3]}-${m}-${d}`;
      } else {
        dayCounter++;
        dateStr = `${year}-${monthStr}-${String(Math.min(dayCounter, 31)).padStart(2, "0")}`;
      }
    }

    const winnerAbbr = homePts > visitorPts ? homeAbbr : visitorAbbr;

    games.push({
      date: dateStr,
      visitor_abbreviation: normalizeAbbr(visitorAbbr),
      visitor_pts: visitorPts,
      home_abbreviation: normalizeAbbr(homeAbbr),
      home_pts: homePts,
      winner_abbreviation: normalizeAbbr(winnerAbbr),
    });
  }

  return games;
}

export function getScheduleMonthUrl(year: number, month: number): string {
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const monthSlug = monthNames[month - 1];
  return `https://www.basketball-reference.com/leagues/NBA_${year}_games-${monthSlug}.html`;
}
