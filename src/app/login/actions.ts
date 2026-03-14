"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSlug } from "@/lib/auth";

const COOKIE_NAME = "nba_skins_player";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function chooseProfile(formData: FormData) {
  const slug = formData.get("slug");
  if (typeof slug !== "string" || !isValidSlug(slug)) {
    return { error: "Profil invalide." };
  }
  const store = await cookies();
  store.set(COOKIE_NAME, slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/login");
}
