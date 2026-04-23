import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { VendorsClient } from "./vendors-client";
import type { Vendor } from "@/lib/types";

export default async function VendorsPage() {
  const wedding = await requireWedding();
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("name");
  return <VendorsClient weddingId={wedding.id} initial={(data as Vendor[]) ?? []} />;
}
