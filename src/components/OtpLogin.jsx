import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../api";

export default function OtpLogin({ onLogin, onPasswordLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function normalizeMessage(err, fallback) {
    const message = String(err?.message || "").trim();
    return message || fallback;
  }

  async function requestCode() {
    await api.requestOtp(identifier);
    setStep("verify");
    setCode("");
    setInfo("OTP sent. Enter the latest code to continue.");
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      if (step === "request") {
        await requestCode();
      } else {
        const auth = await api.loginWithOtp(identifier, code);
        onLogin(auth);
      }
    } catch (err) {
      const message = normalizeMessage(err, "Unable to complete login right now.");
      const normalized = message.toLowerCase();

      if (step === "verify" && (normalized.includes("already been used") || normalized.includes("expired"))) {
        setStep("request");
        setCode("");
        setError("OTP expired/used. Please request a new OTP and try again.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <ShieldCheck size={34} />
        <h1>OTP Login</h1>
        <p>Use your TwoSoul email or username to access cart, orders, and admin tools.</p>
        <label>
          Email or Username
          <input
            value={identifier}
            type="text"
            autoComplete="username"
            placeholder="Enter email or username"
            required
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </label>
        {step === "verify" && (
          <>
            <label>
              OTP Code
              <input value={code} required onChange={(event) => setCode(event.target.value)} />
            </label>
            <button
              className="text-button"
              type="button"
              disabled={loading || !identifier}
              onClick={async () => {
                setLoading(true);
                setError("");
                setInfo("");
                try {
                  await requestCode();
                } catch (err) {
                  setError(normalizeMessage(err, "Failed to resend OTP."));
                } finally {
                  setLoading(false);
                }
              }}
            >
              Resend OTP
            </button>
          </>
        )}
        {info && <div className="form-hint">{info}</div>}
        {error && <div className="form-error">{error}</div>}
        <button className="primary full" disabled={loading} type="submit">
          {loading ? "Please wait..." : step === "request" ? "Send OTP" : "Verify OTP"}
        </button>
        <button className="secondary full" type="button" onClick={onPasswordLogin}>
          Login with Username & Password
        </button>
      </form>
    </main>
  );
}
