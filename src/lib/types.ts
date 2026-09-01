export type SafetyStatus = "DO NOT GO" | "DO NOT PROCEED" | "CAUTION" | "FAVOURABLE" | "INSUFFICIENT EVIDENCE";

export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  state: string;
}

export interface MarineDataPoint {
  sst: number; // in Celsius
  chlorophyll: number; // mg/m^3
  pfzAvailable: boolean;
  distanceToPfzKm?: number;
  pfzCoordinates?: { lat: number; lng: number };
}

export interface SafetyDataPoint {
  waveHeightMeters: number;
  windSpeedKts: number;
  currentSpeedMps: number;
  officialWarning?: {
    type: "CYCLONE" | "HIGH_WAVE" | "TSUNAMI" | "SQUALLY_WEATHER" | "NONE";
    headline: string;
    source: string;
    validUntil: string;
  };
}

export interface GeofenceDataPoint {
  inRestrictedZone: boolean;
  nearInternationalBorder: boolean;
  zoneName?: string;
}

export interface EvidencePassport {
  sources: { name: string; timestamp: string; validity: string }[];
  missingDataFlags: string[];
  dataFreshness: "FRESH" | "STALE" | "FALLBACK";
}

export interface OrcaDecision {
  status: SafetyStatus;
  primaryReason: string;
  recommendations: string[];
  marine: MarineDataPoint;
  safety: SafetyDataPoint;
  geo: GeofenceDataPoint;
  evidence: EvidencePassport;
  validPeriod: string;
}
