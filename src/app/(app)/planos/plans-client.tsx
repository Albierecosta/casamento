"use client";

import { useState } from "react";
import { Check, Sparkles, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Wedding } from "@/lib/types";
import { PLAN_PRICING, isPremium } from "@/lib/plan";
import { formatDate } from "@/lib/utils";

const FREE_FEATURES = [
  "Até 20 convidados",
  "Orçamento e gráficos",
  "Checklist por fase",
  "Fornecedores (sem upload de contrato)",
  "Padrinhos e configurações",
];

const PREMIUM_FEATURES = [
  "Convidados ilimitados",
  "Export CSV de convidados",
  "Export PDF do orçamento",
  "Upload de contratos",
  "Suporte prioritário",
  "Acesso até a data do casamento + 30 dias",
];

export function PlansClient({ wedding }: { wedding: Wedding }) {
  const premium = isPremium(wedding);
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Falha ao iniciar pagamento");
      }
      window.location.href = data.url;
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : "Erro inesperado";
      toast.error("Não foi possível iniciar o pagamento", { description: msg });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        description={
          premium
            ? "Vocês estão no Premium. Obrigado por confiar na gente 💍"
            : "Escolha o plano ideal pro casamento de vocês."
        }
      />

      {premium && (
        <Card className="border-success/40 bg-success/10">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Sparkles className="h-5 w-5 text-success" />
            <div>
              <p className="font-medium text-success">Plano Premium ativo</p>
              <p className="text-xs text-success/80 mt-1">
                {wedding.plan_expires_at
                  ? `Acesso até ${formatDate(wedding.plan_expires_at)}`
                  : "Acesso completo sem expiração"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={!premium ? "border-primary/40" : undefined}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Grátis</CardTitle>
              {!premium && <Badge>Atual</Badge>}
            </div>
            <p className="font-display text-3xl">R$ 0</p>
            <p className="text-xs text-muted-foreground">Pra começar a organizar</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-muted-foreground" /> {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className={premium ? "border-success/40" : "border-gold/40 bg-gold/5"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Premium <Sparkles className="h-4 w-4 text-gold" />
              </CardTitle>
              {premium && <Badge variant="success">Atual</Badge>}
            </div>
            <p className="font-display text-3xl">{PLAN_PRICING.premium.label}</p>
            <p className="text-xs text-muted-foreground">{PLAN_PRICING.premium.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" /> {f}
                </li>
              ))}
            </ul>
            {!premium && (
              <Button size="lg" className="w-full" onClick={startCheckout} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Pagar {PLAN_PRICING.premium.label}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {!premium && (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground space-y-2">
            <p className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-gold" />
              <strong>Liberação automática</strong>
            </p>
            <p>
              Após o pagamento, o plano Premium é ativado automaticamente — sem precisar mandar
              comprovante. Métodos aceitos: cartão de crédito
              {" "}(e Pix/Boleto se habilitado na sua conta Stripe).
            </p>
            <p>Processamento seguro pela Stripe. Nenhum dado do cartão toca nossos servidores.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
