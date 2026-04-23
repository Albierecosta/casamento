"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Heart,
  Wallet,
  ListChecks,
  Store,
  Settings,
  LogOut,
  Sparkles,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Wedding } from "@/lib/types";
import { countdown, formatDate } from "@/lib/utils";
import { isPremium } from "@/lib/plan";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/convidados", label: "Convidados", icon: Users },
  { href: "/padrinhos", label: "Padrinhos", icon: Heart },
  { href: "/orcamento", label: "Orçamento", icon: Wallet },
  { href: "/checklist", label: "Checklist", icon: ListChecks },
  { href: "/fornecedores", label: "Fornecedores", icon: Store },
  { href: "/planos", label: "Planos", icon: Crown },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ wedding, userEmail }: { wedding: Wedding; userEmail: string | null }) {
  const pathname = usePathname();
  const cd = countdown(wedding.wedding_date);
  const premium = isPremium(wedding);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/50">
      <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Heart className="h-4 w-4" />
        </span>
        <span className="font-display text-lg">Casamento</span>
      </div>

      <div className="p-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Nosso grande dia</p>
            {premium ? (
              <Badge variant="gold" className="gap-1 text-[10px]">
                <Crown className="h-3 w-3" /> Premium
              </Badge>
            ) : (
              <Badge variant="muted" className="text-[10px]">Grátis</Badge>
            )}
          </div>
          <p className="mt-1 font-display text-lg leading-tight">{wedding.couple_name || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground">
            {wedding.wedding_date ? formatDate(wedding.wedding_date) : "Data a definir"}
          </p>
          {cd && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-gold/10 px-2 py-1.5 text-xs text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              {cd.label}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {(userEmail ?? "??").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{userEmail ?? "Usuário"}</p>
            <p className="text-[10px] text-muted-foreground">Conta pessoal</p>
          </div>
          <ThemeToggle />
        </div>
        <form action="/auth/sign-out" method="post">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
