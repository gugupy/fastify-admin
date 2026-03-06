import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useRbac } from "../lib/rbac";
import { getAdmin } from "../lib/FastifyAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { EyeIcon, EyeOffIcon, FastifyAdminIcon } from "../components/icons";
import {
  GoogleIcon,
  GitHubIcon,
  MicrosoftIcon,
} from "../components/OAuthIcons";
import { ThemeToggle } from "../components/ThemeToggle";

const CODE_LENGTH = 6;

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    if (!getAdmin().signup) {
      throw redirect({ to: "/login" });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const { refresh } = useRbac();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpSent) inputRefs.current[0]?.focus();
  }, [otpSent]);

  useEffect(() => {
    if (username.length < 2) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const body = await res.json().catch(() => ({}));
      setUsernameStatus(body.available ? "available" : "taken");
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const { google, github, microsoft } = getAdmin().oauth;
  const hasOAuth = google || github || microsoft;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email address.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, fullName, email, password }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.message ?? "Signup failed.");
      setLoading(false);
      return;
    }

    if (!body.requiresVerification) {
      await refresh();
      router.navigate({ to: "/" });
      return;
    }

    setOtpSent(true);
    setLoading(false);
  }

  function handleDigitChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    if (digit && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d)) submitOtp(next.join(""));
  }

  function handleDigitKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0)
      inputRefs.current[idx - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    if (pasted.length === CODE_LENGTH) submitOtp(pasted);
  }

  async function submitOtp(code: string) {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Verification failed.");
      setDigits(Array(CODE_LENGTH).fill(""));
      setLoading(false);
      inputRefs.current[0]?.focus();
      return;
    }

    await refresh();
    router.navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center">
              <FastifyAdminIcon size={16} />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              {getAdmin().name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Get started by creating your account
          </p>
        </div>

        <div className="border rounded-lg bg-background p-8 shadow-sm">
          {otpSent ? (
            <>
              <p className="text-sm font-medium mb-4 text-center">
                Enter verification code
              </p>
              <div
                className="flex justify-center gap-2 mb-6"
                onPaste={handlePaste}
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    disabled={loading}
                    className="w-10 h-12 rounded-md border border-input bg-background text-center text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50"
                  />
                ))}
              </div>
              {error && (
                <FieldError className="mb-4 text-center">{error}</FieldError>
              )}
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={loading || digits.some((d) => !d)}
                onClick={() => submitOtp(digits.join(""))}
              >
                {loading ? "Verifying…" : "Verify email"}
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  className="text-foreground font-medium underline underline-offset-4 hover:text-primary"
                  onClick={() => {
                    setOtpSent(false);
                    setDigits(Array(CODE_LENGTH).fill(""));
                    setError(null);
                  }}
                >
                  Back to sign up
                </button>
              </p>
            </>
          ) : (
            <>
              {hasOAuth && (
                <>
                  <div className="flex flex-col gap-2">
                    {google && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        asChild
                      >
                        <a href="/api/auth/google">
                          <GoogleIcon />
                          Continue with Google
                        </a>
                      </Button>
                    )}
                    {github && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        asChild
                      >
                        <a href="/api/auth/github">
                          <GitHubIcon />
                          Continue with GitHub
                        </a>
                      </Button>
                    )}
                    {microsoft && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        asChild
                      >
                        <a href="/api/auth/microsoft">
                          <MicrosoftIcon />
                          Continue with Microsoft
                        </a>
                      </Button>
                    )}
                  </div>
                  <FieldSeparator className="my-6">or</FieldSeparator>
                </>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder="janedoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pr-8"
                      required
                    />
                    {usernameStatus === "checking" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">…</span>
                    )}
                    {usernameStatus === "available" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500">✓</span>
                    )}
                    {usernameStatus === "taken" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive">✗</span>
                    )}
                  </div>
                  {usernameStatus === "taken" && (
                    <FieldError>Username is already taken.</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOffIcon size={16} />
                      ) : (
                        <EyeIcon size={16} />
                      )}
                    </button>
                  </div>
                </Field>

                {error && <FieldError>{error}</FieldError>}

                <Button
                  type="submit"
                  disabled={loading || usernameStatus === "taken" || usernameStatus === "checking"}
                  size="lg"
                  className="w-full mt-1"
                >
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-foreground font-medium underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
