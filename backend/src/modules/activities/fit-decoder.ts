import { randomUUID } from "node:crypto";
import { Decoder, Stream } from "@garmin/fitsdk";
import type {
  ActivityDevice,
  ActivityImport,
  ActivityLap,
  ActivitySample,
} from "./activity-store.js";

export class InvalidFitError extends Error {}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function date(value: unknown): Date | null {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;
}

function semicircles(value: unknown): number | null {
  const numeric = finite(value);
  return numeric === null ? null : numeric * (180 / 2 ** 31);
}

function cadence(message: Record<string, unknown>): number | null {
  return finite(
    message.avgRunningCadence ??
      message.avgCadence ??
      message.avgSwimmingCadence ??
      message.avgPaddlesportCadence,
  );
}

function maxCadence(message: Record<string, unknown>): number | null {
  return finite(
    message.maxRunningCadence ??
      message.maxCadence ??
      message.maxSwimmingCadence ??
      message.maxPaddlesportCadence,
  );
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function decodedDevices(messages: Array<Record<string, unknown>>): ActivityDevice[] {
  const devices = messages.map((device) => ({
    manufacturer: text(device.manufacturer),
    productName:
      text(device.productName) ?? text(device.garminProduct) ?? text(device.faveroProduct),
    deviceType:
      text(device.antplusDeviceType) ??
      text(device.bleDeviceType) ??
      text(device.localDeviceType) ??
      (finite(device.deviceType) === null ? null : String(device.deviceType)),
    serialNumber:
      typeof device.serialNumber === "number" || typeof device.serialNumber === "bigint"
        ? String(device.serialNumber)
        : null,
  }));
  return devices.filter(
    (device, index) =>
      Object.values(device).some((value) => value !== null) &&
      devices.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(device)) === index,
  );
}

export function decodeFit(
  buffer: Buffer,
  input: { userId: string; filename: string; sha256: string },
): ActivityImport {
  try {
    const stream = Stream.fromBuffer(buffer);
    const decoder = new Decoder(stream);
    if (!decoder.isFIT() || !decoder.checkIntegrity()) throw new InvalidFitError();

    const { messages, errors } = decoder.read();
    if (errors.length > 0) throw new InvalidFitError();

    const session = messages.sessionMesgs?.[0];
    if (!session) throw new InvalidFitError();

    const sessionData = session as Record<string, unknown>;
    const records = messages.recordMesgs ?? [];
    const startTime = date(session.startTime) ?? date(records[0]?.timestamp);
    const averageSpeed = finite(session.avgSpeed);
    const samples: ActivitySample[] = records.map((record) => ({
      recordedAt: date(record.timestamp),
      distanceMeters: finite(record.distance),
      latitudeDegrees: semicircles(record.positionLat),
      longitudeDegrees: semicircles(record.positionLong),
      altitudeMeters: finite(record.enhancedAltitude ?? record.altitude),
      heartRateBpm: finite(record.heartRate),
      speedMps: finite(record.enhancedSpeed ?? record.speed),
      cadenceRpm: finite(record.cadence),
      powerWatts: finite(record.power),
      temperatureCelsius: finite(record.temperature),
    }));
    const laps: ActivityLap[] = (messages.lapMesgs ?? []).map((lap, index) => ({
      lapIndex: index,
      startTime: date(lap.startTime),
      durationSeconds: finite(lap.totalTimerTime),
      distanceMeters: finite(lap.totalDistance),
      averageSpeedMps: finite(lap.avgSpeed),
      averageHeartRateBpm: finite(lap.avgHeartRate),
      averageCadenceRpm: cadence(lap as Record<string, unknown>),
      averagePowerWatts: finite(lap.avgPower),
      totalAscentMeters: finite(lap.totalAscent),
    }));

    return {
      id: randomUUID(),
      userId: input.userId,
      filename: input.filename,
      sha256: input.sha256,
      sport: typeof session.sport === "string" ? session.sport : null,
      subSport: typeof session.subSport === "string" ? session.subSport : null,
      startTime,
      durationSeconds: finite(session.totalTimerTime),
      elapsedSeconds: finite(session.totalElapsedTime),
      distanceMeters: finite(session.totalDistance),
      averageSpeedMps: averageSpeed,
      maximumSpeedMps: finite(session.maxSpeed),
      averagePaceSecondsPerKm:
        averageSpeed !== null && averageSpeed > 0 ? 1000 / averageSpeed : null,
      minimumAltitudeMeters: finite(session.minAltitude),
      averageAltitudeMeters: finite(session.avgAltitude),
      maximumAltitudeMeters: finite(session.maxAltitude),
      totalAscentMeters: finite(session.totalAscent),
      totalDescentMeters: finite(session.totalDescent),
      averageHeartRateBpm: finite(session.avgHeartRate),
      maximumHeartRateBpm: finite(session.maxHeartRate),
      averageCadenceRpm: cadence(sessionData),
      maximumCadenceRpm: maxCadence(sessionData),
      averagePowerWatts: finite(session.avgPower),
      maximumPowerWatts: finite(session.maxPower),
      devices: decodedDevices(
        (messages.deviceInfoMesgs ?? []) as Array<Record<string, unknown>>,
      ),
      samples,
      laps,
    };
  } catch (error) {
    if (error instanceof InvalidFitError) throw error;
    throw new InvalidFitError("Le fichier FIT ne peut pas être décodé.");
  }
}
