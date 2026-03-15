/**
 * Liste statique des 30 équipes NBA.
 * Utilisée en secours quand BALLDONTLIE_API_KEY est absente ou que l’API échoue.
 * Les IDs (1–30) sont ordonnés par abréviation pour rester cohérents.
 * Avec une clé API gratuite (app.balldontlie.io), l’API renvoie les équipes et cette liste n’est pas utilisée.
 */
export type NBATeamStatic = {
  id: number;
  abbreviation: string;
  full_name: string;
  city: string;
  name: string;
  conference?: string;
  division?: string;
};

export const NBA_TEAMS_STATIC: NBATeamStatic[] = [
  { id: 1, abbreviation: "ATL", full_name: "Atlanta Hawks", city: "Atlanta", name: "Hawks", conference: "East", division: "Southeast" },
  { id: 2, abbreviation: "BOS", full_name: "Boston Celtics", city: "Boston", name: "Celtics", conference: "East", division: "Atlantic" },
  { id: 3, abbreviation: "BKN", full_name: "Brooklyn Nets", city: "Brooklyn", name: "Nets", conference: "East", division: "Atlantic" },
  { id: 4, abbreviation: "CHA", full_name: "Charlotte Hornets", city: "Charlotte", name: "Hornets", conference: "East", division: "Southeast" },
  { id: 5, abbreviation: "CHI", full_name: "Chicago Bulls", city: "Chicago", name: "Bulls", conference: "East", division: "Central" },
  { id: 6, abbreviation: "CLE", full_name: "Cleveland Cavaliers", city: "Cleveland", name: "Cavaliers", conference: "East", division: "Central" },
  { id: 7, abbreviation: "DAL", full_name: "Dallas Mavericks", city: "Dallas", name: "Mavericks", conference: "West", division: "Southwest" },
  { id: 8, abbreviation: "DEN", full_name: "Denver Nuggets", city: "Denver", name: "Nuggets", conference: "West", division: "Northwest" },
  { id: 9, abbreviation: "DET", full_name: "Detroit Pistons", city: "Detroit", name: "Pistons", conference: "East", division: "Central" },
  { id: 10, abbreviation: "GSW", full_name: "Golden State Warriors", city: "Golden State", name: "Warriors", conference: "West", division: "Pacific" },
  { id: 11, abbreviation: "HOU", full_name: "Houston Rockets", city: "Houston", name: "Rockets", conference: "West", division: "Southwest" },
  { id: 12, abbreviation: "IND", full_name: "Indiana Pacers", city: "Indiana", name: "Pacers", conference: "East", division: "Central" },
  { id: 13, abbreviation: "LAC", full_name: "Los Angeles Clippers", city: "Los Angeles", name: "Clippers", conference: "West", division: "Pacific" },
  { id: 14, abbreviation: "LAL", full_name: "Los Angeles Lakers", city: "Los Angeles", name: "Lakers", conference: "West", division: "Pacific" },
  { id: 15, abbreviation: "MEM", full_name: "Memphis Grizzlies", city: "Memphis", name: "Grizzlies", conference: "West", division: "Southwest" },
  { id: 16, abbreviation: "MIA", full_name: "Miami Heat", city: "Miami", name: "Heat", conference: "East", division: "Southeast" },
  { id: 17, abbreviation: "MIL", full_name: "Milwaukee Bucks", city: "Milwaukee", name: "Bucks", conference: "East", division: "Central" },
  { id: 18, abbreviation: "MIN", full_name: "Minnesota Timberwolves", city: "Minnesota", name: "Timberwolves", conference: "West", division: "Northwest" },
  { id: 19, abbreviation: "NOP", full_name: "New Orleans Pelicans", city: "New Orleans", name: "Pelicans", conference: "West", division: "Southwest" },
  { id: 20, abbreviation: "NYK", full_name: "New York Knicks", city: "New York", name: "Knicks", conference: "East", division: "Atlantic" },
  { id: 21, abbreviation: "OKC", full_name: "Oklahoma City Thunder", city: "Oklahoma City", name: "Thunder", conference: "West", division: "Northwest" },
  { id: 22, abbreviation: "ORL", full_name: "Orlando Magic", city: "Orlando", name: "Magic", conference: "East", division: "Southeast" },
  { id: 23, abbreviation: "PHI", full_name: "Philadelphia 76ers", city: "Philadelphia", name: "76ers", conference: "East", division: "Atlantic" },
  { id: 24, abbreviation: "PHX", full_name: "Phoenix Suns", city: "Phoenix", name: "Suns", conference: "West", division: "Pacific" },
  { id: 25, abbreviation: "POR", full_name: "Portland Trail Blazers", city: "Portland", name: "Trail Blazers", conference: "West", division: "Northwest" },
  { id: 26, abbreviation: "SAC", full_name: "Sacramento Kings", city: "Sacramento", name: "Kings", conference: "West", division: "Pacific" },
  { id: 27, abbreviation: "SAS", full_name: "San Antonio Spurs", city: "San Antonio", name: "Spurs", conference: "West", division: "Southwest" },
  { id: 28, abbreviation: "TOR", full_name: "Toronto Raptors", city: "Toronto", name: "Raptors", conference: "East", division: "Atlantic" },
  { id: 29, abbreviation: "UTA", full_name: "Utah Jazz", city: "Utah", name: "Jazz", conference: "West", division: "Northwest" },
  { id: 30, abbreviation: "WAS", full_name: "Washington Wizards", city: "Washington", name: "Wizards", conference: "East", division: "Southeast" },
];
