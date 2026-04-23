"use client";

import { useMemo, useState } from "react";
import { Heart, Plus, Pencil, Trash2, CheckCircle2, Circle, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { PartyMember, PartyRole, PartySide } from "@/lib/types";

const ROLE_LABELS: Record<PartyRole, string> = {
  padrinho: "Padrinho",
  madrinha: "Madrinha",
  daminha: "Daminha",
  pajem: "Pajem",
};

const SIDE_LABELS: Record<PartySide, string> = {
  noivo: "Noivo",
  noiva: "Noiva",
  ambos: "Ambos",
};

const EMPTY = {
  name: "",
  phone: "",
  role: "padrinho" as PartyRole,
  side: "noivo" as PartySide,
  outfit_defined: false,
  gift_defined: false,
  confirmed: false,
  notes: "",
};

export function PartyClient({ weddingId, initial }: { weddingId: string; initial: PartyMember[] }) {
  const [members, setMembers] = useState<PartyMember[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartyMember | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const stats = useMemo(
    () => ({
      total: members.length,
      confirmed: members.filter((m) => m.confirmed).length,
      groom: members.filter((m) => m.side === "noivo").length,
      bride: members.filter((m) => m.side === "noiva").length,
    }),
    [members],
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  }

  function openEdit(m: PartyMember) {
    setEditing(m);
    setForm({
      name: m.name,
      phone: m.phone ?? "",
      role: m.role,
      side: m.side,
      outfit_defined: m.outfit_defined,
      gift_defined: m.gift_defined,
      confirmed: m.confirmed,
      notes: m.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      name: form.name.trim(),
      phone: form.phone || null,
      role: form.role,
      side: form.side,
      outfit_defined: form.outfit_defined,
      gift_defined: form.gift_defined,
      confirmed: form.confirmed,
      notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase
        .from("wedding_party_members")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error("Erro ao salvar", { description: error.message });
      setMembers((ms) => ms.map((x) => (x.id === editing.id ? (data as PartyMember) : x)));
      toast.success("Salvo");
    } else {
      const { data, error } = await supabase
        .from("wedding_party_members")
        .insert(payload)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error("Erro ao salvar", { description: error.message });
      setMembers((ms) => [...ms, data as PartyMember].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Adicionado");
    }
    setDialogOpen(false);
  }

  async function remove(m: PartyMember) {
    if (!confirm(`Remover ${m.name}?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("wedding_party_members").delete().eq("id", m.id);
    if (error) return toast.error("Erro", { description: error.message });
    setMembers((ms) => ms.filter((x) => x.id !== m.id));
    toast.success("Removido");
  }

  async function toggle(m: PartyMember, field: "outfit_defined" | "gift_defined" | "confirmed") {
    const next = !m[field];
    const supabase = createClient();
    const { error } = await supabase
      .from("wedding_party_members")
      .update({ [field]: next })
      .eq("id", m.id);
    if (error) return toast.error("Erro", { description: error.message });
    setMembers((ms) => ms.map((x) => (x.id === m.id ? { ...x, [field]: next } : x)));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Padrinhos e madrinhas" description="Organize o time do casamento, roupas, presentes e confirmações.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo membro
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<Heart className="h-5 w-5" />} />
        <StatCard label="Confirmados" value={stats.confirmed} tone="success" />
        <StatCard label="Lado noivo" value={stats.groom} tone="default" />
        <StatCard label="Lado noiva" value={stats.bride} tone="gold" />
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Quem vai estar ao lado de vocês?"
          description="Adicione padrinhos, madrinhas, daminhas e pajens."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Adicionar primeiro
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {members.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.name}</p>
                      {m.confirmed ? (
                        <Badge variant="success">Confirmado</Badge>
                      ) : (
                        <Badge variant="muted">Pendente</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ROLE_LABELS[m.role]} · {SIDE_LABELS[m.side]}
                      {m.phone && ` · ${m.phone}`}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => remove(m)}>
                        <Trash2 className="h-4 w-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <CheckTile
                    label="Roupa"
                    active={m.outfit_defined}
                    onClick={() => toggle(m, "outfit_defined")}
                  />
                  <CheckTile
                    label="Presente"
                    active={m.gift_defined}
                    onClick={() => toggle(m, "gift_defined")}
                  />
                  <CheckTile
                    label="Confirmado"
                    active={m.confirmed}
                    onClick={() => toggle(m, "confirmed")}
                  />
                </div>

                {m.notes && (
                  <p className="mt-3 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">{m.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar membro" : "Novo membro"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as PartyRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as PartyRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lado</Label>
              <Select value={form.side} onValueChange={(v) => setForm({ ...form, side: v as PartySide })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SIDE_LABELS) as PartySide[]).map((s) => (
                    <SelectItem key={s} value={s}>{SIDE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
              <Label className="m-0">Confirmado</Label>
              <Switch checked={form.confirmed} onCheckedChange={(v) => setForm({ ...form, confirmed: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
              <Label className="m-0">Roupa definida</Label>
              <Switch checked={form.outfit_defined} onCheckedChange={(v) => setForm({ ...form, outfit_defined: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 md:col-span-2">
              <Label className="m-0">Presente definido</Label>
              <Switch checked={form.gift_defined} onCheckedChange={(v) => setForm({ ...form, gift_defined: v })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckTile({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
        active
          ? "border-success/60 bg-success/10 text-success"
          : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
