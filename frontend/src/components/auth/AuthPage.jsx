"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authFetch } from "@/lib/authFetch";
import { useAuth } from "@/hooks/useAuth";
import GoogleButton from "@/components/auth/GoogleButton";
import { SiteHeader } from "@/components/common/SiteHeader";

function friendlyAuthError(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already exists for this email. Try signing in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 8 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Could not reach Firebase. Check your connection and try again.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}

export function AuthPage({ initialMode = "signin" }) {
  const router = useRouter();
  const { user, hydrated, loading, error: profileError, configured, refreshUser, signOut } = useAuth();
  const authLoading = !hydrated || loading;
  const mode = initialMode;
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && !loading && user) router.replace("/");
  }, [hydrated, loading, user, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const name = displayName.trim();
        if (!name) {
          setError("Enter your name.");
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateFirebaseProfile(result.user, { displayName: name });
        await result.user.getIdToken(true);
        await authFetch("/api/auth/me", {
          method: "PATCH",
          body: JSON.stringify({ display_name: name }),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      await refreshUser();
      router.replace("/");
    } catch (authError) {
      setError(
        authError.code
          ? friendlyAuthError(authError)
          : `You are signed in, but your profile could not be loaded: ${authError.message}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function retryProfileLoad() {
    setError("");
    try {
      await refreshUser();
      router.replace("/");
    } catch (requestError) {
      setError(requestError.message || "Could not load your profile.");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-7 text-center">
            <p className="text-sm font-medium text-primary">SystemArcht</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to manage your profile."
                : "Sign up to get your own profile."}
            </p>
          </div>

          {!configured ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              Firebase is not configured. Set the Firebase public environment values in
              <code className="mx-1">frontend/.env.local</code> and restart the frontend.
            </p>
          ) : (
            <>
              {hydrated && profileError && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  Your Firebase session is active, but the profile API could not verify it: {profileError}
                  <div className="mt-3 flex gap-3">
                    <button className="underline" onClick={retryProfileLoad} type="button">
                      Retry
                    </button>
                    <button className="underline" onClick={() => signOut()} type="button">
                      Sign out
                    </button>
                  </div>
                </div>
              )}

              <GoogleButton onError={setError} />
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>OR CONTINUE WITH EMAIL</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <label className="block space-y-1.5 text-sm font-medium">
                    Name
                    <input
                      autoComplete="name"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      maxLength={80}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                      value={displayName}
                    />
                  </label>
                )}
                <label className="block space-y-1.5 text-sm font-medium">
                  Email
                  <input
                    autoComplete="email"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  Password
                  <input
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    minLength={mode === "signup" ? 8 : 1}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <button
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting || authLoading}
                  type="submit"
                >
                  {submitting || authLoading
                    ? "Please wait…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New to SystemArcht?" : "Already have an account?"}{" "}
                <Link className="font-medium text-primary underline-offset-4 hover:underline" href={mode === "signin" ? "/signup" : "/login"}>
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </Link>
              </p>
            </>
          )}
        </section>
      </main>
    </>
  );
}
