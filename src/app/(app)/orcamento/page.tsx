import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { BudgetClient } from "./budget-client";
import type { BudgetItem, Vendor } from "@/lib/types";
import { isPremium } from "@/lib/plan";

export default async function BudgetPage() {
  const wedding = await requireWedding();
  const supabase = createClient();
  const [{ data: items }, { data: vendors }] = await Promise.all([
    supabase
      .from("budget_items")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("vendors").select("id,name").eq("wedding_id", wedding.id).order("name"),
  ]);
  return (
    <BudgetClient
      weddingId={wedding.id}
      initialBudget={Number(wedding.initial_budget) || 0}
      initial={(items as BudgetItem[]) ?? []}
      vendors={(vendors as Pick<Vendor, "id" | "name">[]) ?? []}
      premium={isPremium(wedding)}
    />
  );
}
