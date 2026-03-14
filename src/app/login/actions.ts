"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, isValidSlug } from "@/lib/auth";

const COOKIE_NAME = "nba_skins_player";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function login(slug: string, password: string) {
  if (!isValidSlug(slug) || !checkPassword(password)) {
    return { error: "Profil ou mot de passe incorrect." };
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
