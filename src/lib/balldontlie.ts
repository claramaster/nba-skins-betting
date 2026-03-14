const API_BASE = "https://api.balldontlie.io/nba/v1";

async function fetchApi<T>(
  path: string,
  params?: Record<string, string | number | (string | number)[] | undefined>
): Promise<T> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY is not set");
  }
  const url = new URL(API_BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined) return;
      if (Array.isArray(v)) {
        const key = k.endsWith("[]") ? k : k + "[]";
        v.forEach((val) => url.searchParams.append(key, String(val)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`balldontlie API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type NBATeam = {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
};

export type NBAGame = {
  id: number;
  date: string;
  season: number;
  status: string | null;
  period: number | null;
  time: string | null;
  period_detail: string | null;
  datetime: string | null;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: NBATeam;
  visitor_team: NBATeam;
};

export type TeamsResponse = { data: NBATeam[] };
export type GamesResponse = { data: NBAGame[]; meta?: { next_cursor?: string; per_page?: number } };

export async function getNbaTeams(): Promise<NBATeam[]> {
  const json = await fetchApi<TeamsResponse>("/teams");
  return json.data ?? [];
}

export async function getNbaGames(params: {
  "dates[]"?: string[];
  "team_ids[]"?: number[];
  start_date?: string;
  end_date?: string;
  per_page?: number;
}): Promise<NBAGame[]> {
  const q: Record<string, string | number | string[] | number[]> = {};
  if (params["dates[]"]?.length) q["dates[]"] = params["dates[]"];
  if (params["team_ids[]"]?.length) q["team_ids[]"] = params["team_ids[]"];
  if (params.start_date) q.start_date = params.start_date;
  if (params.end_date) q.end_date = params.end_date;
  if (params.per_page) q.per_page = params.per_page;
  const json = await fetchApi<GamesResponse>("/games", q);
  return json.data ?? [];
}

export type NBAStandingsEntry = {
  team: NBATeam;
  conference_record?: string;
  division_record?: string;
  wins?: number;
  losses?: number;
};

export type StandingsResponse = { data?: NBAStandingsEntry[] };

export async function getNbaStandings(season?: number): Promise<NBAStandingsEntry[]> {
  try {
    const json = await fetchApi<StandingsResponse>("/standings", season ? { season } : {});
    return json.data ?? [];
  } catch {
    return [];
  }
}
