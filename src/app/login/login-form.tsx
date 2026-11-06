"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "credentials" | "mfa";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const idle = params.get("reason") === "idle";

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      mfaCode,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Invalid credentials or MFA code"
          : result.error
      );
      return;
    }

    const session = await getSession();
    const dest =
      session?.user?.role === "end_user" ? "/profile" : "/";
    router.replace(dest);
    router.refresh();
  }

  function continueToMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setStep("mfa");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_transparent_55%),linear-gradient(180deg,#fbfaf8_0%,#f0ebe3_100%)]" />
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />

      <Card className="relative z-10 w-full max-w-md border-stone-200/80 shadow-lg shadow-stone-900/5">
        <CardHeader className="space-y-2 pb-2">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-emerald-900">
            BirrBack
          </p>
          <CardTitle className="text-lg">Panel sign in</CardTitle>
          <CardDescription>
            BirrBack admin panel. MFA required. End users and merchants use the Telebirr mini-app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {idle ? (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Session ended after inactivity. Sign in again.
            </p>
          ) : null}

          {step === "credentials" ? (
            <form onSubmit={continueToMfa} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}
              <Button type="submit" className="w-full">
                Continue
              </Button>
              <a
                href="/forgot-password"
                className="block text-center text-sm text-stone-500 hover:text-stone-800"
              >
                Forgot password?
              </a>
            </form>
          ) : (
            <form onSubmit={submitMfa} className="space-y-4">
              <p className="text-sm text-stone-500">
                Enter the MFA code for{" "}
                <span className="font-medium text-stone-800">{email}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="mfa">MFA code</Label>
                <Input
                  id="mfa"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => {
                    setStep("credentials");
                    setMfaCode("");
                    setError(null);
                  }}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Verifying…" : "Sign in"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
