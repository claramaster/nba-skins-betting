import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "nba_skins_player";

export async function GET() {
  const store = await cookies();
  const slug = store.get(COOKIE_NAME)?.value ?? null;
  return NextResponse.json({ slug });
}
