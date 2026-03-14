import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getNbaGames } from "@/lib/balldontlie";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? new Date().getFullYear();
  const month = searchParams.get("month") ?? new Date().getMonth() + 1;

  const { data: draft } = await supabase
    .from("drafts")
    .select("id")
    .eq("year", Number(year))
    .eq("month", Number(month))
    .maybeSingle();

  if (!draft) {
    return NextResponse.json({ games: [], picksByTeam: {}, players: [] });
  }

  const { data: picks } = await supabase
    .from("draft_picks")
    .select("nba_team_id, player_id, prediction, players(id, name, slug)")
    .eq("draft_id", draft.id);

  const teamIds = [...new Set((picks ?? []).map((p) => p.nba_team_id))];
  if (teamIds.length === 0) {
    return NextResponse.json({ games: [], picksByTeam: {}, players: [] });
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
    console.error("balldontlie games", e);
  }

  const picksByTeam: Record<
    number,
    { player_id: string; player_name: string; prediction: string }[]
  > = {};
  for (const p of picks ?? []) {
    const arr = picksByTeam[p.nba_team_id] ?? [];
    arr.push({
      player_id: p.player_id,
      player_name: (p.players as { name?: string })?.name ?? "",
      prediction: p.prediction,
    });
    picksByTeam[p.nba_team_id] = arr;
  }

  const players = [...new Map((picks ?? []).map((p) => [p.player_id, (p.players as { id: string; name: string; slug: string })])).values()];

  return NextResponse.json({
    games: nbaGames,
    picksByTeam,
    players,
    draftId: draft.id,
  });
}
