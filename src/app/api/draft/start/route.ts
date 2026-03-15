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
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Base de données non configurée (Supabase). Ajoute les variables d’environnement sur Bolt." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const year = body.year ?? new Date().getFullYear();
    const month = body.month ?? new Date().getMonth() + 1;

    const { data: existing, error: errExisting } = await supabase
      .from("drafts")
      .select("id")
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (errExisting) {
      return NextResponse.json(
        { error: `Base de données : ${errExisting.message}` },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: "Une draft existe déjà pour ce mois." },
        { status: 400 }
      );
    }

    const { data: players, error: errPlayers } = await supabase
      .from("players")
      .select("id")
      .order("slug");

    if (errPlayers) {
      return NextResponse.json(
        { error: `Base de données : ${errPlayers.message}` },
        { status: 500 }
      );
    }

    if (!players || players.length !== 4) {
      return NextResponse.json(
        { error: "Il faut exactement 4 joueurs (exécute le schéma SQL Supabase)." },
        { status: 400 }
      );
    }

    const draftMode = (body.draft_mode === "snake" || body.draft_mode === "regular")
      ? body.draft_mode
      : Math.random() < 0.5 ? "snake" : "regular";

    let draftOrder: number[];
    if (Array.isArray(body.draft_order) && body.draft_order.length === 4) {
      const order = body.draft_order.map(Number);
      const valid = [...new Set(order)].sort().join("") === "0123";
      draftOrder = valid ? order : shuffle([0, 1, 2, 3]);
    } else {
      draftOrder = shuffle([0, 1, 2, 3]);
    }

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
      return NextResponse.json({ error: `Création draft : ${error.message}` }, { status: 500 });
    }

    const playerOrder = draftOrder.map((i) => players[i]);
    return NextResponse.json({
      draft,
      order: draftOrder,
      playerIds: playerOrder.map((p) => p.id),
      draftMode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inattendue";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
