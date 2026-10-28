import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ActivityMap } from "./activity-map";
import type { ActivityDetail } from "./activity-types";
import { sportCategory, sportLabel } from "./activity-types";
import { apiRequest } from "./api";
import {
  CyclingEfficiencyAnalysis,
  RunningEfficiencyAnalysis,
  TrailEfficiencyAnalysis,
} from "./efficiency-analyses";
import { formatDate, formatDistance, formatDuration, formatPace } from "./formatters";
import { TimeSeriesChart } from "./time-series-chart";
import { Brand, EditorialLabel } from "./ui";

export function ActivityDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [xMode, setXMode] = useState<"time" | "distance">("time");

  useEffect(() => {
    let active = true;
    apiRequest<{ activity: ActivityDetail }>(`/api/activities/${id}`)
      .then((response) => {
        if (active) setActivity(response.activity);
      })
      .catch(() => {
        if (active) setError("Impossible de charger cette activité.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const returnQuery = searchParams.get("from") ?? "";
  const returnTo = `/activities${returnQuery.startsWith("?") ? returnQuery : ""}`;
  const category = activity ? sportCategory(activity) : "other";
  const hasDistanceAxis = useMemo(
    () => (activity?.samples.filter((sample) => sample.distanceMeters !== null).length ?? 0) > 2,
    [activity],
  );

  if (loading) return <main className="centered-status" role="status">Chargement de l’analyse…</main>;
  if (error || !activity) {
    return <main className="centered-status"><p>{error ?? "Activité introuvable."}</p><Link to={returnTo}>Retour à l’historique</Link></main>;
  }

  const metrics = [
    activity.distanceMeters === null ? null : ["Distance", formatDistance(activity.distanceMeters)],
    activity.durationSeconds === null ? null : ["Durée", formatDuration(activity.durationSeconds)],
    category === "cycling"
      ? activity.averageSpeedMps === null ? null : ["Vitesse", `${(activity.averageSpeedMps * 3.6).toFixed(1)} km/h`]
      : activity.averagePaceSecondsPerKm === null ? null : ["Allure", formatPace(activity.averagePaceSecondsPerKm)],
    activity.averageHeartRateBpm === null ? null : ["FC moyenne", `${Math.round(activity.averageHeartRateBpm)} bpm`],
    activity.totalAscentMeters === null ? null : ["Dénivelé +", `${Math.round(activity.totalAscentMeters)} m`],
    category !== "cycling" || activity.averagePowerWatts === null
      ? null
      : ["Puissance", `${Math.round(activity.averagePowerWatts)} W`],
  ].filter((metric): metric is string[] => metric !== null);
  const deviceNames = activity.devices.flatMap((device) => {
    const name = [device.manufacturer, device.productName].filter(Boolean).join(" ");
    return name ? [name] : [];
  });

  return (
    <div className="app-shell analysis-page">
      <header className="app-header page-container">
        <Brand to="/activities" />
        <Link className="analysis-back" to={returnTo}>← Retour à l’historique</Link>
      </header>
      <main className="analysis-content page-container">
        <section className="analysis-hero">
          <div>
            <EditorialLabel>{sportLabel(activity)} / Analyse</EditorialLabel>
            <h1>{activity.filename.replace(/\.fit$/i, "")}</h1>
          </div>
          <div className="analysis-hero__meta">
            {activity.startTime && <time>{formatDate(activity.startTime)}</time>}
            {deviceNames.length > 0 && <p>Capteurs détectés : {deviceNames.join(" · ")}</p>}
          </div>
        </section>

        <section className="primary-metrics" aria-label="Indicateurs principaux">
          {metrics.map(([label, value]) => (
            <div key={label}><span>{label}</span><strong>{value}</strong></div>
          ))}
        </section>

        <section className="analysis-section">
          <SectionHeading index="01" title="Parcours" subtitle="Trace GPS réelle" />
          <ActivityMap samples={activity.samples} activeIndex={activeIndex} />
        </section>

        <section className="analysis-section">
          <div className="section-heading-row">
            <SectionHeading index="02" title="Chronologie" subtitle="Séries synchronisées" />
            <div className="axis-switch" aria-label="Axe des graphiques">
              <button className={xMode === "time" ? "is-active" : ""} onClick={() => setXMode("time")}>Temps</button>
              <button disabled={!hasDistanceAxis} className={xMode === "distance" ? "is-active" : ""} onClick={() => setXMode("distance")}>Distance</button>
            </div>
          </div>
          <div className="chart-grid">
            <TimeSeriesChart title="Fréquence cardiaque" unit="bpm" color="#d1492e" samples={activity.samples} value={(sample) => sample.heartRateBpm} xMode={xMode} activeIndex={activeIndex} onActiveIndex={setActiveIndex} />
            <TimeSeriesChart title="Altitude" unit="m" color="#76837b" samples={activity.samples} value={(sample) => sample.altitudeMeters} xMode={xMode} activeIndex={activeIndex} onActiveIndex={setActiveIndex} />
            <TimeSeriesChart title={category === "cycling" ? "Vitesse" : "Allure"} unit={category === "cycling" ? "km/h" : "min/km"} color="#111111" samples={activity.samples} value={(sample) => category === "cycling" ? sample.speedMps === null ? null : sample.speedMps * 3.6 : sample.speedMps && sample.speedMps > 0 ? 1000 / sample.speedMps / 60 : null} xMode={xMode} activeIndex={activeIndex} onActiveIndex={setActiveIndex} />
            <TimeSeriesChart title="Cadence" unit="rpm" color="#b06d30" samples={activity.samples} value={(sample) => sample.cadenceRpm} xMode={xMode} activeIndex={activeIndex} onActiveIndex={setActiveIndex} />
            <TimeSeriesChart title="Puissance" unit="W" color="#476a7b" samples={activity.samples} value={(sample) => sample.powerWatts} xMode={xMode} activeIndex={activeIndex} onActiveIndex={setActiveIndex} />
          </div>
        </section>

        <section className="analysis-section">
          <SectionHeading index="03" title="Tours enregistrés" subtitle={`${activity.laps.length} tour(s)`} />
          {activity.laps.length === 0 ? <p className="analysis-muted">Aucun tour enregistré dans le FIT.</p> : (
            <div className="laps-table" role="table">
              {activity.laps.map((lap) => (
                <div role="row" key={lap.lapIndex}>
                  <strong>Tour {lap.lapIndex + 1}</strong>
                  <span>{lap.durationSeconds === null ? "—" : formatDuration(lap.durationSeconds)}</span>
                  <span>{lap.distanceMeters === null ? "—" : formatDistance(lap.distanceMeters)}</span>
                  <span>{lap.averageHeartRateBpm === null ? "—" : `${Math.round(lap.averageHeartRateBpm)} bpm`}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="analysis-section">
          <SectionHeading index="04" title="Efficacité" subtitle="Calculs propres à la discipline" />
          {category === "running" && <RunningEfficiencyAnalysis samples={activity.samples} />}
          {category === "trail" && <TrailEfficiencyAnalysis samples={activity.samples} />}
          {category === "cycling" && <CyclingEfficiencyAnalysis samples={activity.samples} />}
          {category === "other" && <p className="analysis-muted">Aucune analyse d’efficacité spécifique n’est disponible pour ce sport.</p>}
        </section>
      </main>
    </div>
  );
}

function SectionHeading({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  return (
    <div className="section-heading">
      <span>{index}</span>
      <div><p>{subtitle}</p><h2>{title}</h2></div>
    </div>
  );
}
