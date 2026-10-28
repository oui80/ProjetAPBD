import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./api";
import { Brand, Button, EditorialLabel } from "./ui";
import { useAuth } from "./use-auth";

type Activity = {
  id: string;
  filename: string;
  sport: string | null;
  startTime: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

type ActivitiesResponse = { activities: Activity[] };
type ImportResult = {
  filename: string;
  status: "imported" | "duplicate" | "error";
  message?: string;
};
type ImportResponse = { results: ImportResult[] };

export function ActivitiesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  async function loadActivities() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<ActivitiesResponse>("/api/activities");
      setActivities(response.activities);
    } catch {
      setError("Impossible de charger l’historique.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    apiRequest<ActivitiesResponse>("/api/activities")
      .then((response) => {
        if (active) setActivities(response.activities);
      })
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

  async function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    const form = new FormData();
    for (const file of files) form.append("files", file);
    setUploading(true);
    setImportResults([]);
    try {
      const response = await apiRequest<ImportResponse>("/api/imports/fit", {
        method: "POST",
        body: form,
      });
      setImportResults(response.results);
      await loadActivities();
    } catch {
      setImportResults([
        { filename: "Lot d’import", status: "error", message: "Import impossible." },
      ]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
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
        <section className="activities-toolbar" aria-labelledby="history-title">
          <div>
            <EditorialLabel>Historique personnel</EditorialLabel>
            <h1 id="history-title">Activités</h1>
          </div>
          <input
            ref={fileInput}
            className="visually-hidden"
            type="file"
            accept=".fit,application/vnd.ant.fit,application/octet-stream"
            multiple
            onChange={importFiles}
          />
          <Button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            showArrow
          >
            {uploading ? "Import en cours…" : "Importer un FIT"}
          </Button>
        </section>

        {importResults.length > 0 && (
          <section className="import-results" aria-label="Bilan de l’import" aria-live="polite">
            {importResults.map((result, index) => (
              <p
                key={`${result.filename}-${index}`}
                className={`import-result import-result--${result.status}`}
              >
                <span>{result.filename}</span>
                <strong>
                  {result.status === "imported" && "Importé"}
                  {result.status === "duplicate" && "Doublon"}
                  {result.status === "error" &&
                    `Erreur${result.message ? ` — ${result.message}` : ""}`}
                </strong>
              </p>
            ))}
          </section>
        )}

        {loading && <div className="status-panel" role="status">Chargement de l’historique…</div>}

        {error && (
          <div className="status-panel status-panel--error" role="alert">
            <p>{error}</p>
            <Button variant="secondary" type="button" onClick={loadActivities} showArrow>Réessayer</Button>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <section className="empty-state" aria-labelledby="empty-title">
            <div className="empty-state__index" aria-hidden="true">00</div>
            <div className="empty-state__content">
              <EditorialLabel>Point de départ</EditorialLabel>
              <h2 id="empty-title">Aucune activité.<br />Pour le moment.</h2>
            </div>
            <div className="empty-state__detail">
              <p>
                Importez un ou plusieurs fichiers FIT pour retrouver ici vos séances.
              </p>
              <span>Historique vide — prêt à recevoir vos données</span>
            </div>
          </section>
        )}

        {!loading && !error && activities.length > 0 && (
          <section className="activity-list" aria-label="Activités importées">
            {activities.map((activity, index) => (
              <article className="activity-row" key={activity.id}>
                <span className="activity-row__index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{activity.sport ?? "Sport non renseigné"}</h2>
                  <p>{activity.filename}</p>
                </div>
                <dl>
                  <div>
                    <dt>Date</dt>
                    <dd>
                      {activity.startTime
                        ? new Date(activity.startTime).toLocaleString("fr-FR")
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Durée</dt>
                    <dd>
                      {activity.durationSeconds === null
                        ? "—"
                        : `${Math.round(activity.durationSeconds / 60)} min`}
                    </dd>
                  </div>
                  <div>
                    <dt>Distance</dt>
                    <dd>
                      {activity.distanceMeters === null
                        ? "—"
                        : `${(activity.distanceMeters / 1000).toFixed(2)} km`}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
