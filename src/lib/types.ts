export type Plan = "free" | "premium";

export type Wedding = {
  id: string;
  owner_id: string;
  couple_name: string;
  bride_name: string | null;
  groom_name: string | null;
  wedding_date: string | null;
  city: string | null;
  ceremony_location: string | null;
  reception_location: string | null;
  initial_budget: number;
  style: string | null;
  estimated_guests: number;
  onboarded: boolean;
  plan: Plan;
  plan_expires_at: string | null;
  plan_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GuestStatus = "pendente" | "confirmado" | "recusado";
export type GuestGroup = "familia" | "amigos" | "trabalho" | "noivo" | "noiva" | "outros";
export type InvitedBy = "noivo" | "noiva" | "ambos";

export type Guest = {
  id: string;
  wedding_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  group_type: GuestGroup;
  rsvp_status: GuestStatus;
  companions: number;
  dietary_restriction: string | null;
  notes: string | null;
  table_number: string | null;
  vip: boolean;
  invited_by: InvitedBy;
  created_at: string;
  updated_at: string;
};

export type PartyRole = "padrinho" | "madrinha" | "daminha" | "pajem";
export type PartySide = "noivo" | "noiva" | "ambos";

export type PartyMember = {
  id: string;
  wedding_id: string;
  name: string;
  phone: string | null;
  role: PartyRole;
  side: PartySide;
  outfit_defined: boolean;
  gift_defined: boolean;
  confirmed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NegotiationStatus =
  | "pesquisando"
  | "em_contato"
  | "negociando"
  | "fechado"
  | "descartado";

export type Vendor = {
  id: string;
  wedding_id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  estimated_price: number;
  final_price: number;
  negotiation_status: NegotiationStatus;
  contract_url: string | null;
  notes: string | null;
  personal_rating: number;
  created_at: string;
  updated_at: string;
};

export type BudgetStatus = "pendente" | "pago_parcial" | "pago";

export type BudgetItem = {
  id: string;
  wedding_id: string;
  vendor_id: string | null;
  title: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
  down_payment: number;
  installments: number;
  installment_amount: number;
  due_date: string | null;
  status: BudgetStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistPhase = "24m" | "18m" | "12m" | "6m" | "3m" | "1m" | "1w" | "custom";
export type ChecklistStatus = "pendente" | "em_andamento" | "concluida";
export type ChecklistPriority = "baixa" | "media" | "alta";

export type ChecklistItem = {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  phase: ChecklistPhase;
  category: string | null;
  priority: ChecklistPriority;
  status: ChecklistStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const BUDGET_CATEGORIES = [
  "espaco",
  "buffet",
  "decoracao",
  "fotografia",
  "filmagem",
  "vestido",
  "traje",
  "musica",
  "doces",
  "convites",
  "lembrancinhas",
  "aliancas",
  "cerimonia",
  "lua_de_mel",
  "outros",
] as const;

export const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  espaco: "Espaço",
  buffet: "Buffet",
  decoracao: "Decoração",
  fotografia: "Fotografia",
  filmagem: "Filmagem",
  vestido: "Vestido",
  traje: "Traje",
  musica: "Música",
  doces: "Doces",
  convites: "Convites",
  lembrancinhas: "Lembrancinhas",
  aliancas: "Alianças",
  cerimonia: "Cerimônia",
  lua_de_mel: "Lua de Mel",
  outros: "Outros",
};

export const PHASE_LABELS: Record<ChecklistPhase, string> = {
  "24m": "24 meses antes",
  "18m": "18 meses antes",
  "12m": "12 meses antes",
  "6m": "6 meses antes",
  "3m": "3 meses antes",
  "1m": "1 mês antes",
  "1w": "1 semana antes",
  custom: "Personalizada",
};

export const GUEST_GROUP_LABELS: Record<GuestGroup, string> = {
  familia: "Família",
  amigos: "Amigos",
  trabalho: "Trabalho",
  noivo: "Noivo",
  noiva: "Noiva",
  outros: "Outros",
};
