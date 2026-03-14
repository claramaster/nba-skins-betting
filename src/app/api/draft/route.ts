import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getNbaTeams, getNbaStandings } from "@/lib/balldontlie";

export const dynamic = "force-dynamic";

type GetParams = { year?: string; month?: string };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const now = new Date();
  const y = year ? parseInt(year, 10) : now.getFullYear();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1;

  const [{ data: players }, { data: draft }] = await Promise.all([
    supabase.from("players").select("id, slug, name").order("slug"),
    supabase.from("drafts").select("*").eq("year", y).eq("month", m).maybeSingle(),
  ]);

  const { data: picks } = await supabase
    .from("draft_picks")
    .select("*, players(name, slug)")
    .in("draft_id", draft?.id ? [draft.id] : []);

  let teams: Awaited<ReturnType<typeof getNbaTeams>> = [];
  let standings: Awaited<ReturnType<typeof getNbaStandings>> = [];
  try {
    [teams, standings] = await Promise.all([
      getNbaTeams(),
      getNbaStandings(now.getFullYear()),
    ]);
  } catch (e) {
    console.error("balldontlie", e);
  }

  const standingsByTeamId = Object.fromEntries(
    standings.map((s) => [s.team.id, { wins: s.wins ?? 0, losses: s.losses ?? 0 }])
  );

  return NextResponse.json({
    players: players ?? [],
    draft: draft ?? null,
    picks: picks ?? [],
    teams,
    standings: standingsByTeamId,
  });
}
