import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Annule une draft (supprime game_results, monthly_scores, picks puis la draft). Body: { draftId }.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const draftId = body.draftId ?? body.draft_id;

  if (!draftId) {
    return NextResponse.json({ error: "draftId requis." }, { status: 400 });
  }

  const { error: errGameResults } = await supabase.from("game_results").delete().eq("draft_id", draftId);
  if (errGameResults) {
    return NextResponse.json({ error: `Suppression game_results : ${errGameResults.message}` }, { status: 500 });
  }

  const { error: errMonthlyScores } = await supabase.from("monthly_scores").delete().eq("draft_id", draftId);
  if (errMonthlyScores) {
    return NextResponse.json({ error: `Suppression monthly_scores : ${errMonthlyScores.message}` }, { status: 500 });
  }

  const { error: errPicks } = await supabase.from("draft_picks").delete().eq("draft_id", draftId);
  if (errPicks) {
    return NextResponse.json({ error: `Suppression picks : ${errPicks.message}` }, { status: 500 });
  }

  const { error: errDraft } = await supabase.from("drafts").delete().eq("id", draftId);
  if (errDraft) {
    return NextResponse.json({ error: `Suppression draft : ${errDraft.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
