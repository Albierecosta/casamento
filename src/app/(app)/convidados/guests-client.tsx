"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Download, Users, Crown, MoreVertical, Lock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradeModal } from "@/components/upgrade-modal";
import { PLAN_LIMITS } from "@/lib/plan";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Guest, GuestGroup, GuestStatus, InvitedBy } from "@/lib/types";
import { GUEST_GROUP_LABELS } from "@/lib/types";

type Props = { weddingId: string; initial: Guest[]; premium: boolean };

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  group_type: "familia" as GuestGroup,
  rsvp_status: "pendente" as GuestStatus,
  companions: 0,
  dietary_restriction: "",
  notes: "",
  table_number: "",
  vip: false,
  invited_by: "ambos" as InvitedBy,
};

export function GuestsClient({ weddingId, initial, premium }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | GuestStatus>("all");
  const [groupFilter, setGroupFilter] = useState<"all" | GuestGroup>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<{ title: string; description: string }>({
    title: "Desbloqueie o plano Premium",
    description: "Vocês chegaram ao limite do plano grátis.",
  });

  const guestLimit = PLAN_LIMITS.free.guests;
  const reachedLimit = !premium && guests.length >= guestLimit;

  const stats = useMemo(() => {
    const total = guests.length;
    const confirmed = guests.filter((g) => g.rsvp_status === "confirmado").length;
    const declined = guests.filter((g) => g.rsvp_status === "recusado").length;
    const pending = guests.filter((g) => g.rsvp_status === "pendente").length;
    const companions = guests
      .filter((g) => g.rsvp_status === "confirmado")
      .reduce((sum, g) => sum + (g.companions || 0), 0);
    return { total, confirmed, declined, pending, companions };
  }, [guests]);

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (statusFilter !== "all" && g.rsvp_status !== statusFilter) return false;
      if (groupFilter !== "all" && g.group_type !== groupFilter) return false;
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [guests, search, statusFilter, groupFilter]);

  function openCreate() {
    if (reachedLimit) {
      setUpgradeReason({
        title: `Limite de ${guestLimit} convidados atingido`,
        description: "O plano grátis permite até 20 convidados. Ative o Premium para lista ilimitada.",
      });
      setUpgradeOpen(true);
      return;
    }
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  }

  function openEdit(g: Guest) {
    setEditing(g);
    setForm({
      name: g.name,
      phone: g.phone ?? "",
      email: g.email ?? "",
      group_type: g.group_type,
      rsvp_status: g.rsvp_status,
      companions: g.companions ?? 0,
      dietary_restriction: g.dietary_restriction ?? "",
      notes: g.notes ?? "",
      table_number: g.table_number ?? "",
      vip: g.vip,
      invited_by: g.invited_by,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      group_type: form.group_type,
      rsvp_status: form.rsvp_status,
      companions: Number(form.companions) || 0,
      dietary_restriction: form.dietary_restriction || null,
      notes: form.notes || null,
      table_number: form.table_number || null,
      vip: !!form.vip,
      invited_by: form.invited_by,
    };

    if (editing) {
      const { data, error } = await supabase
        .from("guests")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error("Erro ao salvar", { description: error.message });
      setGuests((gs) => gs.map((g) => (g.id === editing.id ? (data as Guest) : g)));
      toast.success("Convidado atualizado");
    } else {
      const { data, error } = await supabase.from("guests").insert(payload).select().single();
      setSaving(false);
      if (error) return toast.error("Erro ao salvar", { description: error.message });
      setGuests((gs) => [...gs, data as Guest].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Convidado adicionado");
    }
    setDialogOpen(false);
  }

  async function remove(g: Guest) {
    if (!confirm(`Remover ${g.name} da lista?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("guests").delete().eq("id", g.id);
    if (error) return toast.error("Erro ao remover", { description: error.message });
    setGuests((gs) => gs.filter((x) => x.id !== g.id));
    toast.success("Convidado removido");
  }

  async function quickStatus(g: Guest, status: GuestStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("guests").update({ rsvp_status: status }).eq("id", g.id);
    if (error) return toast.error("Erro ao atualizar", { description: error.message });
    setGuests((gs) => gs.map((x) => (x.id === g.id ? { ...x, rsvp_status: status } : x)));
  }

  function exportCSV() {
    if (!premium) {
      setUpgradeReason({
        title: "Export CSV é Premium",
        description: "Ative o Premium para exportar a lista completa em CSV.",
      });
      setUpgradeOpen(true);
      return;
    }
    if (!guests.length) return toast.message("Sem convidados para exportar");
    const header = [
      "nome",
      "telefone",
      "email",
      "grupo",
      "status",
      "acompanhantes",
      "mesa",
      "vip",
      "convidado_por",
      "restricao_alimentar",
      "observacoes",
    ];
    const rows = guests.map((g) =>
      [
        g.name,
        g.phone ?? "",
        g.email ?? "",
        g.group_type,
        g.rsvp_status,
        g.companions,
        g.table_number ?? "",
        g.vip ? "sim" : "não",
        g.invited_by,
        g.dietary_restriction ?? "",
        (g.notes ?? "").replace(/\n/g, " "),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([`${header.join(",")}\n${rows.join("\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `convidados-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Lista exportada");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Convidados" description="Controle RSVP, grupos, mesas e acompanhantes.">
        <Button variant="outline" onClick={exportCSV}>
          {premium ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />} Exportar CSV
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo convidado
        </Button>
      </PageHeader>

      {!premium && (
        <div className="flex flex-col gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <span>
            Plano grátis: <strong>{guests.length}/{guestLimit}</strong> convidados usados
            {reachedLimit && " — limite atingido"}
          </span>
          <Button
            size="sm"
            variant="gold"
            onClick={() => {
              setUpgradeReason({
                title: "Desbloqueie convidados ilimitados",
                description: "Ative o Premium para ter lista sem limites e recursos exclusivos.",
              });
              setUpgradeOpen(true);
            }}
          >
            Fazer upgrade
          </Button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Confirmados" value={stats.confirmed} tone="success" hint={`+ ${stats.companions} acompanhantes`} />
        <StatCard label="Pendentes" value={stats.pending} tone="warning" />
        <StatCard label="Recusados" value={stats.declined} tone="destructive" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar convidado por nome"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="confirmado">Confirmados</SelectItem>
                <SelectItem value="recusado">Recusados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v as any)}>
              <SelectTrigger className="md:w-44"><SelectValue placeholder="Grupo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos grupos</SelectItem>
                {(Object.keys(GUEST_GROUP_LABELS) as GuestGroup[]).map((g) => (
                  <SelectItem key={g} value={g}>
                    {GUEST_GROUP_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={guests.length === 0 ? "Sua lista começa aqui" : "Nenhum convidado encontrado"}
          description={
            guests.length === 0
              ? "Comece adicionando os primeiros convidados. Você pode importar depois."
              : "Ajuste a busca ou os filtros."
          }
          action={
            guests.length === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Adicionar convidado
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {filtered.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{g.name}</p>
                      {g.vip && (
                        <Badge variant="gold" className="gap-1">
                          <Crown className="h-3 w-3" /> VIP
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {GUEST_GROUP_LABELS[g.group_type]}
                      {g.phone && ` · ${g.phone}`}
                      {g.companions > 0 && ` · +${g.companions} acomp.`}
                      {g.table_number && ` · Mesa ${g.table_number}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={g.rsvp_status}
                      onValueChange={(v) => quickStatus(g, v as GuestStatus)}
                    >
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="recusado">Recusado</SelectItem>
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(g)}>
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => remove(g)}>
                          <Trash2 className="h-4 w-4" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar convidado" : "Novo convidado"}</DialogTitle>
            <DialogDescription>Preencha as informações principais.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={form.group_type} onValueChange={(v) => setForm({ ...form, group_type: v as GuestGroup })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(GUEST_GROUP_LABELS) as GuestGroup[]).map((g) => (
                    <SelectItem key={g} value={g}>{GUEST_GROUP_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RSVP</Label>
              <Select
                value={form.rsvp_status}
                onValueChange={(v) => setForm({ ...form, rsvp_status: v as GuestStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Acompanhantes</Label>
              <Input
                type="number"
                min={0}
                value={form.companions}
                onChange={(e) => setForm({ ...form, companions: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mesa</Label>
              <Input value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Convidado por</Label>
              <Select
                value={form.invited_by}
                onValueChange={(v) => setForm({ ...form, invited_by: v as InvitedBy })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="noivo">Noivo</SelectItem>
                  <SelectItem value="noiva">Noiva</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.vip}
                  onChange={(e) => setForm({ ...form, vip: e.target.checked })}
                />
                Marcar como VIP
              </label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Restrição alimentar</Label>
              <Input
                value={form.dietary_restriction}
                onChange={(e) => setForm({ ...form, dietary_restriction: e.target.value })}
                placeholder="Vegetariano, sem glúten, alergias..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {editing ? "Salvar alterações" : "Adicionar convidado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title={upgradeReason.title}
        description={upgradeReason.description}
      />
    </div>
  );
}
