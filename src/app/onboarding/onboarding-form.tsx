"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CHECKLIST_TEMPLATES } from "@/lib/checklist-templates";
import type { Wedding } from "@/lib/types";

export function OnboardingForm({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    couple_name: wedding.couple_name || "",
    bride_name: wedding.bride_name || "",
    groom_name: wedding.groom_name || "",
    wedding_date: wedding.wedding_date || "",
    city: wedding.city || "",
    ceremony_location: wedding.ceremony_location || "",
    reception_location: wedding.reception_location || "",
    initial_budget: wedding.initial_budget?.toString() ?? "0",
    style: wedding.style || "",
    estimated_guests: wedding.estimated_guests?.toString() ?? "0",
    seed_checklist: true,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error: wErr } = await supabase
      .from("weddings")
      .update({
        couple_name: form.couple_name,
        bride_name: form.bride_name || null,
        groom_name: form.groom_name || null,
        wedding_date: form.wedding_date || null,
        city: form.city || null,
        ceremony_location: form.ceremony_location || null,
        reception_location: form.reception_location || null,
        initial_budget: Number(form.initial_budget) || 0,
        style: form.style || null,
        estimated_guests: Number(form.estimated_guests) || 0,
        onboarded: true,
      })
      .eq("id", wedding.id);

    if (wErr) {
      setLoading(false);
      toast.error("Erro ao salvar", { description: wErr.message });
      return;
    }

    if (form.seed_checklist) {
      const rows = CHECKLIST_TEMPLATES.map((t) => ({
        wedding_id: wedding.id,
        title: t.title,
        description: t.description ?? null,
        phase: t.phase,
        priority: t.priority,
        category: t.category ?? null,
      }));
      await supabase.from("checklist_items").insert(rows);
    }

    setLoading(false);
    toast.success("Casamento configurado!", { description: "Vamos ao seu dashboard." });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome do casal</Label>
              <Input
                value={form.couple_name}
                onChange={(e) => update("couple_name", e.target.value)}
                placeholder="Sofia &amp; Rafael"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nome da noiva</Label>
              <Input value={form.bride_name} onChange={(e) => update("bride_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nome do noivo</Label>
              <Input value={form.groom_name} onChange={(e) => update("groom_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data do casamento</Label>
              <Input
                type="date"
                value={form.wedding_date}
                onChange={(e) => update("wedding_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="São Paulo — SP" />
            </div>
            <div className="space-y-2">
              <Label>Local da cerimônia</Label>
              <Input
                value={form.ceremony_location}
                onChange={(e) => update("ceremony_location", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Local da festa</Label>
              <Input
                value={form.reception_location}
                onChange={(e) => update("reception_location", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Orçamento inicial (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.initial_budget}
                onChange={(e) => update("initial_budget", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Convidados estimados</Label>
              <Input
                type="number"
                min={0}
                value={form.estimated_guests}
                onChange={(e) => update("estimated_guests", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Estilo do casamento</Label>
              <Input
                value={form.style}
                onChange={(e) => update("style", e.target.value)}
                placeholder="Clássico, boho, pé na areia, minimalista…"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.seed_checklist}
              onChange={(e) => update("seed_checklist", e.target.checked)}
            />
            <span>
              <span className="font-medium">Gerar checklist automaticamente</span>
              <br />
              <span className="text-muted-foreground text-xs">
                Criaremos um checklist completo por fase (24m, 18m, 12m, 6m, 3m, 1m, 1 semana).
              </span>
            </span>
          </label>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Finalizar configuração
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
