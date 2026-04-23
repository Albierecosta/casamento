"use client";

import { useMemo, useState } from "react";
import {
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
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
import {
  PHASE_LABELS,
  type ChecklistItem,
  type ChecklistPhase,
  type ChecklistPriority,
  type ChecklistStatus,
} from "@/lib/types";
import { CHECKLIST_TEMPLATES } from "@/lib/checklist-templates";
import { formatDate } from "@/lib/utils";

const PHASE_ORDER: ChecklistPhase[] = ["24m", "18m", "12m", "6m", "3m", "1m", "1w", "custom"];

const EMPTY = {
  title: "",
  description: "",
  phase: "custom" as ChecklistPhase,
  priority: "media" as ChecklistPriority,
  category: "",
  due_date: "",
  status: "pendente" as ChecklistStatus,
};

type Props = {
  weddingId: string;
  weddingDate: string | null;
  initial: ChecklistItem[];
};

export function ChecklistClient({ weddingId, weddingDate, initial }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(initial);
  const [phaseFilter, setPhaseFilter] = useState<"all" | ChecklistPhase>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ChecklistStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.status === "concluida").length;
    const pending = total - done;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pending, pct };
  }, [items]);

  const grouped = useMemo(() => {
    const filtered = items.filter((i) => {
      if (phaseFilter !== "all" && i.phase !== phaseFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      return true;
    });
    const map = new Map<ChecklistPhase, ChecklistItem[]>();
    for (const i of filtered) {
      const arr = map.get(i.phase) ?? [];
      arr.push(i);
      map.set(i.phase, arr);
    }
    return PHASE_ORDER.filter((p) => (map.get(p)?.length ?? 0) > 0).map((p) => ({
      phase: p,
      items: (map.get(p) ?? []).sort((a, b) => {
        const prio = ["alta", "media", "baixa"];
        return prio.indexOf(a.priority) - prio.indexOf(b.priority);
      }),
    }));
  }, [items, phaseFilter, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  }

  function openEdit(i: ChecklistItem) {
    setEditing(i);
    setForm({
      title: i.title,
      description: i.description ?? "",
      phase: i.phase,
      priority: i.priority,
      category: i.category ?? "",
      due_date: i.due_date ?? "",
      status: i.status,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim()) return toast.error("Informe um título");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      title: form.title.trim(),
      description: form.description || null,
      phase: form.phase,
      priority: form.priority,
      category: form.category || null,
      due_date: form.due_date || null,
      status: form.status,
      completed_at: form.status === "concluida" ? new Date().toISOString() : null,
    };
    if (editing) {
      const { data, error } = await supabase
        .from("checklist_items")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error("Erro", { description: error.message });
      setItems((xs) => xs.map((x) => (x.id === editing.id ? (data as ChecklistItem) : x)));
      toast.success("Tarefa atualizada");
    } else {
      const { data, error } = await supabase.from("checklist_items").insert(payload).select().single();
      setSaving(false);
      if (error) return toast.error("Erro", { description: error.message });
      setItems((xs) => [...xs, data as ChecklistItem]);
      toast.success("Tarefa criada");
    }
    setDialogOpen(false);
  }

  async function remove(i: ChecklistItem) {
    if (!confirm(`Remover "${i.title}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("checklist_items").delete().eq("id", i.id);
    if (error) return toast.error("Erro", { description: error.message });
    setItems((xs) => xs.filter((x) => x.id !== i.id));
    toast.success("Removida");
  }

  async function toggle(i: ChecklistItem) {
    const nextStatus: ChecklistStatus = i.status === "concluida" ? "pendente" : "concluida";
    const completed_at = nextStatus === "concluida" ? new Date().toISOString() : null;
    const supabase = createClient();
    const { error } = await supabase
      .from("checklist_items")
      .update({ status: nextStatus, completed_at })
      .eq("id", i.id);
    if (error) return toast.error("Erro", { description: error.message });
    setItems((xs) =>
      xs.map((x) => (x.id === i.id ? { ...x, status: nextStatus, completed_at } : x)),
    );
  }

  async function seedTemplates() {
    if (!confirm("Isso vai adicionar o checklist padrão por fase ao seu plano. Continuar?")) return;
    setSeeding(true);
    const supabase = createClient();
    const rows = CHECKLIST_TEMPLATES.map((t) => ({
      wedding_id: weddingId,
      title: t.title,
      description: t.description ?? null,
      phase: t.phase,
      priority: t.priority,
      category: t.category ?? null,
    }));
    const { data, error } = await supabase.from("checklist_items").insert(rows).select();
    setSeeding(false);
    if (error) return toast.error("Erro", { description: error.message });
    setItems((xs) => [...xs, ...(data as ChecklistItem[])]);
    toast.success("Checklist gerado");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Checklist" description="Planejamento por fase até o grande dia.">
        {items.length === 0 && (
          <Button variant="outline" onClick={seedTemplates} disabled={seeding}>
            <Sparkles className="h-4 w-4" /> Gerar checklist padrão
          </Button>
        )}
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova tarefa
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Progress value={stats.pct} className="w-48" indicatorClassName="bg-success" />
            <span className="text-sm">
              <strong className="text-success">{stats.done}</strong> / {stats.total} concluídas
              <span className="text-muted-foreground"> · {stats.pct}%</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Select value={phaseFilter} onValueChange={(v) => setPhaseFilter(v as any)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Fase" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas fases</SelectItem>
                {PHASE_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>{PHASE_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {grouped.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title={items.length === 0 ? "Ainda sem tarefas" : "Sem resultados para os filtros"}
          description={
            items.length === 0
              ? "Gere o checklist padrão ou crie suas próprias tarefas."
              : "Tente ajustar os filtros de fase e status."
          }
          action={
            items.length === 0 ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={seedTemplates} disabled={seeding}>
                  <Sparkles className="h-4 w-4" /> Gerar checklist padrão
                </Button>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Nova tarefa
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <Card key={group.phase}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{PHASE_LABELS[group.phase]}</span>
                  <Badge variant="muted">
                    {group.items.filter((i) => i.status === "concluida").length}/{group.items.length}
                  </Badge>
                </CardTitle>
                {weddingDate && group.phase !== "custom" && (
                  <p className="text-xs text-muted-foreground">
                    Janela: {referenceWindow(weddingDate, group.phase)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {group.items.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3"
                  >
                    <Checkbox
                      checked={t.status === "concluida"}
                      onCheckedChange={() => toggle(t)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium text-sm ${
                          t.status === "concluida" ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <Badge
                          variant={
                            t.priority === "alta"
                              ? "destructive"
                              : t.priority === "media"
                              ? "warning"
                              : "muted"
                          }
                        >
                          {t.priority}
                        </Badge>
                        {t.category && <Badge variant="outline">{t.category}</Badge>}
                        {t.due_date && (
                          <span className="text-muted-foreground">até {formatDate(t.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => remove(t)}>
                          <Trash2 className="h-4 w-4" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fase</Label>
              <Select value={form.phase} onValueChange={(v) => setForm({ ...form, phase: v as ChecklistPhase })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASE_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>{PHASE_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as ChecklistPriority })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="decoração, fornecedores…"
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ChecklistStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function referenceWindow(wedding: string, phase: ChecklistPhase): string {
  const offsets: Record<ChecklistPhase, number> = {
    "24m": 24 * 30,
    "18m": 18 * 30,
    "12m": 12 * 30,
    "6m": 6 * 30,
    "3m": 3 * 30,
    "1m": 30,
    "1w": 7,
    custom: 0,
  };
  const d = new Date(wedding);
  d.setDate(d.getDate() - offsets[phase]);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(d);
}
