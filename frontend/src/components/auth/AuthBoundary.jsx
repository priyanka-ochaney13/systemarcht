"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

export default function AuthBoundary({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, loading, error, configured, refreshUser, signOut } = useAuth();
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (hydrated && !isPublicPath && !loading && !user && !error && configured) {
      router.replace("/login");
    }
  }, [configured, error, hydrated, isPublicPath, loading, router, user]);

  if (isPublicPath) return children;

  if (!hydrated || loading) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Checking your account…</main>;
  }
  if (!configured) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-destructive">Firebase sign-in is not configured.</main>;
  }
  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">We couldn’t verify your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="sa-btn-primary" onClick={() => refreshUser().catch(() => {})} type="button">
            Try again
          </button>
          <button className="sa-btn-secondary" onClick={() => signOut()} type="button">
            Sign out
          </button>
        </div>
      </main>
    );
  }
  if (!user) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Redirecting to sign in…</main>;
  }

  return children;
}
