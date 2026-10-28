import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { ActivitySummary } from "./activity-types";
import { sportCategory, sportLabel } from "./activity-types";
import { apiRequest } from "./api";
import { formatDate, formatDistance, formatDuration, formatPace } from "./formatters";
import { Brand, Button, EditorialLabel } from "./ui";
import { useAuth } from "./use-auth";

type ActivitiesResponse = {
  activities: ActivitySummary[];
  total: number;
  page: number;
  pageSize: number;
};
type DashboardResponse = {
  totals: {
    activityCount: number;
    distanceMeters: number | null;
    durationSeconds: number | null;
    totalAscentMeters: number | null;
    sports: Record<string, number>;
    weeklyVolume: Array<{ week: string; durationSeconds: number; distanceMeters: number }>;
  };
  fitness: {
    status: "ready" | "insufficient";
    reason: string | null;
    atl: number | null;
    ctl: number | null;
    freshness: number | null;
    freshnessChange7Days: number | null;
  };
  settings: { maxHeartRate: number | null };
};
type ImportResult = {
  filename: string;
  status: "imported" | "duplicate" | "error";
  message?: string;
};

const periods = [
  ["7", "7 jours"],
  ["30", "30 jours"],
  ["90", "90 jours"],
  ["all", "Tout"],
];

