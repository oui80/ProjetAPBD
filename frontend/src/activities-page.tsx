import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./api";
import { useAuth } from "./use-auth";

type ActivitiesResponse = { activities: unknown[] };

export function ActivitiesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadActivities() {
    setLoading(true);
    setError(null);
    try {
      await apiRequest<ActivitiesResponse>("/api/activities");
    } catch {
      setError("Impossible de charger l’historique.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    apiRequest<ActivitiesResponse>("/api/activities")
      .catch(() => {
        if (active) setError("Impossible de charger l’historique.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await auth.logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/activities" aria-label="PACE / LAB, historique">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>PACE / LAB</span>
        </a>
        <div className="user-menu">
          <span className="user-email">{auth.user?.email}</span>
          <button className="secondary-button" type="button" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main className="activities-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">VOTRE ESPACE</p>
            <h1>Mes activités</h1>
            <p>Retrouvez ici toutes vos séances importées.</p>
          </div>
          <button className="primary-button" type="button" disabled title="Disponible prochainement">
            Importer un FIT
          </button>
        </div>

        {loading && <div className="status-card" role="status">Chargement de l’historique…</div>}

        {error && (
          <div className="status-card error-state" role="alert">
            <p>{error}</p>
            <button className="secondary-button" type="button" onClick={loadActivities}>Réessayer</button>
          </div>
        )}

        {!loading && !error && (
          <section className="empty-state" aria-labelledby="empty-title">
            <div className="empty-icon" aria-hidden="true">↗</div>
            <p className="eyebrow">PRÊT POUR LA PREMIÈRE ACTIVITÉ</p>
            <h2 id="empty-title">Votre historique est vide</h2>
            <p>
              L’import de fichiers FIT et la synchronisation Intervals.icu arriveront lors de la prochaine étape.
            </p>
            <span className="coming-soon">Import disponible prochainement</span>
          </section>
        )}
      </main>
    </div>
  );
}
