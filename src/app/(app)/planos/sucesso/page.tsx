import Link from "next/link";
import { Sparkles, Check } from "lucide-react";
import { requireWedding } from "@/lib/wedding";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isPremium } from "@/lib/plan";
import { AutoRefresh } from "./auto-refresh";

export default async function CheckoutSuccessPage() {
  const wedding = await requireWedding();
  const premium = isPremium(wedding);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card className="border-success/40 bg-success/5">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            {premium ? <Check className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </div>
          {premium ? (
            <>
              <h1 className="font-display text-3xl">Premium ativado 🎉</h1>
              <p className="mt-2 text-muted-foreground">
                Tudo desbloqueado. Bom planejamento — vai ser lindo!
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button asChild>
                  <Link href="/dashboard">Ir pro dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/convidados">Continuar de onde parei</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl">Pagamento recebido!</h1>
              <p className="mt-2 text-muted-foreground">
                Estamos confirmando com o Stripe. Isso leva alguns segundos…
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Essa página atualiza sozinha quando o plano for liberado.
              </p>
              <AutoRefresh />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
