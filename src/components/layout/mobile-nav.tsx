"use client";

import * as React from "react";
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
  Menu,
  LogOut,
  Crown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Wedding } from "@/lib/types";
import { countdown, formatDate } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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

export function MobileNav({ wedding }: { wedding: Wedding }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const cd = countdown(wedding.wedding_date);

  return (
    <div className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-card/90 px-4 backdrop-blur">
      <Link href="/dashboard" className="flex items-center gap-2 font-display text-base">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Heart className="h-3.5 w-3.5" />
        </span>
        {wedding.couple_name || "Casamento"}
      </Link>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 overflow-hidden">
            <DialogHeader className="p-5 border-b border-border/60">
              <DialogTitle>{wedding.couple_name || "Casamento"}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {wedding.wedding_date ? formatDate(wedding.wedding_date) : "Data a definir"}
                {cd && ` · ${cd.label}`}
              </p>
            </DialogHeader>
            <nav className="p-3 space-y-1">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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
              <form action="/auth/sign-out" method="post" className="pt-3 mt-3 border-t border-border/60">
                <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground">
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </form>
            </nav>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
