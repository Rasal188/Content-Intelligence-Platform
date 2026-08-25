"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@v1/ui/button";
import { useState } from "react";

type Mode = "signIn" | "signUp" | "verify" | "forgot" | "reset";
const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

// Module-level (stable identity) — defining this inside AuthForm remounts inputs every
// keystroke, which steals focus after one character.
function Shell({
  onSubmit,
  cta,
  pending,
  error,
  info,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  cta: string;
  pending: boolean;
  error: string | null;
  info: string | null;
  children: React.ReactNode;
}) {
  return (
    <form className="flex w-72 flex-col gap-3" onSubmit={onSubmit}>
      {children}
      <Button type="submit" disabled={pending} className="font-mono">
        {pending ? "…" : cta}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {info && <p className="text-xs text-muted-foreground">{info}</p>}
    </form>
  );
}

const Switch = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    className="text-xs text-muted-foreground underline"
    onClick={onClick}
  >
    {label}
  </button>
);

function getAuthErrorMessage(err: unknown, currentMode?: Mode): string {
  if (!err) {
    return "Unable to complete authentication. Please try again.";
  }

  // Extract raw message across various Convex error formats
  let rawMsg = "";
  if (typeof err === "string") {
    rawMsg = err;
  } else if (typeof err === "object" && err !== null) {
    const obj = err as Record<string, unknown>;
    if (typeof obj.data === "string") {
      rawMsg = obj.data;
    } else if (typeof obj.message === "string") {
      rawMsg = obj.message;
    } else if (obj.cause && typeof (obj.cause as Record<string, unknown>).message === "string") {
      rawMsg = (obj.cause as Record<string, unknown>).message as string;
    } else {
      rawMsg = String(err);
    }
  } else {
    rawMsg = String(err);
  }

  const lower = rawMsg.toLowerCase();

  // 1. Existing account / duplicate signup (Prioritized to prevent falling into mode defaults)
  if (
    lower.includes("already exists") ||
    lower.includes("account already exists") ||
    lower.includes("email already in use") ||
    lower.includes("account with this email")
  ) {
    return "An account with this email already exists. Please sign in.";
  }

  // 2. Password policy requirements (Sign up / password creation / reset)
  if (
    lower.includes("password must be at least") ||
    lower.includes("8 characters") ||
    lower.includes("include upper") ||
    lower.includes("password requirements") ||
    lower.includes("missing `password`")
  ) {
    return "Password must be at least 8 characters and include upper, lower, and a number.";
  }

  // 3. Verification code & OTP errors
  if (
    lower.includes("invalid code") ||
    lower.includes("could not verify code") ||
    lower.includes("expired") ||
    lower.includes("verification code") ||
    currentMode === "verify" ||
    (currentMode === "reset" && lower.includes("code"))
  ) {
    if (lower.includes("invalidsecret") || lower.includes("invalid credentials")) {
      return "Invalid email or password.";
    }
    return "Invalid or expired verification code.";
  }

  // 4. Rate limiting / brute force
  if (
    lower.includes("toomanyfailedattempts") ||
    lower.includes("rate limit") ||
    lower.includes("too many attempts")
  ) {
    return "Too many failed attempts. Please try again later.";
  }

  // 5. Invalid credentials / wrong password / nonexistent account
  if (
    lower.includes("invalidsecret") ||
    lower.includes("invalidaccountid") ||
    lower.includes("invalid credentials") ||
    lower.includes("account not found") ||
    lower.includes("wrong password") ||
    lower.includes("user not found") ||
    currentMode === "signIn"
  ) {
    return "Invalid email or password.";
  }

  // 6. Network / connection errors
  if (
    lower.includes("networkerror") ||
    lower.includes("failed to fetch") ||
    lower.includes("connection") ||
    lower.includes("timeout")
  ) {
    return "Unable to connect to authentication server. Please check your connection.";
  }

  // If a clean specific message exists and isn't technical framework noise, display it
  if (
    !rawMsg.includes("Server Error") &&
    !rawMsg.includes("Uncaught Error") &&
    !rawMsg.includes("Request ID:") &&
    rawMsg.length > 0 &&
    rawMsg.length < 120
  ) {
    return rawMsg;
  }

  return "Unable to complete authentication. Please try again.";
}

export function AuthForm() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const go = (fn: () => Promise<void>) => async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await fn();
    } catch (err) {
      setError(getAuthErrorMessage(err, mode));
    } finally {
      setPending(false);
    }
  };

  const submitSignIn = go(async () => {
    await signIn("password", { email, password, flow: "signIn" });
  });
  const submitSignUp = go(async () => {
    await signIn("password", { email, password, flow: "signUp" });
    setInfo(
      "Enter the verification code (check server logs while email is in dev mode).",
    );
    setMode("verify");
  });
  const submitVerify = go(async () => {
    await signIn("password", { email, code, flow: "email-verification" });
  });
  const submitForgot = go(async () => {
    await signIn("password", { email, flow: "reset" });
    setInfo("Enter the reset code (check server logs) and a new password.");
    setMode("reset");
  });
  const submitReset = go(async () => {
    await signIn("password", {
      email,
      code,
      newPassword,
      flow: "reset-verification",
    });
  });
  const switchTo = (m: Mode) => {
    setError(null);
    setInfo(null);
    setMode(m);
  };

  const shellProps = { pending, error, info };

  return (
    <div className="flex flex-col items-center gap-3">
      {mode === "signIn" && (
        <>
          <Shell onSubmit={submitSignIn} cta="Sign in" {...shellProps}>
            <input
              className={input}
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={input}
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Shell>
          <div className="flex w-72 justify-between">
            <Switch label="Create account" onClick={() => switchTo("signUp")} />
            <Switch
              label="Forgot password?"
              onClick={() => switchTo("forgot")}
            />
          </div>
        </>
      )}
      {mode === "signUp" && (
        <>
          <Shell onSubmit={submitSignUp} cta="Create account" {...shellProps}>
            <input
              className={input}
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={input}
              type="password"
              placeholder="Password (8+, upper, lower, number)"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Shell>
          <Switch
            label="Have an account? Sign in"
            onClick={() => switchTo("signIn")}
          />
        </>
      )}
      {mode === "verify" && (
        <Shell onSubmit={submitVerify} cta="Verify email" {...shellProps}>
          <p className="text-xs text-muted-foreground">Code sent to {email}</p>
          <input
            className={input}
            inputMode="numeric"
            placeholder="Verification code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Shell>
      )}
      {mode === "forgot" && (
        <>
          <Shell onSubmit={submitForgot} cta="Send reset code" {...shellProps}>
            <input
              className={input}
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Shell>
          <Switch label="Back to sign in" onClick={() => switchTo("signIn")} />
        </>
      )}
      {mode === "reset" && (
        <Shell onSubmit={submitReset} cta="Set new password" {...shellProps}>
          <p className="text-xs text-muted-foreground">
            Reset code for {email}
          </p>
          <input
            className={input}
            inputMode="numeric"
            placeholder="Reset code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            className={input}
            type="password"
            placeholder="New password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Shell>
      )}
    </div>
  );
}
