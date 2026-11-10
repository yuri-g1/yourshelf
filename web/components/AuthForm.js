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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

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
