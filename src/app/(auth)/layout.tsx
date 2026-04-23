import Link from "next/link";
import { Heart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex relative items-center justify-center bg-romantic p-12 border-r border-border/60">
        <div className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent)]" />
        <div className="relative max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="h-4 w-4" />
            </span>
            Casamento
          </Link>
          <blockquote className="mt-12 space-y-4">
            <p className="font-display text-3xl leading-snug">
              "O dia mais importante das nossas vidas, planejado sem estresse."
            </p>
            <footer className="text-sm text-muted-foreground">
              — Noivos que organizaram seu casamento aqui
            </footer>
          </blockquote>
          <div className="mt-12 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <span>Orçamento</span>
            <span>Convidados</span>
            <span>Padrinhos</span>
            <span>Fornecedores</span>
            <span>Checklist</span>
            <span>Cronograma</span>
          </div>
        </div>
      </div>
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
