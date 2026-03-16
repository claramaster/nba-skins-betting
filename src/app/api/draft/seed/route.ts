import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { NBA_TEAMS_STATIC } from "@/lib/nba-teams-static";
import { getMonthBySlug, type MonthSlug } from "@/lib/season-months";

export const dynamic = "force-dynamic";

type PickRow = { player: string; team: string; prediction: "W" | "L" };

const SEED_PICKS: Record<string, PickRow[]> = {
  nov: [
    { player: "Carlito", team: "Oklahoma City Thunder", prediction: "W" },
    { player: "Papa", team: "Utah Jazz", prediction: "L" },
    { player: "Tonio", team: "Brooklyn Nets", prediction: "L" },
    { player: "Vincent", team: "Denver Nuggets", prediction: "W" },
    { player: "Carlito", team: "Washington Wizards", prediction: "L" },
    { player: "Papa", team: "Charlotte Hornets", prediction: "L" },
    { player: "Tonio", team: "New York Knicks", prediction: "W" },
    { player: "Vincent", team: "Houston Rockets", prediction: "W" },
    { player: "Carlito", team: "Los Angeles Lakers", prediction: "W" },
    { player: "Papa", team: "Cleveland Cavaliers", prediction: "W" },
    { player: "Tonio", team: "Sacramento Kings", prediction: "L" },
    { player: "Vincent", team: "Los Angeles Clippers", prediction: "W" },
    { player: "Carlito", team: "San Antonio Spurs", prediction: "W" },
    { player: "Papa", team: "Atlanta Hawks", prediction: "W" },
    { player: "Tonio", team: "Minnesota Timberwolves", prediction: "W" },
    { player: "Vincent", team: "Phoenix Suns", prediction: "L" },
    { player: "Carlito", team: "Indiana Pacers", prediction: "L" },
    { player: "Papa", team: "Golden State Warriors", prediction: "W" },
    { player: "Tonio", team: "Chicago Bulls", prediction: "L" },
    { player: "Vincent", team: "New Orleans Pelicans", prediction: "L" },
    { player: "Carlito", team: "Detroit Pistons", prediction: "W" },
    { player: "Papa", team: "Portland Trail Blazers", prediction: "L" },
    { player: "Tonio", team: "Milwaukee Bucks", prediction: "W" },
    { player: "Vincent", team: "Dallas Mavericks", prediction: "W" },
    { player: "Carlito", team: "Orlando Magic", prediction: "L" },
    { player: "Papa", team: "Toronto Raptors", prediction: "W" },
    { player: "Tonio", team: "Memphis Grizzlies", prediction: "L" },
    { player: "Vincent", team: "Philadelphia 76ers", prediction: "W" },
  ],
  dec: [
    { player: "Vincent", team: "Oklahoma City Thunder", prediction: "W" },
    { player: "Tonio", team: "Sacramento Kings", prediction: "L" },
    { player: "Papa", team: "New Orleans Pelicans", prediction: "L" },
    { player: "Carlito", team: "Denver Nuggets", prediction: "W" },
    { player: "Carlito", team: "Washington Wizards", prediction: "L" },
    { player: "Papa", team: "Charlotte Hornets", prediction: "L" },
    { player: "Tonio", team: "Utah Jazz", prediction: "L" },
    { player: "Vincent", team: "Portland Trail Blazers", prediction: "L" },
    { player: "Vincent", team: "Los Angeles Clippers", prediction: "L" },
    { player: "Tonio", team: "Minnesota Timberwolves", prediction: "W" },
    { player: "Papa", team: "Brooklyn Nets", prediction: "L" },
    { player: "Carlito", team: "Cleveland Cavaliers", prediction: "W" },
    { player: "Carlito", team: "Detroit Pistons", prediction: "W" },
    { player: "Papa", team: "Indiana Pacers", prediction: "L" },
    { player: "Tonio", team: "Houston Rockets", prediction: "W" },
    { player: "Vincent", team: "Los Angeles Lakers", prediction: "W" },
    { player: "Vincent", team: "San Antonio Spurs", prediction: "W" },
    { player: "Tonio", team: "Toronto Raptors", prediction: "W" },
    { player: "Papa", team: "New York Knicks", prediction: "W" },
    { player: "Carlito", team: "Milwaukee Bucks", prediction: "W" },
    { player: "Carlito", team: "Miami Heat", prediction: "W" },
    { player: "Papa", team: "Atlanta Hawks", prediction: "W" },
    { player: "Tonio", team: "Chicago Bulls", prediction: "L" },
    { player: "Vincent", team: "Memphis Grizzlies", prediction: "L" },
    { player: "Vincent", team: "Orlando Magic", prediction: "W" },
    { player: "Tonio", team: "Dallas Mavericks", prediction: "L" },
    { player: "Papa", team: "Phoenix Suns", prediction: "W" },
    { player: "Carlito", team: "Boston Celtics", prediction: "W" },
  ],
  fev: [
    { player: "Carlito", team: "Washington Wizards", prediction: "L" },
    { player: "Vincent", team: "Oklahoma City Thunder", prediction: "W" },
    { player: "Papa", team: "Utah Jazz", prediction: "L" },
    { player: "Tonio", team: "Sacramento Kings", prediction: "L" },
    { player: "Carlito", team: "Brooklyn Nets", prediction: "L" },
    { player: "Vincent", team: "New Orleans Pelicans", prediction: "L" },
    { player: "Papa", team: "Detroit Pistons", prediction: "W" },
    { player: "Tonio", team: "Phoenix Suns", prediction: "W" },
    { player: "Carlito", team: "Boston Celtics", prediction: "W" },
    { player: "Vincent", team: "Indiana Pacers", prediction: "L" },
    { player: "Papa", team: "Denver Nuggets", prediction: "W" },
    { player: "Tonio", team: "Houston Rockets", prediction: "W" },
    { player: "Carlito", team: "Cleveland Cavaliers", prediction: "W" },
    { player: "Vincent", team: "San Antonio Spurs", prediction: "W" },
    { player: "Papa", team: "Minnesota Timberwolves", prediction: "W" },
    { player: "Tonio", team: "New York Knicks", prediction: "W" },
    { player: "Carlito", team: "Memphis Grizzlies", prediction: "L" },
    { player: "Vincent", team: "Los Angeles Lakers", prediction: "W" },
    { player: "Papa", team: "Toronto Raptors", prediction: "W" },
    { player: "Tonio", team: "Milwaukee Bucks", prediction: "L" },
    { player: "Carlito", team: "Dallas Mavericks", prediction: "L" },
    { player: "Vincent", team: "Los Angeles Clippers", prediction: "W" },
    { player: "Papa", team: "Portland Trail Blazers", prediction: "L" },
    { player: "Tonio", team: "Miami Heat", prediction: "W" },
    { player: "Carlito", team: "Philadelphia 76ers", prediction: "W" },
    { player: "Vincent", team: "Golden State Warriors", prediction: "W" },
    { player: "Papa", team: "Chicago Bulls", prediction: "L" },
    { player: "Tonio", team: "Charlotte Hornets", prediction: "W" },
  ],
};

