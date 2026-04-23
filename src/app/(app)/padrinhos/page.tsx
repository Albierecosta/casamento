import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { PartyClient } from "./party-client";
import type { PartyMember } from "@/lib/types";

export default async function PartyPage() {
  const wedding = await requireWedding();
  const supabase = createClient();
  const { data } = await supabase
    .from("wedding_party_members")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("name");
  return <PartyClient weddingId={wedding.id} initial={(data as PartyMember[]) ?? []} />;
}
