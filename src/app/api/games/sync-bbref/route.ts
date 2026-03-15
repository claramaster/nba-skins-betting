import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getScheduleMonthUrl,
  parseScheduleMonthHtml,
  type BRefGame,
} from "@/lib/basketball-reference";
import { NBA_TEAMS_STATIC } from "@/lib/nba-teams-static";

export const dynamic = "force-dynamic";

const abbrToId = Object.fromEntries(
  NBA_TEAMS_STATIC.map((t) => [t.abbreviation, t.id])
);

function gameToRow(
  g: BRefGame,
  draftId: string,
  nbaGameId: number
) {
  const homeId = abbrToId[g.home_abbreviation] ?? null;
  const visitorId = abbrToId[g.visitor_abbreviation] ?? null;
  const winnerId = abbrToId[g.winner_abbreviation] ?? null;
  if (homeId == null || visitorId == null) return null;

  return {
    draft_id: draftId,
    nba_game_id: nbaGameId,
    game_date: g.date,
    home_team_id: homeId,
    visitor_team_id: visitorId,
    home_team_abbreviation: g.home_abbreviation,
    visitor_team_abbreviation: g.visitor_abbreviation,
    home_score: g.home_pts,
    visitor_score: g.visitor_pts,
    winner_team_id: winnerId,
    status: "Final",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Synchronise les résultats de matchs d’un mois depuis basketball-reference.com
 * (sans clé API). Body: { year, month }.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const year = Number(body.year ?? new Date().getFullYear());
  const month = Number(body.month ?? new Date().getMonth() + 1);

  const { data: draft } = await supabase
    .from("drafts")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (!draft) {
    return NextResponse.json(
      { error: "Aucune draft pour ce mois. Lance une draft avant de sync les scores." },
      { status: 400 }
    );
  }

  const url = getScheduleMonthUrl(year, month);
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NBA-Skins-Betting/1.0; +https://github.com/claramaster/nba-skins-betting)",
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `basketball-reference: ${res.status}` },
        { status: 502 }
      );
    }
    html = await res.text();
  } catch (e) {
    console.error("fetch bbref", e);
    return NextResponse.json(
      { error: "Impossible de récupérer la page basketball-reference." },
      { status: 502 }
    );
  }

  const games = parseScheduleMonthHtml(html, year, month);
  if (games.length === 0) {
    return NextResponse.json({
      synced: 0,
      message: "Aucun match trouvé sur la page (vérifier le mois ou le format).",
    });
  }

  let synced = 0;
  for (let i = 0; i < games.length; i++) {
    const nbaGameId = year * 1000000 + month * 10000 + (i + 1);
    const row = gameToRow(games[i]!, draft.id, nbaGameId);
    if (!row) continue;

    const { error } = await supabase.from("game_results").upsert(row, {
      onConflict: "draft_id,nba_game_id",
    });
    if (!error) synced++;
  }

  return NextResponse.json({ synced, total: games.length });
}
