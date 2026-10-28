import {
  calculateCyclingEfficiency,
  calculateRunningEfficiency,
  calculateTrailEfficiency,
} from "./analysis-calculations";
import type { ActivitySample } from "./activity-types";

export function RunningEfficiencyAnalysis({ samples }: { samples: ActivitySample[] }) {
  const result = calculateRunningEfficiency(samples);
  if (result.status === "unavailable") {
    return <UnavailableAnalysis title="Efficacité cardiaque" reason={result.reason} />;
  }
  const { heartRateBins, speedAt150Kmh, cardiacDriftPercent, cadenceChangePercent } = result.value;
  return (
    <article className="analysis-tile efficiency-tile">
      <AnalysisHeading index="01" title="Efficacité cardiaque" eyebrow="Course à pied" />
      {heartRateBins.length > 1 ? (
        <div className="efficiency-bars" aria-label="Vitesse moyenne par plage de fréquence cardiaque">
          {heartRateBins.map((bin) => (
            <div key={bin.heartRate}>
              <span>{Math.round(bin.heartRate)} bpm</span>
              <i style={{ width: `${Math.min(100, bin.speedKmh * 5)}%` }} />
              <strong>{bin.speedKmh.toFixed(1)} km/h</strong>
            </div>
          ))}
        </div>
      ) : <p className="analysis-muted">Plages de FC trop peu représentées.</p>}
      <MetricGrid values={[
        ["Vitesse à 150 bpm", speedAt150Kmh === null ? null : `${speedAt150Kmh.toFixed(1)} km/h`],
        ["Dérive cardiaque", cardiacDriftPercent === null ? null : `${cardiacDriftPercent.toFixed(1)} %`],
        ["Évolution cadence", cadenceChangePercent === null ? null : `${signed(cadenceChangePercent)} %`],
      ]} />
      <p className="analysis-method">{result.limits}</p>
    </article>
  );
}

export function TrailEfficiencyAnalysis({ samples }: { samples: ActivitySample[] }) {
  const result = calculateTrailEfficiency(samples);
  if (result.status === "unavailable") {
    return <UnavailableAnalysis title="Efficacité en montée" reason={result.reason} />;
  }
  const value = result.value;
  return (
    <article className="analysis-tile efficiency-tile">
      <AnalysisHeading index="01" title="Efficacité en montée" eyebrow="Trail" />
      <MetricGrid values={[
        ["D+ détecté", `${Math.round(value.ascentMeters)} m`],
        ["Temps en montée", `${Math.round(value.climbingSeconds / 60)} min`],
        ["VAM moyenne", `${Math.round(value.averageVam)} m/h`],
        ["FC en montée", value.averageClimbingHeartRate === null ? null : `${Math.round(value.averageClimbingHeartRate)} bpm`],
      ]} />
      {value.heartRateVamBins.length > 0 && (
        <RelationshipBars
          label="VAM moyenne par plage de FC"
          values={value.heartRateVamBins.map((bin) => ({
            label: `${Math.round(bin.heartRate)} bpm`,
            value: bin.vam,
            display: `${Math.round(bin.vam)} m/h`,
          }))}
        />
      )}
      <p className="analysis-method">{result.limits} Aucun classement de performance n’est produit.</p>
    </article>
  );
}

function RelationshipBars({
  label,
  values,
}: {
  label: string;
  values: Array<{ label: string; value: number; display: string }>;
}) {
  const maximum = Math.max(...values.map((value) => value.value));
  return (
    <div className="efficiency-bars" aria-label={label}>
      {values.map((value) => (
        <div key={value.label}>
          <span>{value.label}</span>
          <i style={{ width: `${maximum > 0 ? value.value / maximum * 100 : 0}%` }} />
          <strong>{value.display}</strong>
        </div>
      ))}
    </div>
  );
}

export function CyclingEfficiencyAnalysis({ samples }: { samples: ActivitySample[] }) {
  const result = calculateCyclingEfficiency(samples);
  if (result.status === "unavailable") {
    return <UnavailableAnalysis title="Pédalage et effort" reason={result.reason} />;
  }
  const value = result.value;
  return (
    <article className="analysis-tile efficiency-tile">
      <AnalysisHeading index="01" title="Pédalage et effort" eyebrow="Vélo" />
      <MetricGrid values={[
        ["Puissance moyenne", `${Math.round(value.averagePowerWatts)} W`],
        ["Travail mécanique", `${Math.round(value.workKilojoules)} kJ`],
        ["Cadence moyenne", value.averageCadenceRpm === null ? null : `${Math.round(value.averageCadenceRpm)} rpm`],
        ["Dérive FC/puissance", value.cardiacPowerDriftPercent === null ? null : `${value.cardiacPowerDriftPercent.toFixed(1)} %`],
      ]} />
      {value.heartRatePowerBins.length > 0 && (
        <RelationshipBars
          label="Puissance moyenne par plage de FC"
          values={value.heartRatePowerBins.map((bin) => ({
            label: `${Math.round(bin.heartRate)} bpm`,
            value: bin.power,
            display: `${Math.round(bin.power)} W`,
          }))}
        />
      )}
      <p className="analysis-method">{result.limits} Le CdA reste volontairement non calculé sans paramètres physiques et météo valides.</p>
    </article>
  );
}

function UnavailableAnalysis({ title, reason }: { title: string; reason: string }) {
  return (
    <article className="analysis-tile analysis-tile--empty">
      <AnalysisHeading index="01" title={title} eyebrow="Analyse d’efficacité" />
      <strong>Non calculable</strong>
      <p>{reason}</p>
    </article>
  );
}

function AnalysisHeading({ index, title, eyebrow }: { index: string; title: string; eyebrow: string }) {
  return (
    <div className="analysis-tile__heading">
      <div><span>{index} / {eyebrow}</span><h3>{title}</h3></div>
    </div>
  );
}

function MetricGrid({ values }: { values: Array<[string, string | null]> }) {
  return (
    <dl className="analysis-metrics">
      {values.map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value ?? "Non calculable"}</dd></div>
      ))}
    </dl>
  );
}

function signed(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}
