"use client";

import Link from "next/link";
import { Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLAN_PRICING } from "@/lib/plan";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

const PERKS = [
  "Convidados ilimitados",
  "Export de convidados em CSV",
  "Export do orçamento em PDF",
  "Upload de contratos de fornecedores",
  "Suporte prioritário no WhatsApp",
];

export function UpgradeModal({
  open,
  onOpenChange,
  title = "Desbloqueie o plano Premium",
  description = "Vocês chegaram ao limite do plano grátis. Ative o Premium e organize sem bloqueios.",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl">{PLAN_PRICING.premium.label}</span>
            <span className="text-sm text-muted-foreground">único</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{PLAN_PRICING.premium.description}</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Agora não</Button>
          <Button asChild>
            <Link href="/planos">Ver como pagar</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
