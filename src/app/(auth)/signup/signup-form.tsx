"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [coupleName, setCoupleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { couple_name: coupleName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }

    // If Supabase is set to confirm email, user will have no session yet
    if (!data.session) {
      setLoading(false);
      toast.success("Conta criada!", {
        description: "Confirmem o e-mail e depois façam login.",
      });
      router.push("/login");
      return;
    }

    // Session available — create the wedding row and move on to onboarding
    const userId = data.user?.id;
    if (userId) {
      const { error: wErr } = await supabase.from("weddings").insert({
        owner_id: userId,
        couple_name: coupleName || "Nosso casamento",
      });
      if (wErr) {
        setLoading(false);
        toast.error("Não foi possível inicializar o casamento", { description: wErr.message });
        return;
      }
    }

    setLoading(false);
    toast.success("Tudo pronto para começar!");
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="couple">Nome do casal</Label>
        <Input
          id="couple"
          placeholder="Sofia &amp; Rafael"
          value={coupleName}
          onChange={(e) => setCoupleName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voces@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Criar conta
      </Button>
    </form>
  );
}
