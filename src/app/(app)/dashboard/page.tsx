import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarHeart,
  Wallet,
  Users,
  ListChecks,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { countdown, formatCurrency, formatDate } from "@/lib/utils";
import { BUDGET_CATEGORY_LABELS } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!wedding || !wedding.onboarded) redirect("/onboarding");

  const [
    { data: guests = [] },
    { data: budget = [] },
    { data: checklist = [] },
    { data: vendors = [] },
    { data: party = [] },
  ] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", wedding.id),
    supabase.from("budget_items").select("*").eq("wedding_id", wedding.id),
    supabase.from("checklist_items").select("*").eq("wedding_id", wedding.id),
    supabase.from("vendors").select("*").eq("wedding_id", wedding.id),
    supabase.from("wedding_party_members").select("*").eq("wedding_id", wedding.id),
  ]);

  const cd = countdown(wedding.wedding_date);
  const totalGuests = (guests ?? []).length;
  const confirmed = (guests ?? []).filter((g: any) => g.rsvp_status === "confirmado").length;
  const pending = (guests ?? []).filter((g: any) => g.rsvp_status === "pendente").length;
  const declined = (guests ?? []).filter((g: any) => g.rsvp_status === "recusado").length;

  const planned = (budget ?? []).reduce((s: number, b: any) => s + Number(b.planned_amount || 0), 0);
  const actual = (budget ?? []).reduce((s: number, b: any) => s + Number(b.actual_amount || 0), 0);
  const planBase = Number(wedding.initial_budget || 0) || planned;
  const remaining = planBase - actual;
  const percentUsed = planBase > 0 ? Math.round((actual / planBase) * 100) : 0;
  const overBudget = planBase > 0 && actual > planBase;

  const tasksDone = (checklist ?? []).filter((t: any) => t.status === "concluida").length;
  const tasksPending = (checklist ?? []).length - tasksDone;
  const tasksPct =
    (checklist ?? []).length > 0 ? Math.round((tasksDone / (checklist ?? []).length) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingPayments = (budget ?? [])
    .filter((b: any) => b.due_date && b.status !== "pago")
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const upcomingTasks = (checklist ?? [])
    .filter((t: any) => t.status !== "concluida")
    .sort((a: any, b: any) => {
      const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return ad - bd;
    })
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="bg-romantic rounded-2xl border border-border/50 p-8 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary">Nosso casamento</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">{wedding.couple_name}</h1>
            <p className="mt-1 text-muted-foreground">
              {wedding.wedding_date ? formatDate(wedding.wedding_date, { day: "2-digit", month: "long", year: "numeric" }) : "Data a definir"}
              {wedding.city && ` · ${wedding.city}`}
            </p>
          </div>
          {cd && (
            <div className="rounded-xl border border-gold/40 bg-gold/10 px-5 py-4 text-right">
              <p className="text-[10px] uppercase tracking-wider text-gold/80">Contagem regressiva</p>
              <p className="font-display text-3xl text-gold">{cd.days >= 0 ? cd.days : 0}</p>
              <p className="text-xs text-gold/80">{cd.days === 0 ? "Hoje!" : cd.days === 1 ? "dia" : "dias"}</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Orçamento"
          value={formatCurrency(planBase)}
          hint={`Previsto total: ${formatCurrency(planned)}`}
          icon={<Wallet className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Já gasto"
          value={formatCurrency(actual)}
          hint={`${percentUsed}% do orçamento`}
          icon={<Wallet className="h-5 w-5" />}
          tone={overBudget ? "destructive" : "default"}
        />
        <StatCard
          label="Saldo restante"
          value={formatCurrency(remaining)}
          hint={remaining < 0 ? "Atenção: orçamento estourou" : "Dentro do planejado"}
          icon={<Sparkles className="h-5 w-5" />}
          tone={remaining < 0 ? "destructive" : "success"}
        />
        <StatCard
          label="Convidados"
          value={totalGuests}
          hint={`${confirmed} confirmados · ${pending} pendentes`}
          icon={<Users className="h-5 w-5" />}
          tone="default"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Uso do orçamento</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {overBudget ? "Estourou o orçamento planejado" : "Evolução do gasto até agora"}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orcamento">Ver detalhes <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{formatCurrency(actual)} de {formatCurrency(planBase)}</span>
              <Badge variant={overBudget ? "destructive" : percentUsed > 80 ? "warning" : "success"}>
                {percentUsed}%
              </Badge>
            </div>
            <Progress
              value={Math.min(percentUsed, 100)}
              indicatorClassName={overBudget ? "bg-destructive" : percentUsed > 80 ? "bg-warning" : "bg-primary"}
            />
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-muted-foreground">Previsto</div>
                <div className="font-semibold">{formatCurrency(planned)}</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-muted-foreground">Diferença previsto × realizado</div>
                <div className={actual > planned ? "font-semibold text-destructive" : "font-semibold text-success"}>
                  {formatCurrency(actual - planned)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <p className="text-xs text-muted-foreground">
              {tasksDone} concluídas · {tasksPending} pendentes
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso geral</span>
              <Badge variant="success">{tasksPct}%</Badge>
            </div>
            <Progress value={tasksPct} indicatorClassName="bg-success" />
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/checklist">Abrir checklist</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Próximos vencimentos
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orcamento">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-5 w-5" />}
                title="Nenhum vencimento próximo"
                description="Adicione itens de orçamento com data para ver alertas aqui."
                className="py-10"
              />
            ) : (
              <ul className="space-y-2">
                {upcomingPayments.map((p: any) => {
                  const d = new Date(p.due_date);
                  d.setHours(0, 0, 0, 0);
                  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const soon = diff <= 7;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {BUDGET_CATEGORY_LABELS[p.category] ?? p.category} · {formatDate(p.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatCurrency(Number(p.planned_amount) || Number(p.actual_amount))}
                        </span>
                        {soon && <Badge variant="warning">{diff < 0 ? "atrasado" : `${diff}d`}</Badge>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Próximos itens do checklist
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/checklist">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Tudo em dia"
                description="Nenhuma tarefa pendente. Respira fundo e aproveite!"
                className="py-10"
              />
            ) : (
              <ul className="space-y-2">
                {upcomingTasks.map((t: any) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.phase !== "custom" ? t.phase : "personalizada"}
                        {t.due_date && ` · ${formatDate(t.due_date)}`}
                      </p>
                    </div>
                    <Badge variant={t.priority === "alta" ? "destructive" : t.priority === "media" ? "warning" : "muted"}>
                      {t.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="RSVP pendente"
          value={pending}
          hint={`${confirmed} confirmados · ${declined} recusados`}
          icon={<Users className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Padrinhos / madrinhas"
          value={(party ?? []).length}
          hint={`${(party ?? []).filter((p: any) => p.confirmed).length} confirmados`}
          icon={<HeartHandshake className="h-5 w-5" />}
          tone="default"
        />
        <StatCard
          label="Fornecedores"
          value={(vendors ?? []).length}
          hint={`${(vendors ?? []).filter((v: any) => v.negotiation_status === "fechado").length} fechados`}
          icon={<CalendarHeart className="h-5 w-5" />}
          tone="gold"
        />
      </section>
    </div>
  );
}
