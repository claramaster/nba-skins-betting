import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SEASON_POINTS = [6, 3, 1];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const year = body.year ?? new Date().getFullYear();
  const month = body.month ?? new Date().getMonth() + 1;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/api/scores?year=${year}&month=${month}`
  );
  const data = await res.json();
  const { scoreRows, xMatchCount, draftId } = data;
  if (!draftId || !scoreRows?.length) {
    return NextResponse.json(
      { error: "Aucune draft ou aucun score pour ce mois." },
      { status: 400 }
    );
  }

  const sorted = [...scoreRows].sort((a, b) => b.score_count - a.score_count);
  const rankToScore: Record<number, number> = {};
  let rank = 1;
  let i = 0;
  while (i < sorted.length) {
    const score = sorted[i].score_count;
    const tieStart = i;
    while (i < sorted.length && sorted[i].score_count === score) i++;
    const tieCount = i - tieStart;
    const pointsToShare = SEASON_POINTS.slice(rank - 1, rank - 1 + tieCount);
    const total = pointsToShare.reduce((a, b) => a + b, 0);
    const each = tieCount > 0 ? total / tieCount : 0;
    for (let j = tieStart; j < i; j++) {
      rankToScore[sorted[j].player_id] = each;
    }
    rank += tieCount;
  }

  for (const row of scoreRows) {
    const seasonPoints = rankToScore[row.player_id] ?? 0;
    const rankIndex = sorted.findIndex((r) => r.player_id === row.player_id) + 1;
    await supabase.from("monthly_scores").upsert(
      {
        draft_id: draftId,
        player_id: row.player_id,
        raw_correct_count: row.raw_correct,
        x_match_count: xMatchCount,
        score_count: row.score_count,
        rank: rankIndex || null,
        season_points: Math.round(seasonPoints * 10) / 10,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "draft_id,player_id" }
    );
  }

  return NextResponse.json({
    ok: true,
    scoreRows: scoreRows.map((r: { player_id: string; player_name: string; score_count: number }) => ({
      ...r,
      season_points: rankToScore[r.player_id] ?? 0,
    })),
  });
}
