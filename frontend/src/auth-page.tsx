import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import runnerHero from "./assets/runner-editorial.webp";
import runnerHeroSquare from "./assets/runner-editorial-square.webp";
import { ApiError } from "./api";
import { Brand, Button, EditorialLabel } from "./ui";
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
    <main className="auth-page">
      <header className="auth-header page-container">
        <Brand />
        <p className="auth-header__note">Centralisez. Consultez. Progressez.</p>
      </header>

      <section className="auth-stage page-container" aria-label="Présentation et authentification">
        <figure className="auth-visual">
          <picture>
            <source media="(max-width: 720px)" srcSet={runnerHeroSquare} />
            <img
              src={runnerHero}
              width="1920"
              height="1080"
              alt="Athlète courant à vive allure dans une architecture contemporaine"
              fetchPriority="high"
            />
          </picture>
          <figcaption>
            <span>Mouvement / Données / Mémoire</span>
            <span>Performance lab</span>
          </figcaption>
        </figure>

        <div className="auth-panel" aria-labelledby="form-title">
          <div className="auth-card">
            <div className="auth-switch" aria-label="Choix de l’action">
              <button
                className={mode === "login" ? "is-active" : ""}
                type="button"
                aria-pressed={mode === "login"}
                onClick={() => { setMode("login"); setError(null); }}
              >
                01 — Connexion
              </button>
              <button
                className={mode === "register" ? "is-active" : ""}
                type="button"
                aria-pressed={mode === "register"}
                onClick={() => { setMode("register"); setError(null); }}
              >
                02 — Inscription
              </button>
            </div>

            <div className="auth-card__heading">
              <EditorialLabel>{mode === "login" ? "Accès membre" : "Nouveau membre"}</EditorialLabel>
              <h2 id="form-title">{mode === "login" ? "Bon retour." : "Créer votre espace."}</h2>
              <p>
                {mode === "login"
                  ? "Connectez-vous pour retrouver votre historique personnel."
                  : "L’inscription est libre et vos données restent associées à votre compte."}
              </p>
            </div>

            <form onSubmit={submit} noValidate>
              <div className="form-field">
                <label htmlFor="email">Adresse email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="form-field">
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
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}

              <Button type="submit" disabled={submitting} showArrow>
                {submitting
                  ? "Veuillez patienter…"
                  : mode === "login" ? "Se connecter" : "Créer mon compte"}
              </Button>
            </form>

            <p className="auth-card__privacy">Espace personnel · Session sécurisée</p>
          </div>
        </div>
      </section>
    </main>
  );
}
