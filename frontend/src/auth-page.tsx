import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "./api";
import { useAuth } from "./use-auth";

type Mode = "login" | "register";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.loading && auth.user) return <Navigate to="/activities" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") await auth.login(email, password);
      else await auth.register(email, password);
      navigate("/activities", { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Connexion impossible pour le moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="brand-panel" aria-labelledby="brand-title">
        <a className="brand" href="/" aria-label="PACE / LAB, accueil">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>PACE / LAB</span>
        </a>
        <div>
          <p className="eyebrow">PRECISION SPORT · SOFT LAB</p>
          <h1 id="brand-title">Explorez vos activités en profondeur.</h1>
          <p className="brand-copy">
            Importez vos données sportives et retrouvez-les dans un espace personnel, clair et privé.
          </p>
        </div>
        <p className="privacy-note">Vos activités restent accessibles uniquement depuis votre compte.</p>
      </section>

      <section className="auth-panel" aria-labelledby="form-title">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Choix de l’action">
            <button
              className={mode === "login" ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Connexion
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => { setMode("register"); setError(null); }}
            >
              Créer un compte
            </button>
          </div>

          <h2 id="form-title">{mode === "login" ? "Bon retour" : "Créer votre espace"}</h2>
          <p className="form-intro">
            {mode === "login"
              ? "Connectez-vous pour accéder à votre historique."
              : "L’inscription est libre et ne prend que quelques secondes."}
          </p>

          <form onSubmit={submit} noValidate>
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={mode === "register" ? "password-help" : undefined}
            />
            {mode === "register" && (
              <p id="password-help" className="field-help">12 caractères minimum.</p>
            )}

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting
                ? "Veuillez patienter…"
                : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
