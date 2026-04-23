import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { ChecklistClient } from "./checklist-client";
import type { ChecklistItem } from "@/lib/types";

export default async function ChecklistPage() {
  const wedding = await requireWedding();
  const supabase = createClient();
  const { data } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("phase", { ascending: true })
    .order("priority", { ascending: false });
  return (
    <ChecklistClient
      weddingId={wedding.id}
      weddingDate={wedding.wedding_date}
      initial={(data as ChecklistItem[]) ?? []}
    />
  );
}
