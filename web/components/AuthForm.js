"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuth } from "@/components/AuthProvider";
import { useSlow } from "@/lib/api";
import { authHref, safeNext } from "@/lib/next";

const NAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const PREFILL_KEY = "yourshelf:prefill-login";

const HINTS = {
  name: "3 to 20 characters: letters, numbers or _",
  password: `At least ${MIN_PASSWORD} characters`,
};

// Same rules the API enforces, checked here so people see problems before submitting.
function validate(isSignup, form) {
  const errors = {};

  if (isSignup) {
    if (!NAME_PATTERN.test(form.name)) errors.name = `Username must be ${HINTS.name.toLowerCase()}`;
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email, like you@example.com";
    if (form.password.length < MIN_PASSWORD) errors.password = `Password needs at least ${MIN_PASSWORD} characters`;
  } else {
    if (!form.login.trim()) errors.login = "Enter your username or email";
    if (!form.password) errors.password = "Enter your password";
  }

  return errors;
}

// Puts a server answer next to the field it is about, instead of at the bottom of the form.
function fieldForServerError(isSignup, err) {
  if (err.offline || err.status === 429) return null;
  const message = err.message.toLowerCase();

  if (!isSignup) return err.status === 401 ? "credentials" : null;
  if (message.includes("username")) return "name";
  if (message.includes("email")) return "email";
  if (message.includes("password")) return "password";
  return null;
}

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", login: "", password: "" });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState(null);
  // Wrong username/email or password: we cannot tell which one, so both fields are marked
  // and the message is shown once, under the password.
  const [credentialsError, setCredentialsError] = useState(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [next, setNext] = useState("/");
  const slow = useSlow(saving);
  const refs = { name: useRef(null), email: useRef(null), login: useRef(null), password: useRef(null) };

  const clientErrors = validate(isSignup, form);
  const errorFor = (field) =>
    serverErrors[field] ||
    (credentialsError && field === "password" ? credentialsError : null) ||
    (touched[field] ? clientErrors[field] : null);
  const flagged = (field) => Boolean(errorFor(field) || (credentialsError && field === "login"));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get("next")));

    if (!isSignup && params.get("existing") === "1") {
      setNotice("This email already has an account. Sign in with it below.");
      try {
        const email = sessionStorage.getItem(PREFILL_KEY);
        sessionStorage.removeItem(PREFILL_KEY);
        if (email) {
          setForm((current) => ({ ...current, login: email }));
          refs.password.current?.focus();
        }
      } catch {}
    }
    // refs are stable for the life of the form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignup]);

  useEffect(() => {
    if (user && !saving) router.replace(next);
  }, [user, saving, next, router]);

  function update(field, transform = (value) => value) {
    return (event) => {
      const value = transform(event.target.value);
      setForm((current) => ({ ...current, [field]: value }));
      if (serverErrors[field]) setServerErrors((current) => ({ ...current, [field]: null }));
      if (formError) setFormError(null);
      if (credentialsError && (field === "login" || field === "password")) setCredentialsError(null);
    };
  }

  function blur(field) {
    return () => {
      if (form[field]) setTouched((current) => ({ ...current, [field]: true }));
    };
  }

  function watchCaps(event) {
    if (event.getModifierState) setCapsLock(event.getModifierState("CapsLock"));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const fields = isSignup ? ["name", "email", "password"] : ["login", "password"];
    setTouched(Object.fromEntries(fields.map((field) => [field, true])));
    setServerErrors({});
    setFormError(null);
    setCredentialsError(null);

    const firstInvalid = fields.find((field) => clientErrors[field]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    setSaving(true);
    const credentials = isSignup
      ? { name: form.name, email: form.email.trim(), password: form.password }
      : { login: form.login.trim(), password: form.password };

    try {
      await signIn(mode, credentials);
      router.replace(next);
    } catch (err) {
      if (isSignup && err.status === 409 && err.data?.field === "email") {
        try {
          sessionStorage.setItem(PREFILL_KEY, form.email.trim());
        } catch {}
        const to = authHref("login", next);
        router.push(`${to}${to.includes("?") ? "&" : "?"}existing=1`);
        return;
      }

      const field = fieldForServerError(isSignup, err);
      if (field === "credentials") {
        setCredentialsError(err.message);
        setForm((current) => ({ ...current, password: "" }));
        refs.password.current?.focus();
      } else if (field) {
        setServerErrors({ [field]: err.message });
        if (field === "password") setForm((current) => ({ ...current, password: "" }));
        refs[field].current?.focus();
      } else {
        setFormError({ message: err.message, offline: err.offline });
      }
      setSaving(false);
    }
  }

  function fieldProps(field) {
    const error = errorFor(field);
    const pairedWithPassword = credentialsError && field === "login";
    const describedBy = [error ? `${field}-error` : pairedWithPassword ? "password-error" : null, HINTS[field] && isSignup ? `${field}-hint` : null]
      .filter(Boolean)
      .join(" ");

    return {
      id: field,
      ref: refs[field],
      onBlur: blur(field),
      "aria-invalid": flagged(field) ? true : undefined,
      "aria-describedby": describedBy || undefined,
      className: flagged(field) ? "is-invalid" : undefined,
    };
  }

  function fieldMessage(field) {
    const error = errorFor(field);
    if (error) {
      return (
        <span id={`${field}-error`} className="field-error" role="alert">
          {error}
        </span>
      );
    }
    if (isSignup && HINTS[field]) {
      return (
        <span id={`${field}-hint`} className="field-hint">
          {HINTS[field]}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="auth reveal">
      <div className="panel">
        <h1 className="auth-title">{isSignup ? "Create your shelf" : "Welcome back"}</h1>
        <p className="panel-sub">
          {isSignup ? "Pick a username your friends will find you by." : "Sign in to your shelf."}
        </p>

        {notice && <div className="alert alert-info">{notice}</div>}

        <form className="form" onSubmit={handleSubmit} noValidate>
          {isSignup ? (
            <>
              <div className="field">
                <label htmlFor="name">Username</label>
                <input
                  {...fieldProps("name")}
                  value={form.name}
                  onChange={update("name", (value) => value.toLowerCase().replace(/\s/g, ""))}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={20}
                />
                {fieldMessage("name")}
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  {...fieldProps("email")}
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                {fieldMessage("email")}
              </div>
            </>
          ) : (
            <div className="field">
              <label htmlFor="login">Username or email</label>
              <input
                {...fieldProps("login")}
                value={form.login}
                onChange={update("login")}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
              {fieldMessage("login")}
            </div>
          )}

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                {...fieldProps("password")}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                onKeyUp={watchCaps}
                onKeyDown={watchCaps}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}
              </button>
            </div>
            {fieldMessage("password")}
            {capsLock && <span className="field-hint field-warn">Caps Lock is on</span>}
          </div>

          {formError && (
            <div className="alert alert-error" role="alert">
              {formError.message}
            </div>
          )}

          <button className="btn" disabled={saving}>
            {saving ? (isSignup ? "Creating your shelf..." : "Signing in...") : isSignup ? "Create account" : "Sign in"}
          </button>

          <p className="slow-note auth-slow" role="status" aria-live="polite">
            {saving && slow ? "Waking up the server. The free plan sleeps when idle, so the first sign in can take up to a minute." : ""}
          </p>

          {isSignup && (
            <p className="auth-legal">
              By creating an account you agree to the <Link href="/terms">Terms of Service</Link> and confirm you
              have read the <Link href="/privacy">Privacy Policy</Link>. You must be 13 or older.
            </p>
          )}
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link href={authHref(isSignup ? "login" : "signup", next)}>
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