export function ActivitiesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const period = searchParams.get("period") ?? "30";
  const sport = searchParams.get("sport") ?? "";
  const sort = searchParams.get("sort") ?? "desc";
  const page = Number(searchParams.get("page") ?? "1");
  const query = searchParams.get("search") ?? "";
  const [searchDraft, setSearchDraft] = useState(query);
  const [history, setHistory] = useState<ActivitiesResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [maxHeartRateDraft, setMaxHeartRateDraft] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const listQuery = new URLSearchParams(queryString);
      listQuery.set("pageSize", "8");
      const [activities, summary] = await Promise.all([
        apiRequest<ActivitiesResponse>(`/api/activities?${listQuery}`),
        apiRequest<DashboardResponse>(`/api/activities/dashboard?period=${period}`),
      ]);
      setHistory(activities);
      setDashboard(summary);
      setMaxHeartRateDraft(summary.settings.maxHeartRate?.toString() ?? "");
    } catch {
      setError("Impossible de charger l’historique sportif.");
    } finally {
      setLoading(false);
    }
  }, [period, queryString]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    updateFilter("search", searchDraft.trim());
  }

  async function saveMaxHeartRate(event: FormEvent) {
    event.preventDefault();
    const value = Number(maxHeartRateDraft);
    if (!Number.isInteger(value) || value < 100 || value > 240) return;
    await apiRequest("/api/user/sport-settings", {
      method: "PUT",
      body: JSON.stringify({ maxHeartRate: value }),
    });
    await loadData();
  }

  async function importFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;
    const form = new FormData();
    for (const file of files) form.append("files", file);
    setUploading(true);
    setImportResults([]);
    try {
      const response = await apiRequest<{ results: ImportResult[] }>("/api/imports/fit", {
        method: "POST",
        body: form,
      });
      setImportResults(response.results);
      await loadData();
    } catch {
      setImportResults([{ filename: "Lot d’import", status: "error", message: "Import impossible." }]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

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
        <section className="activities-toolbar" aria-labelledby="history-title">
          <div><EditorialLabel>Tableau de bord sportif</EditorialLabel><h1 id="history-title">Activités</h1></div>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".fit,application/vnd.ant.fit,application/octet-stream" multiple onChange={importFiles} />
          <Button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} showArrow>
            {uploading ? "Import en cours…" : "Importer un FIT"}
          </Button>
        </section>

        <div className="period-filter" aria-label="Période du tableau de bord">
          {periods.map(([value, label]) => (
            <button key={value} className={period === value ? "is-active" : ""} onClick={() => updateFilter("period", value)}>{label}</button>
          ))}
        </div>

        {importResults.length > 0 && <ImportResults results={importResults} />}
        {loading && <div className="status-panel" role="status">Calcul de votre historique…</div>}
        {error && <div className="status-panel status-panel--error" role="alert"><p>{error}</p><Button variant="secondary" onClick={loadData}>Réessayer</Button></div>}

        {!loading && !error && dashboard && (
          <>
            <section className="dashboard-grid" aria-label="Synthèse de l’entraînement">
              <FitnessTile dashboard={dashboard} maxHeartRateDraft={maxHeartRateDraft} setMaxHeartRateDraft={setMaxHeartRateDraft} onSave={saveMaxHeartRate} />
              <SummaryTile label="Activités" value={String(dashboard.totals.activityCount)} detail={`Sur ${period === "all" ? "tout l’historique" : `${period} jours`}`} />
              <SummaryTile label="Distance" value={dashboard.totals.distanceMeters === null ? "—" : formatDistance(dashboard.totals.distanceMeters)} detail={dashboard.totals.durationSeconds === null ? "Durée absente" : formatDuration(dashboard.totals.durationSeconds)} />
              <SummaryTile label="Dénivelé +" value={dashboard.totals.totalAscentMeters === null ? "—" : `${Math.round(dashboard.totals.totalAscentMeters)} m`} detail={sportDistribution(dashboard.totals.sports)} />
              <VolumeTile values={dashboard.totals.weeklyVolume} />
            </section>

            <section className="history-section">
              <div className="history-heading"><EditorialLabel>Journal d’entraînement</EditorialLabel><h2>Historique</h2></div>
              <form className="history-filters" onSubmit={submitSearch}>
                <label><span>Recherche</span><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Nom du fichier…" /></label>
                <label><span>Sport</span><select value={sport} onChange={(event) => updateFilter("sport", event.target.value)}><option value="">Tous</option><option value="running">Course</option><option value="trail">Trail</option><option value="cycling">Vélo</option><option value="transition">Transition</option></select></label>
                <label><span>Tri</span><select value={sort} onChange={(event) => updateFilter("sort", event.target.value)}><option value="desc">Plus récent</option><option value="asc">Plus ancien</option></select></label>
                <Button variant="secondary" type="submit">Rechercher</Button>
              </form>
            </section>

            {history && history.activities.length === 0 ? (
              <section className="empty-state"><div className="empty-state__index">00</div><div className="empty-state__content"><h2>Aucune activité.</h2></div><div className="empty-state__detail"><p>Utilisez le bouton « Importer un FIT » en haut de la page ou modifiez les filtres.</p></div></section>
            ) : (
              <section className="activity-card-grid" aria-label="Activités importées">
                {history?.activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} from={location.search} />
                ))}
              </section>
            )}
            {history && history.total > history.pageSize && (
              <nav className="pagination" aria-label="Pagination de l’historique">
                <button disabled={page <= 1} onClick={() => updateFilter("page", String(page - 1))}>← Précédent</button>
                <span>Page {page} / {Math.ceil(history.total / history.pageSize)}</span>
                <button disabled={page >= Math.ceil(history.total / history.pageSize)} onClick={() => updateFilter("page", String(page + 1))}>Suivant →</button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ActivityCard({ activity, from }: { activity: ActivitySummary; from: string }) {
  const category = sportCategory(activity);
  const performance = category === "cycling"
    ? activity.averageSpeedMps === null ? null : `${(activity.averageSpeedMps * 3.6).toFixed(1)} km/h`
    : activity.averagePaceSecondsPerKm === null ? null : formatPace(activity.averagePaceSecondsPerKm);
  return (
    <Link className={`activity-card activity-card--${category}`} to={`/activities/${activity.id}?from=${encodeURIComponent(from)}`}>
      <div className="activity-card__top"><span>{sportLabel(activity)}</span><time>{activity.startTime ? formatDate(activity.startTime) : "Date absente"}</time></div>
      <h3>{activity.filename.replace(/\.fit$/i, "")}</h3>
      <dl>
        {activity.distanceMeters !== null && <div><dt>Distance</dt><dd>{formatDistance(activity.distanceMeters)}</dd></div>}
        {activity.durationSeconds !== null && <div><dt>Durée</dt><dd>{formatDuration(activity.durationSeconds)}</dd></div>}
        {performance && <div><dt>{category === "cycling" ? "Vitesse" : "Allure"}</dt><dd>{performance}</dd></div>}
        {activity.totalAscentMeters !== null && <div><dt>D+</dt><dd>{Math.round(activity.totalAscentMeters)} m</dd></div>}
        {activity.averageHeartRateBpm !== null && <div><dt>FC</dt><dd>{Math.round(activity.averageHeartRateBpm)} bpm</dd></div>}
        {activity.averagePowerWatts !== null && <div><dt>Puissance</dt><dd>{Math.round(activity.averagePowerWatts)} W</dd></div>}
      </dl>
      <span className="activity-card__open">Analyser ↗</span>
    </Link>
  );
}

function FitnessTile({ dashboard, maxHeartRateDraft, setMaxHeartRateDraft, onSave }: { dashboard: DashboardResponse; maxHeartRateDraft: string; setMaxHeartRateDraft: (value: string) => void; onSave: (event: FormEvent) => void }) {
  return (
    <article className="dashboard-tile fitness-tile">
      <div><span className="dashboard-tile__label">Forme & fraîcheur estimée</span><strong className="fitness-value">{dashboard.fitness.freshness === null ? "—" : dashboard.fitness.freshness.toFixed(1)}</strong></div>
      {dashboard.fitness.status === "ready" ? (
        <><dl className="fitness-breakdown"><div><dt>ATL · 7 j</dt><dd>{dashboard.fitness.atl?.toFixed(1)}</dd></div><div><dt>CTL · 42 j</dt><dd>{dashboard.fitness.ctl?.toFixed(1)}</dd></div><div><dt>Évolution 7 j</dt><dd>{dashboard.fitness.freshnessChange7Days?.toFixed(1) ?? "—"}</dd></div></dl><p>Indicateur de charge estimée, pas une mesure directe de récupération physiologique.</p></>
      ) : (
        <div className="fitness-insufficient"><strong>Données insuffisantes</strong><p>{dashboard.fitness.reason}</p></div>
      )}
      <form className="fitness-settings" onSubmit={onSave}><label>FC maximale <input type="number" min="100" max="240" value={maxHeartRateDraft} onChange={(event) => setMaxHeartRateDraft(event.target.value)} placeholder="ex. 190" /></label><Button type="submit" variant="secondary">Enregistrer</Button></form>
      <small>Charge : Edwards TRIMP par zones de FC. ATL/CTL : moyennes exponentielles 7/42 jours.</small>
    </article>
  );
}

function SummaryTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="dashboard-tile summary-tile"><span className="dashboard-tile__label">{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}

function VolumeTile({ values }: { values: DashboardResponse["totals"]["weeklyVolume"] }) {
  const max = Math.max(1, ...values.map((value) => value.durationSeconds));
  return <article className="dashboard-tile volume-tile"><span className="dashboard-tile__label">Volume hebdomadaire</span><div className="volume-bars">{values.length ? values.map((value) => <i key={value.week} style={{ height: `${Math.max(4, value.durationSeconds / max * 100)}%` }} title={`${value.week} : ${formatDuration(value.durationSeconds)}`} />) : <p>Données insuffisantes</p>}</div></article>;
}

function ImportResults({ results }: { results: ImportResult[] }) {
  return <section className="import-results" aria-live="polite">{results.map((result, index) => <p key={`${result.filename}-${index}`} className={`import-result import-result--${result.status}`}><span>{result.filename}</span><strong>{result.status === "imported" ? "Importé" : result.status === "duplicate" ? "Doublon" : `Erreur${result.message ? ` — ${result.message}` : ""}`}</strong></p>)}</section>;
}

function sportDistribution(sports: Record<string, number>): string {
  const entries = Object.entries(sports);
  return entries.length ? entries.map(([sport, count]) => `${sportLabel({ sport, subSport: null })} ${count}`).join(" · ") : "Aucune activité";
}
