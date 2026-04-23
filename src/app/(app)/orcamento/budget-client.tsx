"use client";

import { useMemo, useState } from "react";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Download,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
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
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
  type BudgetItem,
  type BudgetStatus,
  type Vendor,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<BudgetStatus, string> = {
  pendente: "Pendente",
  pago_parcial: "Pago parcial",
  pago: "Pago",
};

const COLORS = [
  "#8B1E3F", "#C9A961", "#6B8E7A", "#D88C6A", "#A67CB9",
  "#4B9CD3", "#E07A5F", "#81B29A", "#F2CC8F", "#3D405B",
  "#BC9CB4", "#D9A384", "#7EA172", "#B56576", "#6D6875",
];

const EMPTY = {
  title: "",
  category: "outros",
  vendor_id: "",
  planned_amount: "0",
  actual_amount: "0",
  down_payment: "0",
  installments: "1",
  installment_amount: "0",
  due_date: "",
  status: "pendente" as BudgetStatus,
  notes: "",
};

type Props = {
  weddingId: string;
  initial: BudgetItem[];
  initialBudget: number;
  vendors: Pick<Vendor, "id" | "name">[];
};

export function BudgetClient({ weddingId, initial, initialBudget, vendors }: Props) {
  const [items, setItems] = useState<BudgetItem[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const planned = items.reduce((s, i) => s + Number(i.planned_amount || 0), 0);
    const actual = items.reduce((s, i) => s + Number(i.actual_amount || 0), 0);
    const base = initialBudget || planned;
    const remaining = base - actual;
    const pct = base > 0 ? Math.round((actual / base) * 100) : 0;
    return { planned, actual, base, remaining, pct, overBudget: actual > base && base > 0 };
  }, [items, initialBudget]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { planned: number; actual: number }>();
    for (const i of items) {
      const k = i.category || "outros";
      const current = map.get(k) ?? { planned: 0, actual: 0 };
      current.planned += Number(i.planned_amount || 0);
      current.actual += Number(i.actual_amount || 0);
      map.set(k, current);
    }
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.actual - a.actual);
  }, [items]);

  const pieData = byCategory
    .filter((c) => c.actual > 0)
    .map((c) => ({ name: BUDGET_CATEGORY_LABELS[c.category] ?? c.category, value: c.actual }));

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  }

  function openEdit(i: BudgetItem) {
    setEditing(i);
    setForm({
      title: i.title,
      category: i.category,
      vendor_id: i.vendor_id ?? "",
      planned_amount: String(i.planned_amount ?? 0),
      actual_amount: String(i.actual_amount ?? 0),
      down_payment: String(i.down_payment ?? 0),
      installments: String(i.installments ?? 1),
      installment_amount: String(i.installment_amount ?? 0),
      due_date: i.due_date ?? "",
      status: i.status,
      notes: i.notes ?? "",
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
      category: form.category,
      vendor_id: form.vendor_id || null,
      planned_amount: Number(form.planned_amount) || 0,
      actual_amount: Number(form.actual_amount) || 0,
      down_payment: Number(form.down_payment) || 0,
      installments: Number(form.installments) || 1,
      installment_amount: Number(form.installment_amount) || 0,
      due_date: form.due_date || null,
      status: form.status,
      notes: form.notes || null,
    };
    if (editing) {
      const { data, error } = await supabase
        .from("budget_items")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error("Erro", { description: error.message });
      setItems((xs) => xs.map((x) => (x.id === editing.id ? (data as BudgetItem) : x)));
      toast.success("Item atualizado");
    } else {
      const { data, error } = await supabase.from("budget_items").insert(payload).select().single();
      setSaving(false);
      if (error) return toast.error("Erro", { description: error.message });
      setItems((xs) => [...xs, data as BudgetItem]);
      toast.success("Item adicionado");
    }
    setDialogOpen(false);
  }

  async function remove(i: BudgetItem) {
    if (!confirm(`Remover "${i.title}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("budget_items").delete().eq("id", i.id);
    if (error) return toast.error("Erro", { description: error.message });
    setItems((xs) => xs.filter((x) => x.id !== i.id));
    toast.success("Removido");
  }

  function exportPDF() {
    // Print-to-PDF approach: opens a print-friendly window the user can save as PDF.
    if (typeof window === "undefined") return;
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return toast.error("Habilite pop-ups para exportar");
    const rows = items
      .map(
        (i) => `
          <tr>
            <td>${escapeHtml(i.title)}</td>
            <td>${BUDGET_CATEGORY_LABELS[i.category] ?? i.category}</td>
            <td style="text-align:right">${formatCurrency(i.planned_amount)}</td>
            <td style="text-align:right">${formatCurrency(i.actual_amount)}</td>
            <td>${i.due_date ? formatDate(i.due_date) : "—"}</td>
            <td>${STATUS_LABELS[i.status]}</td>
          </tr>`,
      )
      .join("");
    win.document.write(`
      <html><head><title>Orçamento do casamento</title>
      <style>
        body { font-family: -apple-system, Segoe UI, sans-serif; padding: 32px; color: #1d1a1d; }
        h1 { font-family: Georgia, serif; font-size: 26px; margin: 0 0 4px; }
        p.meta { color: #666; font-size: 12px; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 12px; }
        th, td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: left; }
        th { text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px; color: #888; }
        .totals { margin-top: 24px; font-size: 13px; }
      </style></head><body>
        <h1>Orçamento do Casamento</h1>
        <p class="meta">Exportado em ${new Date().toLocaleString("pt-BR")}</p>
        <div class="totals">
          <strong>Previsto:</strong> ${formatCurrency(totals.planned)} ·
          <strong>Realizado:</strong> ${formatCurrency(totals.actual)} ·
          <strong>Saldo:</strong> ${formatCurrency(totals.remaining)}
        </div>
        <table>
          <thead><tr><th>Item</th><th>Categoria</th><th style="text-align:right">Previsto</th><th style="text-align:right">Realizado</th><th>Vencimento</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  const topCategory = byCategory[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Orçamento" description="Planeje, acompanhe e mantenha o controle dos gastos.">
        <Button variant="outline" onClick={exportPDF}>
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo item
        </Button>
      </PageHeader>

      {totals.overBudget && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Vocês ultrapassaram o orçamento inicial em {formatCurrency(totals.actual - totals.base)}. Revise as categorias.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="Orçamento base"
          value={formatCurrency(totals.base)}
          icon={<Wallet className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard label="Previsto" value={formatCurrency(totals.planned)} />
        <StatCard
          label="Realizado"
          value={formatCurrency(totals.actual)}
          tone={totals.overBudget ? "destructive" : "default"}
          hint={`${totals.pct}% do orçamento`}
        />
        <StatCard
          label="Saldo restante"
          value={formatCurrency(totals.remaining)}
          tone={totals.remaining < 0 ? "destructive" : "success"}
          hint={topCategory ? `Mais caro: ${BUDGET_CATEGORY_LABELS[topCategory.category] ?? topCategory.category}` : undefined}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {byCategory.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-5 w-5" />}
                title="Sem dados ainda"
                description="Adicione itens com valor realizado para ver o gráfico."
                className="h-full py-6"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory.map((c) => ({
                  name: BUDGET_CATEGORY_LABELS[c.category] ?? c.category,
                  Previsto: c.planned,
                  Realizado: c.actual,
                }))} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="Previsto" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição realizada</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {pieData.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-5 w-5" />}
                title="Sem dados"
                description="Registre valores pagos para visualizar."
                className="h-full py-6"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens do orçamento</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="Monte seu orçamento"
              description="Cadastre cada despesa por categoria. Tudo centralizado."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Novo item
                </Button>
              }
              className="m-4"
            />
          ) : (
            <div className="divide-y divide-border/60">
              {items.map((i) => {
                const planned = Number(i.planned_amount) || 0;
                const actual = Number(i.actual_amount) || 0;
                const pct = planned > 0 ? Math.min(Math.round((actual / planned) * 100), 200) : 0;
                const over = actual > planned && planned > 0;
                return (
                  <div key={i.id} className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="truncate font-medium">{i.title}</p>
                          <Badge variant="muted">
                            {BUDGET_CATEGORY_LABELS[i.category] ?? i.category}
                          </Badge>
                          <Badge
                            variant={
                              i.status === "pago"
                                ? "success"
                                : i.status === "pago_parcial"
                                ? "warning"
                                : "muted"
                            }
                          >
                            {STATUS_LABELS[i.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {i.due_date ? `Vence em ${formatDate(i.due_date)}` : "Sem vencimento"}
                          {i.installments > 1 &&
                            ` · ${i.installments}x de ${formatCurrency(i.installment_amount)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-semibold">{formatCurrency(actual)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            de {formatCurrency(planned)}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(i)}>
                              <Pencil className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => remove(i)}>
                              <Trash2 className="h-4 w-4" /> Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {planned > 0 && (
                      <Progress
                        value={Math.min(pct, 100)}
                        className="mt-3"
                        indicatorClassName={over ? "bg-destructive" : "bg-primary"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar item" : "Novo item de orçamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{BUDGET_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={form.vendor_id || "none"}
                onValueChange={(v) => setForm({ ...form, vendor_id: v === "none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Sem fornecedor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem fornecedor</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor previsto</Label>
              <Input
                type="number"
                step="0.01"
                value={form.planned_amount}
                onChange={(e) => setForm({ ...form, planned_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor real</Label>
              <Input
                type="number"
                step="0.01"
                value={form.actual_amount}
                onChange={(e) => setForm({ ...form, actual_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input
                type="number"
                step="0.01"
                value={form.down_payment}
                onChange={(e) => setForm({ ...form, down_payment: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Input
                type="number"
                min={1}
                value={form.installments}
                onChange={(e) => setForm({ ...form, installments: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor da parcela</Label>
              <Input
                type="number"
                step="0.01"
                value={form.installment_amount}
                onChange={(e) => setForm({ ...form, installment_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as BudgetStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago_parcial">Pago parcial</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));
}
