import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { GuestsClient } from "./guests-client";
import type { Guest } from "@/lib/types";

export default async function GuestsPage() {
  const wedding = await requireWedding();
  const supabase = createClient();
  const { data } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("name", { ascending: true });
  return <GuestsClient weddingId={wedding.id} initial={(data as Guest[]) ?? []} />;
}
