import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const year = body.year ?? new Date().getFullYear();
  const month = body.month ?? new Date().getMonth() + 1;

  const { data: existing } = await supabase
    .from("drafts")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Une draft existe déjà pour ce mois." },
      { status: 400 }
    );
  }

  const { data: players } = await supabase
    .from("players")
    .select("id")
    .order("slug");

  if (!players || players.length !== 4) {
    return NextResponse.json(
      { error: "Il faut exactement 4 joueurs." },
      { status: 400 }
    );
  }

  const indices = [0, 1, 2, 3];
  const draftOrder = shuffle(indices);
  const draftMode = Math.random() < 0.5 ? "snake" : "regular";

  const { data: draft, error } = await supabase
    .from("drafts")
    .insert({
      year: Number(year),
      month: Number(month),
      draft_order: draftOrder,
      draft_mode: draftMode,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const playerOrder = draftOrder.map((i) => players[i]);
  return NextResponse.json({
    draft,
    order: draftOrder,
    playerIds: playerOrder.map((p) => p.id),
    draftMode,
  });
}
