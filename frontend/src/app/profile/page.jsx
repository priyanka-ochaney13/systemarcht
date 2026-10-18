"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SiteHeader } from "@/components/common/SiteHeader";
import { useAuth } from "@/hooks/useAuth";

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user.display_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(user.display_name);
  }, [user.display_name]);

  async function handleSubmit(event) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("Name cannot be empty.");
      setSaved(false);
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile(name);
      setDisplayName(name);
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-8 flex items-center gap-4">
        {user.avatar_url ? (
          <Image src={user.avatar_url} alt="" width={64} height={64} unoptimized className="size-16 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-muted text-xl font-semibold" aria-hidden="true">
            {user.display_name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit the name shown on your account.</p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-1.5 text-sm font-medium" htmlFor="profile-email">
          Email
          <input
            className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2.5 text-foreground"
            id="profile-email"
            readOnly
            value={user.email}
          />
          <span className="block text-xs font-normal text-muted-foreground">
            Email is managed by your sign-in provider.
          </span>
        </label>
        <label className="block space-y-1.5 text-sm font-medium" htmlFor="profile-name">
          Display name
          <input
            autoComplete="name"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            id="profile-name"
            maxLength={80}
            minLength={1}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setSaved(false);
            }}
            required
            value={displayName}
          />
        </label>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        {saved && <p className="text-sm text-green-700 dark:text-green-400" role="status">Profile saved.</p>}
        <button
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || displayName.trim() === user.display_name}
          type="submit"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 justify-center px-4 py-10 sm:py-14">
        <ProfileForm />
      </main>
    </>
  );
}
