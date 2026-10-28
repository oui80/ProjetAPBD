import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./api";
import { Brand, Button, EditorialLabel } from "./ui";
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
      <header className="app-header page-container">
        <Brand to="/activities" />
        <div className="user-menu">
          <span className="user-email">{auth.user?.email}</span>
          <Button variant="text" type="button" onClick={logout} showArrow>Déconnexion</Button>
        </div>
      </header>

      <main className="activities-content page-container">
        {loading && <div className="status-panel" role="status">Chargement de l’historique…</div>}

        {error && (
          <div className="status-panel status-panel--error" role="alert">
            <p>{error}</p>
            <Button variant="secondary" type="button" onClick={loadActivities} showArrow>Réessayer</Button>
          </div>
        )}

        {!loading && !error && (
          <section className="empty-state" aria-labelledby="empty-title">
            <div className="empty-state__index" aria-hidden="true">00</div>
            <div className="empty-state__content">
              <EditorialLabel>Point de départ</EditorialLabel>
              <h2 id="empty-title">Aucune activité.<br />Pour le moment.</h2>
            </div>
            <div className="empty-state__detail">
              <p>
                Votre historique accueillera ici vos séances. L’import FIT et la synchronisation
                Intervals.icu arriveront lors d’une prochaine étape.
              </p>
              <span>Historique vide — prêt à recevoir vos données</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
