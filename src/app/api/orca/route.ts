import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { runOrcaFusionEngine, findOptimalReturnRoute, COASTAL_HARBOURS } from "@/lib/orcaEngine";
import { fetchLiveMarineAndWeather } from "@/lib/erddapClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    // 1. Parse incoming request parameters
    // 1. Parse incoming request parameters
    const { query, scenario, lat, lng, language } = await req.json();

    // Use the scenario directly from the UI demo buttons (No premature auto-overrides)
    const activeScenario = scenario || "normal";

    const targetLocation = {
      lat: typeof lat === "number" ? lat : COASTAL_HARBOURS[0].lat,
      lng: typeof lng === "number" ? lng : COASTAL_HARBOURS[0].lng,
      state: "Coastal Waters",
      name: "Live GPS Fix / Harbour Sector"
    };

    // DEBUG: Print live coordinates to your VS Code terminal so you can see your position
    console.log(`📍 Current Vessel Position -> Lat: ${targetLocation.lat}, Lng: ${targetLocation.lng}`);

    // 2. Fetch live meteorological and satellite spatial data
    const liveData = await fetchLiveMarineAndWeather(targetLocation);

    // 3. Run deterministic safety rule engine using activeScenario
    const decision = runOrcaFusionEngine(targetLocation, activeScenario, query || "General safety check");

    // 4. Calculate Optimal Return Route
    const optimalRoute = findOptimalReturnRoute(
      targetLocation.lat,
      targetLocation.lng,
      liveData.windSpeedKts,
      180
    );

    // 5. GEOGRAPHIC BORDER STATUS
    // Controlled explicitly by the demo scenario buttons to prevent false coordinate triggers
    const isBeyondBorder = (activeScenario === "border_alert" || activeScenario === "border_conflict");

    // 6. Apply live mathematical grid & weather results with strict Hazard Prioritization
    if (activeScenario === "normal") {
      decision.safety.windSpeedKts = liveData.windSpeedKts;
      decision.safety.waveHeightMeters = liveData.waveHeightMeters;
      decision.marine.sst = liveData.sst;
      decision.marine.chlorophyll = liveData.chlorophyll;
      decision.marine.pfzAvailable = liveData.pfzAvailable;
      decision.marine.pfzCoordinates = liveData.pfzCoordinates;
    }

    // PRIORITY 1: Severe Weather / Cyclones (Deadliest hazard takes absolute precedence)
    if (liveData.weatherCode >= 95 || liveData.windSpeedKts >= 25.0 || activeScenario === "cyclone_alert" || activeScenario === "high_waves") {
      decision.status = "DO NOT GO";
      decision.primaryReason = `MATHEMATICAL GRID ALERT: Severe storm front detected (Wind: ${liveData.windSpeedKts} kts, Waves: ${liveData.waveHeightMeters}m). Return to ${optimalRoute.recommendedPort} immediately.`;
      decision.recommendations = [
        "Do not deploy nets or venture offshore.",
        "Secure all vessel equipment and activate emergency tracking.",
        `Proceed directly to ${optimalRoute.recommendedPort} (${optimalRoute.distanceKm} km away) via sheltered coastal paths.`
      ];
    } 
    // PRIORITY 2: Border Breach (Triggers if crossed, even on normal or weather days)
    else if (isBeyondBorder || activeScenario === "border_conflict" || activeScenario === "border_alert") {
      decision.status = "DO NOT PROCEED";
      decision.primaryReason = "CRITICAL BORDER ALERT: Vessel has crossed the International Maritime Boundary Line into restricted sovereign waters. Immediate return to domestic waters is required.";
      decision.recommendations = [
        "Alter course immediately westward toward domestic artisanal waters.",
        "Maintain radio silence and log your return trajectory.",
        `Route safely back toward ${optimalRoute.recommendedPort}.`
      ];
    } 
    // PRIORITY 3: Moderate Weather Advisory
    else if (liveData.windSpeedKts >= 20.0 || liveData.precipitationMm >= 4.0) {
      decision.status = "CAUTION";
      decision.primaryReason = `WEATHER ADVISORY: Moderate wind/rain shear detected across spatial grid (Wind: ${liveData.windSpeedKts} kts). Proceed with caution.`;
      decision.recommendations = [
        "Monitor local VHF channels for updates.",
        "Keep close to sheltered coastal corridors."
      ];
    } 
    // PRIORITY 4: Normal / Favourable Conditions
    else {
      decision.status = "FAVOURABLE";
      decision.primaryReason = `SPATIAL GRID ANALYSIS: Thermal front detected offshore (SST: ${decision.marine.sst}°C, Chl: ${decision.marine.chlorophyll} mg/m³, Upwelling active). Optimal return is to ${optimalRoute.recommendedPort} (${optimalRoute.distanceKm} km away).`;
      decision.recommendations = [
        "Optimal weather window for gillnet fishing near thermal fronts.",
        "Potential fishing zones indicate biological enrichment, not guaranteed catch.",
        "Depart within stated forecast window."
      ];
    }

    // Anti-Approach Seaward Trajectory Trigger:
    const isOffshoreHazard = (decision.status.includes("DO NOT") || activeScenario === "cyclone_alert" || activeScenario === "border_conflict");

    if (isOffshoreHazard) {
      try {
        await supabase.from("emergency_alerts").insert({
          vessel_coordinates: { lat: targetLocation.lat, lng: targetLocation.lng },
          alert_type: activeScenario === "border_conflict" ? "SOVEREIGN_BORDER_TRESPASS" : "CYCLONE_SEAWARD_VIOLATION",
          safety_status: decision.status,
          telemetry: liveData,
          dispatch_recipient: "MRCC_DISTRICT_HQ@maritime.gov.in",
          status: "DISPATCHED",
          timestamp: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn("Emergency alert record notice:", logErr);
      }
    }

    // 7. Generate contextual AI explanation via Gemini (grounded by deterministic bounds)
    if (process.env.GEMINI_API_KEY) {
      console.log("✅ API Key found! Calling Gemini in language:", language);
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
        const systemPrompt = `
          You are ORCA, an automated marine safety broadcast system and official maritime news desk.
          Safety Decision: ${decision.status}.
          Active Scenario: ${activeScenario}.
          Geographic Border Status: ${isBeyondBorder ? "VESSEL HAS CROSSED INTERNATIONAL BOUNDARY LINE" : "Inside domestic waters"}.
          Live Telemetry: Wave ${liveData.waveHeightMeters}m, Wind ${liveData.windSpeedKts} kts.
          Nearest Shelter Port: ${optimalRoute.recommendedPort} (${optimalRoute.distanceKm} km away).
          User Question: "${query || "Check safety and target catch"}".
          Target Language: ${language || "ta-IN"}.

          Strict Communication Rules:
          1. LANGUAGE: Respond entirely in the specified Target Language (${language || "ta-IN"}).
          2. HAZARD PRIORITY: 
             - If weather is severe (Cyclone/High Waves), treat weather as the primary threat and order an immediate return to port.
             - If the vessel has crossed the border line (isBeyondBorder is true), issue an urgent directive stating they are outside domestic waters and must turn back immediately, regardless of whether the weather is normal or rough.
          3. TONE: Professional, formal safety authority, clear and simple. No casual slang.
          4. LENGTH: Strictly under 3 sentences.
        `;

        const aiResponse = await model.generateContent(systemPrompt);
        const generatedText = aiResponse.response.text();
        if (generatedText) {
          decision.primaryReason = generatedText.trim();
        }
      } catch (aiError) {
        console.warn("Gemini AI generation fallback to deterministic text:", aiError);
      }
    }

    // 8. Log to Supabase audit trail
    try {
      await supabase.from("conversations").insert({
        user_query: query || "Mathematical Grid Query",
        agent_response: `[${decision.status}] ${decision.primaryReason}`,
        marine_data_context: { decision, liveData, optimalRoute }
      });
    } catch (dbErr) {
      console.warn("Supabase logging notice:", dbErr);
    }

    return NextResponse.json({ 
      location: targetLocation, 
      decision, 
      liveData,
      optimalRoute 
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}