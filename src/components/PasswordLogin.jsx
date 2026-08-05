import { useState } from "react";
import { KeyRound } from "lucide-react";
import { api } from "../api";

function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

const initialRegister = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phoneNumber: "",
};

export default function PasswordLogin({ onLogin, onBackToOtp }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");

    const username = normalizeEmail(mode === "login" ? email : registerForm.email);
    if (!isValidEmail(username)) {
      setError("Username must be a valid email address.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        let auth;
        try {
          auth = await api.loginWithPassword(username, password);
        } catch (err) {
          const message = String(err?.message || "").toLowerCase();
          if (message.includes("unexpected error")) {
            auth = await api.loginWithPassword(username, password);
          } else {
            throw err;
          }
        }
        onLogin(auth);
      } else {
        const auth = await api.register({
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          email: username,
          password: registerForm.password,
          phoneNumber: registerForm.phoneNumber || null,
        });
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
        <KeyRound size={34} />
        <h1>{mode === "login" ? "Username Login" : "Create Account"}</h1>
        <p>
          {mode === "login"
            ? "Log in using username (email) and password."
            : "Create a new account. Username must be your email."}
        </p>

        {mode === "register" && (
          <>
            <label>
              First name
              <input
                value={registerForm.firstName}
                required
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, firstName: event.target.value }))
                }
              />
            </label>
            <label>
              Last name
              <input
                value={registerForm.lastName}
                required
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, lastName: event.target.value }))
                }
              />
            </label>
          </>
        )}

        <label>
          Username (Email)
          <input
            type="email"
            autoComplete="username"
            placeholder="name@example.com"
            required
            value={mode === "login" ? email : registerForm.email}
            onChange={(event) =>
              mode === "login"
                ? setEmail(event.target.value)
                : setRegisterForm((current) => ({ ...current, email: event.target.value }))
            }
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            value={mode === "login" ? password : registerForm.password}
            onChange={(event) =>
              mode === "login"
                ? setPassword(event.target.value)
                : setRegisterForm((current) => ({ ...current, password: event.target.value }))
            }
          />
        </label>

        {mode === "register" && (
          <label>
            Phone number (optional)
            <input
              value={registerForm.phoneNumber}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, phoneNumber: event.target.value }))
              }
            />
          </label>
        )}

        {error && <div className="form-error">{error}</div>}

        <button className="primary full" disabled={loading} type="submit">
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : "Create Account"}
        </button>

        <button
          className="secondary full"
          type="button"
          onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
        >
          {mode === "login" ? "Create an account" : "Back to username login"}
        </button>

        <button className="text-button" type="button" onClick={onBackToOtp}>
          Use OTP instead
        </button>
      </form>
    </main>
  );
}
