import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { Wedding } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!wedding) {
    const { data: created } = await supabase
      .from("weddings")
      .insert({
        owner_id: user.id,
        couple_name: (user.user_metadata as { couple_name?: string })?.couple_name ?? "Nosso casamento",
      })
      .select("*")
      .single();
    wedding = created;
  }

  const w = wedding as Wedding;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar wedding={w} userEmail={user.email ?? null} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileNav wedding={w} />
        <main className="flex-1 container max-w-6xl py-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
