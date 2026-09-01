"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  AlertTriangle, ShieldCheck, ShieldAlert, Compass, 
  FileText, RefreshCw, Navigation, Mic, MicOff, Volume2, 
  Layers, UserCheck, AlertOctagon 
} from "lucide-react";
import { OrcaDecision } from "@/lib/types";
import { COASTAL_HARBOURS, MULTILINGUAL_TRANSLATIONS } from "@/lib/orcaEngine";
import WeatherEffects from "@/components/WeatherEffects";

const MarineMap = dynamic(() => import("@/components/MarineMap"), { ssr: false });


const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "hi-IN", label: "हिंदी" }
];

export default function Home() {
  const [coords, setCoords] = useState(COASTAL_HARBOURS[0]);
  const [gpsActive, setGpsActive] = useState(false);
  const [scenario, setScenario] = useState("normal");
  const [decision, setDecision] = useState<OrcaDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  
  const [language, setLanguage] = useState("en-IN");
  const [queryText, setQueryText] = useState("Can I go fishing tomorrow morning?");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  const [optimalRoute, setOptimalRoute] = useState<{ recommendedPort: string; distanceKm: number; routingNote: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const Win = window as unknown as {
        SpeechRecognition?: new () => EventTarget & {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          start: () => void;
          stop: () => void;
          onresult: (event: { results: { transcript: string }[][] }) => void;
          onend: () => void;
        };
        webkitSpeechRecognition?: new () => EventTarget & {
          continuous: boolean;
          interimResults: boolean;
          lang: string;
          start: () => void;
          stop: () => void;
          onresult: (event: { results: { transcript: string }[][] }) => void;
          onend: () => void;
        };
      };

      const SpeechRecognitionAPI = Win.SpeechRecognition || Win.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (event: { results: { transcript: string }[][] }) => {
          const transcript = event.results[0][0].transcript;
          setQueryText(transcript);
          fetchDecision(coords, scenario, transcript);
        };
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
    fetchDecision(COASTAL_HARBOURS[0], "normal");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRecording = () => {
    const rec = recognitionRef.current as { start: () => void; stop: () => void; lang: string } | null;
    if (!rec) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    if (isRecording) {
      rec.stop();
      setIsRecording(false);
    } else {
      rec.lang = language;
      rec.start();
      setIsRecording(true);
    }
  };

  const playVoiceResponse = (decisionObj: OrcaDecision, langCode: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop any currently playing audio
      
      // Tell the browser to speak the AI-generated conversational text
      const speech = new SpeechSynthesisUtterance(decisionObj.primaryReason);
      
      // Set the language and a natural speaking rate
      speech.lang = langCode;
      speech.rate = 0.95; 
      
      window.speechSynthesis.speak(speech);
    }
  };

  async function fetchDecision(currentCoords = coords, activeScenario = scenario, customQuery = queryText) {
    setLoading(true);
    setOptimalRoute(null);
    try {
      const res = await fetch("/api/orca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: customQuery, 
          scenario: activeScenario, 
          lat: currentCoords.lat, 
          lng: currentCoords.lng,
          language: language // <-- This sends the selected language (e.g., "ta-IN") to the backend
        }),
      });
      const data = await res.json();
      if (data.decision) {
        setDecision(data.decision);
        playVoiceResponse(data.decision, language);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleGetDeviceLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "GPS Fix", state: "Live Location" };
          setCoords(newLoc);
          setGpsActive(true);
          fetchDecision(newLoc, scenario);
        },
        (err) => {
          console.error(err);
          alert("GPS failed");
        },
        { enableHighAccuracy: true }
      );
    }
  }


  const getStatusColors = (status?: string) => {
    if (status?.includes("DO NOT")) return { bg: "#450a0a", border: "#f87171", text: "#fca5a5", badge: "#dc2626", icon: ShieldAlert };
    if (status === "CAUTION") return { bg: "#451a03", border: "#fbbf24", text: "#fde047", badge: "#d97706", icon: AlertTriangle };
    if (status === "FAVOURABLE") return { bg: "#064e3b", border: "#34d399", text: "#a7f3d0", badge: "#059669", icon: ShieldCheck };
    return { bg: "#1e293b", border: "#475569", text: "#cbd5e1", badge: "#64748b", icon: AlertOctagon };
  };

  const statusColor = getStatusColors(decision?.status);
  const StatusIcon = statusColor.icon;
  const translation = decision ? (MULTILINGUAL_TRANSLATIONS[language]?.[decision.status] || MULTILINGUAL_TRANSLATIONS["en-IN"][decision.status]) : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "16px", fontFamily: "sans-serif", position: "relative" }}>
      
        {/* Dynamic Weather Background Animation */}
        <WeatherEffects status={decision?.status} />
      
        {/* We add zIndex: 1 so the dashboard panels sit cleanly above the weather effects */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: "16px", position: "relative", zIndex: 1 }}>
      
        
        {/* Header Bar */}
        <header style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ backgroundColor: "#164e63", padding: "8px", borderRadius: "8px", color: "#22d3ee" }}>
              <Compass size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#22d3ee" }}>ORCA Lite</h1>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>ISRO / INCOIS Safety-First Marine Agent</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={coords.name}
              onChange={(e) => {
                const found = COASTAL_HARBOURS.find(h => h.name === e.target.value);
                if (found) { setCoords(found); setGpsActive(false); fetchDecision(found, scenario); }
              }}
              style={{ backgroundColor: "#020617", color: "#f8fafc", border: "1px solid #334155", padding: "8px 12px", borderRadius: "8px", fontSize: "12px" }}
            >
              {COASTAL_HARBOURS.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
            </select>
            <button
              onClick={handleGetDeviceLocation}
              style={{ backgroundColor: gpsActive ? "#064e3b" : "#1e293b", color: gpsActive ? "#34d399" : "#cbd5e1", border: "1px solid #334155", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Navigation size={14} /> {gpsActive ? "GPS Active" : "Fix GPS"}
            </button>
            <button
  onClick={() => {
    // Shifts coordinates 45km offshore into the sea depending on the coast
    const isWest = coords.lng < 78.0;
    const testLocation = {
      lat: Number((coords.lat + 0.18).toFixed(4)),
      lng: Number((isWest ? coords.lng - 0.35 : coords.lng + 0.35).toFixed(4)),
      name: "Mid-Sea Vessel (45km Offshore)",
      state: "Open Ocean"
    };
    setCoords(testLocation);
    fetchDecision(testLocation, scenario);
  }}
  style={{
    backgroundColor: "#1e3a8a",
    color: "#93c5fd",
    border: "1px solid #3b82f6",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  }}
>
  <Compass size={14} /> Simulate 45km Mid-Sea
</button>
<button
  onClick={async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "Calculate optimal return route to nearest safe harbour", scenario: scenario, lat: coords.lat, lng: coords.lng }),
      });
      const data = await res.json();
      if (data.optimalRoute) {
        setOptimalRoute(data.optimalRoute);
        alert(`Optimal Route Calculated!\nSafest Port: ${data.optimalRoute.recommendedPort}\nDistance: ${data.optimalRoute.distanceKm} km\nNote: ${data.optimalRoute.routingNote}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }}
  style={{
    backgroundColor: "#0369a1",
    color: "#ffffff",
    border: "1px solid #0ea5e9",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  }}
>
  <Navigation size={14} /> Calculate Optimal Route
</button>
          </div>
        </header>

        {/* Scenario Simulator Buttons */}
        <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={14} color="#22d3ee" /> Demo Scenarios:
          </span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "normal", label: "Normal (PFZ)" },
              { id: "cyclone_alert", label: "Cyclone Alert" },
              { id: "high_waves", label: "High Waves" },
              { id: "border_conflict", label: "Border Alert" },
              { id: "missing_data", label: "Data Offline" },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => { setScenario(sc.id); fetchDecision(coords, sc.id); }}
                style={{ backgroundColor: scenario === sc.id ? "#0284c7" : "#020617", color: scenario === sc.id ? "#ffffff" : "#94a3b8", border: "1px solid #334155", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: scenario === sc.id ? "bold" : "normal" }}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid: Map on Left, Dashboard/Walkie-Talkie on Right */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          
          {/* Map Section */}
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "12px", minHeight: "380px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
              <Layers size={14} color="#22d3ee" /> Spatial Marine & Geofence Map
            </h3>
            <div style={{ flex: 1, borderRadius: "8px", overflow: "hidden", border: "1px solid #334155" }}>
              <MarineMap 
  userLocation={coords} 
  pfzCoords={decision?.marine.pfzCoordinates} 
  status={decision?.status || "NORMAL"} 
  optimalRoute={optimalRoute} /* <-- Add this line */
/>
            </div>
          </div>

          {/* Decision & Console Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Language Selector */}
            <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Voice/Text Language:</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); if (decision) playVoiceResponse(decision, l.code); }}
                    style={{ backgroundColor: language === l.code ? "#0284c7" : "#020617", color: language === l.code ? "#ffffff" : "#94a3b8", border: "1px solid #334155", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Card */}
            {decision ? (
              <div style={{ backgroundColor: statusColor.bg, border: `1px solid ${statusColor.border}`, borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <StatusIcon size={20} color={statusColor.text} />
                    <span style={{ backgroundColor: statusColor.badge, color: "#ffffff", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" }}>
                      {translation?.statusText || decision.status}
                    </span>
                  </div>
                  <button onClick={() => playVoiceResponse(decision, language)} style={{ background: "transparent", border: "none", color: statusColor.text, cursor: "pointer" }} title="Repeat Audio">
                    <Volume2 size={18} />
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: statusColor.text, lineHeight: "1.4" }}>
                  {decision.primaryReason}
                </p>

                <div style={{ borderTop: `1px solid ${statusColor.border}`, paddingTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {decision.recommendations.map((rec, i) => (
                    <div key={i} style={{ fontSize: "12px", color: "#cbd5e1", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: statusColor.text, marginTop: "5px" }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>

                {decision.status.includes("DO NOT") && (
                    <div style={{ backgroundColor: "#7f1d1d", border: "1px solid #ef4444", padding: "10px", borderRadius: "8px", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fca5a5", fontWeight: "bold", fontSize: "12px" }}>
                     <AlertTriangle size={14} /> ANTI-APPROACH TRAJECTORY ENGAGED
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#fee2e2" }}>
                      Seaward movement restricted. Real-time telemetry log dispatched to Port Maritime Control & Naval Safety Register.
                    </p>
                    </div>
                  )
                }

                

                {/* Metrics Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "4px" }}>
                  <div style={{ backgroundColor: "#020617", padding: "8px", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>WAVE</span>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f8fafc" }}>{decision.safety.waveHeightMeters} m</span>
                  </div>
                  <div style={{ backgroundColor: "#020617", padding: "8px", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>WIND</span>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f8fafc" }}>{decision.safety.windSpeedKts} kts</span>
                  </div>
                  <div style={{ backgroundColor: "#020617", padding: "8px", borderRadius: "8px", border: "1px solid #334155", textAlign: "center" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8", display: "block" }}>SST FRONT</span>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f8fafc" }}>{decision.marine.sst}°C</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowPassport(!showPassport)}
                  style={{ backgroundColor: "#020617", color: "#22d3ee", border: "1px solid #334155", padding: "8px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}
                >
                  <FileText size={14} /> {showPassport ? "Hide Evidence Passport" : "Open Evidence Passport"}
                </button>
              </div>
            ) : (
              <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                Loading agent reasoning...
              </div>
            )}

            {/* Evidence Passport Drawer */}
            {showPassport && decision && (
              <div style={{ backgroundColor: "#0f172a", border: "1px solid #0e7490", borderRadius: "12px", padding: "14px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontWeight: "bold", color: "#22d3ee", display: "flex", alignItems: "center", gap: "6px" }}>
                  <UserCheck size={14} /> Evidence Passport & Provenance Audit
                </span>
                {decision.evidence.sources.map((src, i) => (
                  <div key={i} style={{ backgroundColor: "#020617", padding: "8px", borderRadius: "6px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: "#f8fafc", fontWeight: "500", display: "block" }}>{src.name}</span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>Valid: {src.validity}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#34d399", backgroundColor: "#064e3b", padding: "2px 6px", borderRadius: "4px" }}>Verified</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Walkie-Talkie Console at Bottom */}
        <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Type your question or use Push-to-Talk..."
            style={{ flex: 1, minWidth: "240px", backgroundColor: "#020617", color: "#f8fafc", border: "1px solid #334155", padding: "12px", borderRadius: "8px", fontSize: "13px", outline: "none" }}
          />
          <button
            onClick={() => fetchDecision(coords, scenario, queryText)}
            disabled={loading}
            style={{ backgroundColor: "#0284c7", color: "#ffffff", border: "none", padding: "12px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
          >
            {loading ? "Evaluating..." : "Ask Agent"}
          </button>
          <button
            onPointerDown={toggleRecording}
            style={{ backgroundColor: isRecording ? "#dc2626" : "#0d9488", color: "#ffffff", border: "none", padding: "12px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", flex: "1", minWidth: "180px", justifyContent: "center" }}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            {isRecording ? "LISTENING..." : "HOLD PUSH-TO-TALK"}
          </button>
        </div>

      </div>
    </div>
  );
}