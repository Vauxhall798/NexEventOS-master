"use client";

import { FormEvent, Suspense, useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { APP_INFO } from "@/lib/appInfo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { setTheme } = useTheme();

  useEffect(() => {
    try {
      setTheme("light");
    } catch (e) {
      // ignore
    }
  }, [setTheme]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">N</div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{APP_INFO.productName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to continue</p>
        </div>
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full justify-center" loading={submitting}>
                Sign In
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
