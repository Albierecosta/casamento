"use client";

import { useMemo, useState } from "react";
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Instagram,
  Globe,
  Phone,
  Mail,
  Star,
  Upload,
  FileText,
  Lock,
} from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
  type NegotiationStatus,
  type Vendor,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<NegotiationStatus, string> = {
  pesquisando: "Pesquisando",
  em_contato: "Em contato",
  negociando: "Negociando",
  fechado: "Fechado",
  descartado: "Descartado",
};

const STATUS_COLORS: Record<NegotiationStatus, "muted" | "warning" | "success" | "destructive" | "default"> = {
  pesquisando: "muted",
  em_contato: "default",
  negociando: "warning",
  fechado: "success",
  descartado: "destructive",
};

const EMPTY = {
  name: "",
  category: "outros",
  phone: "",
  email: "",
  instagram: "",
  website: "",
  estimated_price: "0",
  final_price: "0",
  negotiation_status: "pesquisando" as NegotiationStatus,
  notes: "",
  personal_rating: "0",
};

export function VendorsClient({
  weddingId,
  initial,
  premium,
}: {
  weddingId: string;
  initial: Vendor[];
  premium: boolean;
}) {
  const [vendors, setVendors] = useState<Vendor[]>(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | NegotiationStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const stats = useMemo(
    () => ({
      total: vendors.length,
      closed: vendors.filter((v) => v.negotiation_status === "fechado").length,
      negotiating: vendors.filter((v) => v.negotiation_status === "negociando").length,
      researching: vendors.filter((v) => v.negotiation_status === "pesquisando").length,
    }),
    [vendors],
  );

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (statusFilter !== "all" && v.negotiation_status !== statusFilter) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [vendors, search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  }

  function openEdit(v: Vendor) {
    setEditing(v);
    setForm({
      name: v.name,
      category: v.category ?? "outros",
      phone: v.phone ?? "",
      email: v.email ?? "",
      instagram: v.instagram ?? "",
      website: v.website ?? "",
      estimated_price: String(v.estimated_price ?? 0),
      final_price: String(v.final_price ?? 0),
      negotiation_status: v.negotiation_status,
      notes: v.notes ?? "",
      personal_rating: String(v.personal_rating ?? 0),
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Informe o nome");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      wedding_id: weddingId,
      name: form.name.trim(),
      category: form.category || null,
      phone: form.phone || null,
      email: form.email || null,
      instagram: form.instagram || null,
      website: form.website || null,
      estimated_price: Number(form.estimated_price) || 0,
      final_price: Number(form.final_price) || 0,
      negotiation_status: form.negotiation_status,
      notes: form.notes || null,
      personal_rating: Number(form.personal_rating) || 0,
    };
    if (editing) {
      const { data, error } = await supabase
        .from("vendors")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error("Erro", { description: error.message });
      setVendors((xs) => xs.map((x) => (x.id === editing.id ? (data as Vendor) : x)));
      toast.success("Salvo");
    } else {
      const { data, error } = await supabase.from("vendors").insert(payload).select().single();
      setSaving(false);
      if (error) return toast.error("Erro", { description: error.message });
      setVendors((xs) => [...xs, data as Vendor].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Fornecedor adicionado");
    }
    setDialogOpen(false);
  }

  async function remove(v: Vendor) {
    if (!confirm(`Remover "${v.name}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("vendors").delete().eq("id", v.id);
    if (error) return toast.error("Erro", { description: error.message });
    setVendors((xs) => xs.filter((x) => x.id !== v.id));
    toast.success("Removido");
  }

  async function uploadContract(v: Vendor, file: File) {
    if (!premium) {
      setUpgradeOpen(true);
      return;
    }
    setUploading(v.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(null);
      return toast.error("Sessão expirou, faça login novamente");
    }
    const path = `${user.id}/${v.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("contracts")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(null);
      return toast.error("Erro no upload", { description: upErr.message });
    }
    const { error: updErr } = await supabase
      .from("vendors")
      .update({ contract_url: path })
      .eq("id", v.id);
    setUploading(null);
    if (updErr) return toast.error("Erro ao salvar referência", { description: updErr.message });
    setVendors((xs) => xs.map((x) => (x.id === v.id ? { ...x, contract_url: path } : x)));
    toast.success("Contrato anexado");
  }

  async function openContract(v: Vendor) {
    if (!v.contract_url) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("contracts")
      .createSignedUrl(v.contract_url, 60 * 10);
    if (error || !data) return toast.error("Não foi possível abrir o contrato");
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fornecedores" description="Gerencie contatos, preços, contratos e avaliações.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo fornecedor
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<Store className="h-5 w-5" />} />
        <StatCard label="Fechados" value={stats.closed} tone="success" />
        <StatCard label="Negociando" value={stats.negotiating} tone="warning" />
        <StatCard label="Pesquisando" value={stats.researching} tone="default" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar fornecedor"
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {(Object.keys(STATUS_LABELS) as NegotiationStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title={vendors.length === 0 ? "Comece sua lista" : "Sem resultados"}
          description={
            vendors.length === 0
              ? "Adicione os fornecedores que você está pesquisando."
              : "Ajuste busca e filtros."
          }
          action={
            vendors.length === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Adicionar primeiro
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{v.name}</p>
                      <Badge variant={STATUS_COLORS[v.negotiation_status]}>
                        {STATUS_LABELS[v.negotiation_status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {v.category ? BUDGET_CATEGORY_LABELS[v.category] ?? v.category : "Sem categoria"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(v)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => remove(v)}>
                        <Trash2 className="h-4 w-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {v.phone && (
                    <a href={`tel:${v.phone}`} className="flex items-center gap-1 hover:text-foreground">
                      <Phone className="h-3.5 w-3.5" /> {v.phone}
                    </a>
                  )}
                  {v.email && (
                    <a href={`mailto:${v.email}`} className="flex items-center gap-1 hover:text-foreground">
                      <Mail className="h-3.5 w-3.5" /> {v.email}
                    </a>
                  )}
                  {v.instagram && (
                    <a
                      href={`https://instagram.com/${v.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Instagram className="h-3.5 w-3.5" /> {v.instagram}
                    </a>
                  )}
                  {v.website && (
                    <a
                      href={v.website.startsWith("http") ? v.website : `https://${v.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Globe className="h-3.5 w-3.5" /> site
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-muted-foreground">Estimado</div>
                    <div className="font-semibold">{formatCurrency(v.estimated_price)}</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-muted-foreground">Fechado</div>
                    <div className="font-semibold">{formatCurrency(v.final_price)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <Rating value={v.personal_rating} />
                  <div className="flex items-center gap-2">
                    {v.contract_url ? (
                      <button
                        onClick={() => openContract(v)}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> Ver contrato
                      </button>
                    ) : premium ? (
                      <label className="inline-flex cursor-pointer items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Upload className="h-3.5 w-3.5" />
                        {uploading === v.id ? "Enviando…" : "Anexar contrato"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadContract(v, f);
                          }}
                        />
                      </label>
                    ) : (
                      <button
                        onClick={() => setUpgradeOpen(true)}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Lock className="h-3.5 w-3.5" /> Anexar contrato
                      </button>
                    )}
                  </div>
                </div>

                {v.notes && (
                  <p className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">{v.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
              <Label>Status de negociação</Label>
              <Select
                value={form.negotiation_status}
                onValueChange={(v) => setForm({ ...form, negotiation_status: v as NegotiationStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as NegotiationStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@fornecedor"
              />
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Preço estimado</Label>
              <Input
                type="number"
                step="0.01"
                value={form.estimated_price}
                onChange={(e) => setForm({ ...form, estimated_price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço fechado</Label>
              <Input
                type="number"
                step="0.01"
                value={form.final_price}
                onChange={(e) => setForm({ ...form, final_price: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Nota pessoal (0-5)</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={form.personal_rating}
                onChange={(e) => setForm({ ...form, personal_rating: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title="Upload de contratos é Premium"
        description="Ative o Premium para anexar PDFs de contratos e ter tudo organizado num só lugar."
      />
    </div>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < value ? "fill-gold text-gold" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}
