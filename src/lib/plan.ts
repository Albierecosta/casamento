import type { Plan, Wedding } from "./types";

export const PLAN_LIMITS = {
  free: {
    guests: 20,
    canExportCsv: false,
    canExportPdf: false,
    canUploadContracts: false,
  },
  premium: {
    guests: Infinity,
    canExportCsv: true,
    canExportPdf: true,
    canUploadContracts: true,
  },
} as const;

export const PLAN_PRICING = {
  premium: {
    price: 149,
    label: "R$ 149",
    description: "Pagamento único · Acesso até o casamento + 30 dias",
  },
};

export const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY ?? "albieregentil12@gmail.com";
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function isPremium(wedding: Pick<Wedding, "plan" | "plan_expires_at">): boolean {
  if (wedding.plan !== "premium") return false;
  if (!wedding.plan_expires_at) return true;
  return new Date(wedding.plan_expires_at).getTime() > Date.now();
}

export function planOf(wedding: Pick<Wedding, "plan" | "plan_expires_at">): Plan {
  return isPremium(wedding) ? "premium" : "free";
}

export function limitsOf(wedding: Pick<Wedding, "plan" | "plan_expires_at">) {
  return PLAN_LIMITS[planOf(wedding)];
}

export function whatsappUpgradeUrl(coupleName: string) {
  const number = WHATSAPP_NUMBER.replace(/\D/g, "");
  const text = encodeURIComponent(
    `Olá! Acabei de pagar o plano Premium do Casamento (${coupleName}). Envio o comprovante em seguida 💍`,
  );
  if (!number) return `https://wa.me/?text=${text}`;
  return `https://wa.me/${number}?text=${text}`;
}
