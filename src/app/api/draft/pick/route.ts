import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { draftId, playerId, nbaTeamId, teamAbbreviation, teamName, prediction } = body;

  if (!draftId || !playerId || !nbaTeamId || !prediction || !["W", "L"].includes(prediction)) {
    return NextResponse.json(
      { error: "draftId, playerId, nbaTeamId et prediction (W/L) requis." },
      { status: 400 }
    );
  }

  const { data: draft } = await supabase
    .from("drafts")
    .select("id, draft_order, draft_mode, status")
    .eq("id", draftId)
    .single();

  if (!draft || draft.status !== "draft") {
    return NextResponse.json({ error: "Draft introuvable ou déjà terminée." }, { status: 400 });
  }

  const { data: picks } = await supabase
    .from("draft_picks")
    .select("pick_order")
    .eq("draft_id", draftId);

  const nextPickOrder = (picks?.length ?? 0) + 1;
  const { data: existingTeam } = await supabase
    .from("draft_picks")
    .select("id")
    .eq("draft_id", draftId)
    .eq("nba_team_id", Number(nbaTeamId))
    .maybeSingle();

  if (existingTeam) {
    return NextResponse.json({ error: "Cette équipe a déjà été draftée." }, { status: 400 });
  }

  const order = draft.draft_order as number[];
  const totalPicks = 4 * 7;
  let currentTurnIndex: number;
  if (draft.draft_mode === "snake") {
    const round = Math.floor((nextPickOrder - 1) / 4);
    const posInRound = (nextPickOrder - 1) % 4;
    const isReversed = round % 2 === 1;
    currentTurnIndex = isReversed ? order[3 - posInRound]! : order[posInRound]!;
  } else {
    currentTurnIndex = order[(nextPickOrder - 1) % 4]!;
  }

  const { data: players } = await supabase
    .from("players")
    .select("id")
    .order("slug");
  const expectedPlayerId = players?.[currentTurnIndex]?.id;
  if (expectedPlayerId !== playerId) {
    return NextResponse.json(
      { error: "Ce n’est pas à toi de choisir." },
      { status: 403 }
    );
  }

  const { error: insertError } = await supabase.from("draft_picks").insert({
    draft_id: draftId,
    player_id: playerId,
    nba_team_id: Number(nbaTeamId),
    nba_team_abbreviation: teamAbbreviation ?? null,
    nba_team_name: teamName ?? null,
    prediction: prediction as "W" | "L",
    pick_order: nextPickOrder,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const newTotal = nextPickOrder;
  if (newTotal >= totalPicks) {
    await supabase.from("drafts").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", draftId);
  }

  return NextResponse.json({ ok: true, pickOrder: nextPickOrder });
}
