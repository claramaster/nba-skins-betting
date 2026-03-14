import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getNbaGames } from "@/lib/balldontlie";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const year = body.year ?? new Date().getFullYear();
  const month = body.month ?? new Date().getMonth() + 1;

  const { data: draft } = await supabase
    .from("drafts")
    .select("id")
    .eq("year", Number(year))
    .eq("month", Number(month))
    .maybeSingle();

  if (!draft) {
    return NextResponse.json({ error: "Aucune draft pour ce mois." }, { status: 400 });
  }

  const { data: picks } = await supabase
    .from("draft_picks")
    .select("nba_team_id")
    .eq("draft_id", draft.id);

  const teamIds = [...new Set((picks ?? []).map((p) => p.nba_team_id))];
  if (teamIds.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let nbaGames: Awaited<ReturnType<typeof getNbaGames>> = [];
  try {
    nbaGames = await getNbaGames({
      "team_ids[]": teamIds,
      start_date: start,
      end_date: end,
      per_page: 100,
    });
  } catch (e) {
    console.error("sync games", e);
    return NextResponse.json({ error: "Erreur API NBA" }, { status: 502 });
  }

  let synced = 0;
  for (const g of nbaGames) {
    const winnerId =
      g.status === "Final" || (g.home_team_score != null && g.visitor_team_score != null)
        ? g.home_team_score > g.visitor_team_score
          ? g.home_team.id
          : g.visitor_team.id
        : null;

    const { error } = await supabase.from("game_results").upsert(
      {
        draft_id: draft.id,
        nba_game_id: g.id,
        game_date: g.date,
        home_team_id: g.home_team.id,
        visitor_team_id: g.visitor_team.id,
        home_team_abbreviation: g.home_team.abbreviation,
        visitor_team_abbreviation: g.visitor_team.abbreviation,
        home_score: g.home_team_score,
        visitor_score: g.visitor_team_score,
        winner_team_id: winnerId,
        status: g.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "draft_id,nba_game_id" }
    );
    if (!error) synced++;
  }

  return NextResponse.json({ synced });
}
