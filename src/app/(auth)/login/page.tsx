import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <h1 className="font-display text-3xl">Bem-vindos de volta</h1>
        <p className="text-sm text-muted-foreground">
          Entre para continuar organizando o grande dia.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-muted-foreground text-center">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Crie agora
        </Link>
      </p>
    </div>
  );
}
