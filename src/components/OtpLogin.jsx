import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../api";

export default function OtpLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (step === "request") {
        await api.requestOtp(email);
        setStep("verify");
      } else {
        const auth = await api.loginWithOtp(email, code);
        onLogin(auth);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <ShieldCheck size={34} />
        <h1>Email OTP Login</h1>
        <p>Use your CommerceCore email account to access cart, orders, and admin tools.</p>
        <label>
          Email
          <input
            value={email}
            type="email"
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {step === "verify" && (
          <label>
            OTP Code
            <input value={code} required onChange={(event) => setCode(event.target.value)} />
          </label>
        )}
        {error && <div className="form-error">{error}</div>}
        <button className="primary full" disabled={loading} type="submit">
          {loading ? "Please wait..." : step === "request" ? "Send OTP" : "Verify OTP"}
        </button>
      </form>
    </main>
  );
}
