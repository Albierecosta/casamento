import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function OnboardingPage() {
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

  if (wedding?.onboarded) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-romantic">
      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-4 w-4" />
          </span>
          Casamento
        </Link>
        <ThemeToggle />
      </header>
      <main className="container max-w-xl pb-20">
        <div className="mb-8">
          <p className="text-sm text-primary">Onboarding</p>
          <h1 className="mt-1 font-display text-4xl">Vamos configurar seu casamento</h1>
          <p className="mt-2 text-muted-foreground">
            Esses dados ajudam a gerar o cronograma, a contagem regressiva e a divisão de orçamento.
            Você pode ajustar tudo depois.
          </p>
        </div>
        <OnboardingForm wedding={wedding} />
      </main>
    </div>
  );
}
