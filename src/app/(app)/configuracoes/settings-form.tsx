"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Wedding } from "@/lib/types";

export function SettingsForm({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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
  });

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
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
      })
      .eq("id", wedding.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar", { description: error.message });
    toast.success("Configurações atualizadas");
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Configurações" description="Detalhes do casamento, locais e orçamento base." />

      <Card>
        <CardHeader><CardTitle>Informações gerais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome do casal</Label>
            <Input value={form.couple_name} onChange={(e) => setForm({ ...form, couple_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Nome da noiva</Label>
            <Input value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Nome do noivo</Label>
            <Input value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Data do casamento</Label>
            <Input
              type="date"
              value={form.wedding_date}
              onChange={(e) => setForm({ ...form, wedding_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Locais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Local da cerimônia</Label>
            <Input
              value={form.ceremony_location}
              onChange={(e) => setForm({ ...form, ceremony_location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Local da festa</Label>
            <Input
              value={form.reception_location}
              onChange={(e) => setForm({ ...form, reception_location: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Estilo &amp; orçamento</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Orçamento inicial (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.initial_budget}
              onChange={(e) => setForm({ ...form, initial_budget: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Convidados estimados</Label>
            <Input
              type="number"
              value={form.estimated_guests}
              onChange={(e) => setForm({ ...form, estimated_guests: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Estilo do casamento</Label>
            <Input
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              placeholder="Clássico, boho, pé na areia, minimalista…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
