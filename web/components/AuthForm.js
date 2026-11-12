"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", login: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (!isSignup && params.get("existing") === "1") {
      setNotice("This email already has an account. Sign in instead.");
    }
  }, [isSignup]);

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const credentials = isSignup
      ? { name: form.name, email: form.email, password: form.password }
      : { login: form.login, password: form.password };

    try {
      await signIn(mode, credentials);
      router.replace("/");
    } catch (err) {
      if (isSignup && err.status === 409 && err.data?.field === "email") {
        router.push("/login?existing=1");
        return;
      }

      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth reveal">
      <div className="panel">
        <h1 className="auth-title">{isSignup ? "Create your shelf" : "Welcome back"}</h1>
        <p className="panel-sub">
          {isSignup ? "Pick a username your friends will find you by." : "Sign in to your shelf."}
        </p>

        {notice && <div className="alert alert-info">{notice}</div>}

        <form className="form" onSubmit={handleSubmit}>
          {isSignup ? (
            <>
              <div className="field">
                <label htmlFor="name">Username</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={update("name")}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
                <span className="field-hint">3 to 20 characters: letters, numbers or _</span>
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                  required
                />
              </div>
            </>
          ) : (
            <div className="field">
              <label htmlFor="login">Username or email</label>
              <input
                id="login"
                value={form.login}
                onChange={update("login")}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update("password")}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              required
            />
            {isSignup && <span className="field-hint">At least 8 characters</span>}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn" disabled={saving}>
            {saving ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
          </button>

          {isSignup && (
            <p className="auth-legal">
              By creating an account you agree to the <Link href="/terms">Terms of Service</Link> and confirm you
              have read the <Link href="/privacy">Privacy Policy</Link>. You must be 13 or older.
            </p>
          )}
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
