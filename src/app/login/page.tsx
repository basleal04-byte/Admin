import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-stone-500">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
