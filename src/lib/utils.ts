import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(isNaN(n as number) ? 0 : (n as number));
}

export function formatDate(date: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", opts ?? { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function daysUntil(date: string | Date | null | undefined) {
  if (!date) return null;
  const target = typeof date === "string" ? new Date(date) : date;
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function countdown(date: string | Date | null | undefined) {
  const d = daysUntil(date);
  if (d === null) return null;
  if (d < 0) return { label: "Já aconteceu", days: d };
  if (d === 0) return { label: "É hoje!", days: 0 };
  if (d === 1) return { label: "Falta 1 dia", days: 1 };
  return { label: `Faltam ${d} dias`, days: d };
}

export function initials(name: string | null | undefined) {
  if (!name) return "??";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
