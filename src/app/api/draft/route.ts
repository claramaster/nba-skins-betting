import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getNbaTeams, getNbaStandings } from "@/lib/balldontlie";
import { NBA_TEAMS_STATIC } from "@/lib/nba-teams-static";

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

  const [{ data: picks }, { data: monthlyScoresForDraft }] = await Promise.all([
    supabase.from("draft_picks").select("*, players(name, slug)").in("draft_id", draft?.id ? [draft.id] : []),
    draft?.id ? supabase.from("monthly_scores").select("id").eq("draft_id", draft.id) : Promise.resolve({ data: [] }),
  ]);

  const finalized = (monthlyScoresForDraft ?? []).length > 0;

  let teams: Awaited<ReturnType<typeof getNbaTeams>> = [];
  let standings: Awaited<ReturnType<typeof getNbaStandings>> = [];
  const [teamsResult, standingsResult] = await Promise.allSettled([
    getNbaTeams(),
    getNbaStandings(now.getFullYear()),
  ]);
  if (teamsResult.status === "fulfilled") teams = teamsResult.value;
  else console.error("getNbaTeams", teamsResult.reason);
  if (standingsResult.status === "fulfilled") standings = standingsResult.value;
  else console.error("getNbaStandings", standingsResult.reason);

  let teamsSource: "api" | "static" = "api";
  if (teams.length === 0) {
    teams = NBA_TEAMS_STATIC as Awaited<ReturnType<typeof getNbaTeams>>;
    teamsSource = "static";
  }

  const standingsByTeamId = Object.fromEntries(
    standings.map((s) => [s.team.id, { wins: s.wins ?? 0, losses: s.losses ?? 0 }])
  );

  return NextResponse.json({
    players: players ?? [],
    draft: draft ?? null,
    picks: picks ?? [],
    teams,
    teamsSource,
    standings: standingsByTeamId,
    finalized: draft?.id ? finalized : false,
  });
}
