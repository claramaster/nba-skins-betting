const PLAYER_SLUGS = ["carlito", "papa", "vincent", "tonio"] as const;
export type PlayerSlug = (typeof PLAYER_SLUGS)[number];

export function getPlayerSlugs(): PlayerSlug[] {
  return [...PLAYER_SLUGS];
}

export function isValidSlug(slug: string): slug is PlayerSlug {
  return PLAYER_SLUGS.includes(slug as PlayerSlug);
}
