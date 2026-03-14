import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seasonStartYear = searchParams.get("season")
    ? parseInt(searchParams.get("season")!, 10)
    : (() => {
        const d = new Date();
        return d.getMonth() + 1 >= 11 ? d.getFullYear() : d.getFullYear() - 1;
      })();

  const { data: players } = await supabase
    .from("players")
    .select("id, name, slug")
    .order("slug");

  const r1 = await supabase
    .from("drafts")
    .select("id, year, month")
    .eq("year", seasonStartYear)
    .gte("month", 11)
    .order("month");
  const r2 = await supabase
    .from("drafts")
    .select("id, year, month")
    .eq("year", seasonStartYear + 1)
    .lte("month", 4)
    .order("month");
  const allDrafts = [...(r1.data ?? []), ...(r2.data ?? [])].sort(
    (a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month)
  );

  const monthlyScoresByDraft: Record<string, { player_id: string; season_points: number; rank: number | null }[]> = {};
  for (const d of allDrafts) {
    const { data: scores } = await supabase
      .from("monthly_scores")
      .select("player_id, season_points, rank")
      .eq("draft_id", d.id);
    monthlyScoresByDraft[d.id] = scores ?? [];
  }

  const draftIds = allDrafts.map((x) => x.id);
  const { data: picks } = await supabase
    .from("draft_picks")
    .select("draft_id, player_id, nba_team_abbreviation, prediction, pick_order")
    .in("draft_id", draftIds);

  const pointsByPlayerMonth: Record<string, Record<string, number>> = {};
  for (const pl of players ?? []) {
    pointsByPlayerMonth[pl.id] = {};
    for (const d of allDrafts) {
      const key = `${d.year}-${d.month}`;
      const row = (monthlyScoresByDraft[d.id] ?? []).find((s) => s.player_id === pl.id);
      pointsByPlayerMonth[pl.id][key] = row?.season_points ?? 0;
    }
  }

  const totals: Record<string, number> = {};
  for (const pl of players ?? []) {
    totals[pl.id] = Object.values(pointsByPlayerMonth[pl.id] ?? {}).reduce((a, b) => a + b, 0);
  }

  return NextResponse.json({
    seasonStartYear,
    months: allDrafts.map((d) => ({ year: d.year, month: d.month })),
    players: players ?? [],
    pointsByPlayerMonth,
    totals,
    drafts: allDrafts,
    picks: picks ?? [],
    monthlyScoresByDraft,
  });
}
