import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Wedding } from "./types";

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getCurrentWedding(): Promise<Wedding | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as Wedding | null;
}

export async function requireWedding(): Promise<Wedding> {
  const wedding = await getCurrentWedding();
  if (!wedding) redirect("/onboarding");
  if (!wedding.onboarded) redirect("/onboarding");
  return wedding;
}
