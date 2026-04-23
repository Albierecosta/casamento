import type { ChecklistPhase, ChecklistPriority } from "./types";

export type ChecklistTemplate = {
  title: string;
  description?: string;
  phase: ChecklistPhase;
  priority: ChecklistPriority;
  category?: string;
};

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  // 24 meses
  { title: "Definir estilo e estética do casamento", phase: "24m", priority: "alta", category: "planejamento" },
  { title: "Conversar sobre orçamento total com famílias", phase: "24m", priority: "alta", category: "financeiro" },
  { title: "Escolher a data ideal do casamento", phase: "24m", priority: "alta", category: "planejamento" },
  { title: "Montar lista inicial de convidados", phase: "24m", priority: "media", category: "convidados" },

  // 18 meses
  { title: "Reservar o espaço da cerimônia", phase: "18m", priority: "alta", category: "fornecedores" },
  { title: "Reservar o espaço da festa", phase: "18m", priority: "alta", category: "fornecedores" },
  { title: "Contratar assessoria / cerimonialista", phase: "18m", priority: "media", category: "fornecedores" },
  { title: "Começar pesquisa de fotógrafo e filmagem", phase: "18m", priority: "media", category: "fornecedores" },

  // 12 meses
  { title: "Fechar buffet / menu principal", phase: "12m", priority: "alta", category: "fornecedores" },
  { title: "Fechar fotógrafo e vídeo", phase: "12m", priority: "alta", category: "fornecedores" },
  { title: "Escolher o vestido da noiva", phase: "12m", priority: "alta", category: "noiva" },
  { title: "Definir traje do noivo", phase: "12m", priority: "media", category: "noivo" },
  { title: "Escolher padrinhos e madrinhas", phase: "12m", priority: "alta", category: "padrinhos" },
  { title: "Definir paleta de cores e identidade visual", phase: "12m", priority: "media", category: "decoracao" },

  // 6 meses
  { title: "Fechar decoração e floricultura", phase: "6m", priority: "alta", category: "decoracao" },
  { title: "Contratar música / DJ / banda", phase: "6m", priority: "alta", category: "fornecedores" },
  { title: "Enviar save the date", phase: "6m", priority: "media", category: "convidados" },
  { title: "Agendar prova do vestido", phase: "6m", priority: "media", category: "noiva" },
  { title: "Planejar a lua de mel", phase: "6m", priority: "media", category: "lua_de_mel" },
  { title: "Fechar doces e bolo", phase: "6m", priority: "media", category: "fornecedores" },

  // 3 meses
  { title: "Enviar os convites definitivos", phase: "3m", priority: "alta", category: "convidados" },
  { title: "Confirmar cardápio final com buffet", phase: "3m", priority: "alta", category: "fornecedores" },
  { title: "Definir alianças", phase: "3m", priority: "alta", category: "aliancas" },
  { title: "Montar playlist e cronograma da festa", phase: "3m", priority: "media", category: "musica" },
  { title: "Reservar transporte dos noivos", phase: "3m", priority: "media", category: "fornecedores" },
  { title: "Planejar ensaio pré-wedding", phase: "3m", priority: "baixa", category: "fotografia" },

  // 1 mês
  { title: "Confirmar presença dos convidados (RSVP)", phase: "1m", priority: "alta", category: "convidados" },
  { title: "Última prova do vestido", phase: "1m", priority: "alta", category: "noiva" },
  { title: "Reunião de alinhamento com assessoria", phase: "1m", priority: "alta", category: "fornecedores" },
  { title: "Montar mapa das mesas", phase: "1m", priority: "alta", category: "convidados" },
  { title: "Revisar pagamentos pendentes", phase: "1m", priority: "alta", category: "financeiro" },

  // 1 semana
  { title: "Confirmar horários com todos os fornecedores", phase: "1w", priority: "alta", category: "fornecedores" },
  { title: "Arrumar a mala da lua de mel", phase: "1w", priority: "media", category: "lua_de_mel" },
  { title: "Separar documentos para o cartório", phase: "1w", priority: "alta", category: "cerimonia" },
  { title: "Revisar a ordem da cerimônia", phase: "1w", priority: "media", category: "cerimonia" },
  { title: "Descansar e curtir ✨", phase: "1w", priority: "baixa", category: "planejamento" },
];
