import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, CalendarHeart, Wallet, ListChecks, Users, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const features = [
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Orçamento sob controle",
      description: "Acompanhe previsto, realizado e vencimentos por categoria, sem surpresas.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Convidados organizados",
      description: "Gerencie RSVPs, grupos, mesas e acompanhantes em uma lista elegante.",
    },
    {
      icon: <ListChecks className="h-5 w-5" />,
      title: "Checklist por fase",
      description: "Do save-the-date à lua de mel, com lembretes automáticos até o grande dia.",
    },
    {
      icon: <CalendarHeart className="h-5 w-5" />,
      title: "Fornecedores e contratos",
      description: "Centralize contatos, negociações, notas e arquivos em um só lugar.",
    },
  ];

  return (
    <div className="min-h-screen bg-romantic">
      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-4 w-4" />
          </span>
          Casamento
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Começar agora</Link>
          </Button>
        </div>
      </header>

      <main className="container">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Plataforma premium para noivos
            </div>
            <h1 className="mt-6 text-5xl font-display leading-tight tracking-tight md:text-6xl">
              Organize o casamento dos sonhos <span className="italic text-primary">com calma</span>.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Orçamento, convidados, padrinhos, fornecedores e checklist. Tudo em um app bonito, feito
              sob medida para noivos — sem planilhas bagunçadas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Criar minha conta <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Gratuito para começar • Sem cartão de crédito
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-gold/20 blur-2xl" />
            <Card className="relative border-border/40 shadow-2xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sofia &amp; Rafael</span>
                  <span>12 out 2026</span>
                </div>
                <h3 className="font-display text-3xl">Faltam 173 dias</h3>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <MiniStat label="Orçamento" value="68%" tone="primary" />
                  <MiniStat label="Convidados" value="142/180" tone="gold" />
                  <MiniStat label="Checklist" value="24/38" tone="success" />
                  <MiniStat label="Fornecedores" value="11" tone="muted" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 pb-20 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="transition-transform hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Casamento — feito com carinho.</span>
          <span>Next.js + Supabase + Tailwind</span>
        </div>
      </footer>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "primary" | "gold" | "success" | "muted" }) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold",
    success: "bg-success/15 text-success",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className={`rounded-lg px-3 py-2 ${colors[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-0.5 text-base font-semibold">{value}</div>
    </div>
  );
}
