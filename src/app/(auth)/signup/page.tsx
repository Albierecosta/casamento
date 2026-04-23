import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl">Crie a conta do casal</h1>
        <p className="text-sm text-muted-foreground">
          Em 2 minutos vocês estarão organizando o casamento dos sonhos.
        </p>
      </div>
      <SignupForm />
      <p className="text-sm text-muted-foreground text-center">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
