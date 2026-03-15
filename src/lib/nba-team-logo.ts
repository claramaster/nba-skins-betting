/** URL du logo NBA par abréviation (ex: ATL, BOS). */
export function nbaTeamLogoUrl(abbreviation: string): string {
  const slug = abbreviation.toUpperCase();
  return `https://interstate21.com/nba-logos/${slug}.png`;
}