const TEAM_BY_NAME = new Map(
  NBA_TEAMS_STATIC.map((t) => [t.full_name.toLowerCase(), t])
);

function findTeam(name: string): { id: number; abbreviation: string; full_name: string } | null {
  const n = name.trim().toLowerCase();
  const t = TEAM_BY_NAME.get(n) ?? NBA_TEAMS_STATIC.find((t) => t.full_name.toLowerCase() === n);
  return t ? { id: t.id, abbreviation: t.abbreviation, full_name: t.full_name } : null;
}

/**
 * POST /api/draft/seed
 * Body: { slug: "nov" | "dec" | "fev" }
 * Crée la draft du mois et insère les 28 picks (simulation).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const slug = (body.slug ?? "").toLowerCase();

  if (!["nov", "dec", "fev"].includes(slug)) {
    return NextResponse.json(
      { error: "slug requis: nov, dec ou fev" },
      { status: 400 }
    );
  }

  const monthConfig = getMonthBySlug(slug as MonthSlug);
  const picks = SEED_PICKS[slug];
  if (!monthConfig || !picks?.length) {
    return NextResponse.json(
      { error: "Données de simulation manquantes pour ce mois." },
      { status: 400 }
    );
  }

  const { year, month, fullName } = monthConfig;

  const { data: existing } = await supabase
    .from("drafts")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Une draft ${fullName} existe déjà. Supprime-la d’abord (page mois → Annuler la draft).` },
      { status: 400 }
    );
  }

  const { data: players, error: errPlayers } = await supabase
    .from("players")
    .select("id, name, slug")
    .order("slug");

  if (errPlayers || !players?.length) {
    return NextResponse.json(
      { error: "Impossible de charger les joueurs." },
      { status: 500 }
    );
  }

  const nameToPlayer = new Map(players.map((p) => [p.name, p]));
  const slugOrder = players.map((p) => p.slug);
  const draftOrder = [
    slugOrder.indexOf("carlito"),
    slugOrder.indexOf("vincent"),
    slugOrder.indexOf("papa"),
    slugOrder.indexOf("tonio"),
  ];
  if (draftOrder.some((i) => i < 0)) {
    return NextResponse.json(
      { error: "Joueurs attendus: carlito, vincent, papa, tonio (par slug)." },
      { status: 500 }
    );
  }

  const { data: draft, error: errDraft } = await supabase
    .from("drafts")
    .insert({
      year,
      month,
      draft_order: draftOrder,
      draft_mode: "regular",
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (errDraft || !draft) {
    return NextResponse.json(
      { error: errDraft?.message ?? "Création draft impossible." },
      { status: 500 }
    );
  }

  const picksToInsert: {
    draft_id: string;
    player_id: string;
    nba_team_id: number;
    nba_team_abbreviation: string | null;
    nba_team_name: string | null;
    prediction: "W" | "L";
    pick_order: number;
  }[] = [];

  for (let i = 0; i < picks.length; i++) {
    const row = picks[i]!;
    const player = nameToPlayer.get(row.player);
    const team = findTeam(row.team);
    if (!player) {
      await supabase.from("drafts").delete().eq("id", draft.id);
      return NextResponse.json(
        { error: `Joueur inconnu: ${row.player}` },
        { status: 400 }
      );
    }
    if (!team) {
      await supabase.from("drafts").delete().eq("id", draft.id);
      return NextResponse.json(
        { error: `Équipe inconnue: ${row.team}` },
        { status: 400 }
      );
    }
    picksToInsert.push({
      draft_id: draft.id,
      player_id: player.id,
      nba_team_id: team.id,
      nba_team_abbreviation: team.abbreviation,
      nba_team_name: team.full_name,
      prediction: row.prediction,
      pick_order: i + 1,
    });
  }

  const { error: errPicks } = await supabase
    .from("draft_picks")
    .insert(picksToInsert);

  if (errPicks) {
    await supabase.from("drafts").delete().eq("id", draft.id);
    return NextResponse.json(
      { error: `Insertion des picks: ${errPicks.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    draftId: draft.id,
    message: `Draft ${fullName} créée avec ${picks.length} picks.`,
  });
}
