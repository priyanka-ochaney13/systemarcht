"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";

export default function AuthMenu() {
  const { user, loading, signOut } = useAuth();
  const hydrated = useHydrated();

  if (!hydrated || loading) return <span className="text-sm text-muted-foreground">Account…</span>;
  if (!user) {
    return (
      <Link href="/login" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted" aria-label="Open profile">
        {user.avatar_url ? (
          <Image src={user.avatar_url} alt="" width={28} height={28} unoptimized className="size-7 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold" aria-hidden="true">
            {user.display_name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="max-w-28 truncate">{user.display_name}</span>
      </Link>
      <button className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted" onClick={signOut} type="button">
        Sign out
      </button>
    </div>
  );
}