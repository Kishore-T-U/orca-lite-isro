# ORCA: AI-Powered Maritime Safety & Geospatial Intelligence System

> An automated marine safety broadcast and sovereign border defense engine integrating real-time INCOIS/ERDDAP telemetry with a pure deterministic safety engine and localized AI broadcasting.

---

## 🚀 Live Deployment & Demo
* **Live Application URL:** [Insert Your Live Deployment Link Here]
* **Repository:** [GitHub Repository Link]

---

## 🧭 Executive Overview
**ORCA** is an advanced marine safety and geospatial intelligence platform built to protect artisanal and commercial fishermen operating near international maritime boundaries and unpredictable coastal weather systems. By combining a **pure deterministic safety core** with **Gemini 1.5 Flash-powered localized voice/text broadcasting**, ORCA guarantees absolute safety compliance, zero AI hallucinations on critical thresholds, and flawless resilience during extreme weather and cellular network blackouts.

---

## ⚡ Key Core Features & Architecture

### 1. Pure Deterministic First Safety Engine (`orcaEngine.ts`)
* **Zero-Risk Architecture:** Life-and-death maritime decisions are governed strictly by hardcoded mathematical logic. The system never relies on generative AI to decide whether a vessel is in danger or breaching a border.
* **Strict Hazard Priority Hierarchy:** 
  1. *Severe Weather / Cyclones* (Absolute Priority)
  2. *Sovereign Border Breach* (Anti-Approach Enforcement)
  3. *Moderate Advisory / Squalls*
  4. *Favorable Fishing Windows* (Potential Fishing Zones - PFZ)

### 2. Storm-Resilient Offline Telemetry Pipeline (`erddapClient.ts`)
* **Real-time INCOIS / ERDDAP / Open-Meteo Integration:** Streams live wind vectors, wave height swells, sea surface temperature (SST), and chlorophyll-a spatial gradients.
* **4-Second Emergency Timeout:** Designed for cyclone conditions where cellular networks degrade, dropping slow connections before they can freeze the app.
* **In-Memory Fallback Cache:** Automatically preserves and serves the last successfully fetched oceanographic data packet during total cellular or internet blackouts, guaranteeing 100% operational continuity.

### 3. Fuel-Optimized Vector Return Routing
* Calculates the optimal, shortest return vector back to domestic safe harbors (such as Chennai or Kasimedu Harbour) factoring in current wind shear velocity and navigational drift.

### 4. Professional News-Desk Localized AI Broadcasting
* Powered by **Gemini 1.5 Flash**, translating complex telemetry grids into formal, objective, news-anchor broadcasts.
* Fully localized in **Tamil (தமிழ்), Telugu (తెలుగు), Hindi (हिंदी), and English**, completely devoid of casual slang or colloquialisms.
* **Speakable AI Voice Pipeline:** Converts safety advisories into accessible audio summaries for rapid dissemination.

### 5. Interactive Leaflet Spatial Map & Geofence Visualization
* Real-time rendering of vessel coordinates, maritime boundary lines, safe harbor nodes, and PFZ thermal front offsets.
* Custom UI states and smooth color transitions (Emerald for favorable conditions, Amber for warnings, Crimson for severe border/storm alerts).

---

## 🛠️ Technology Stack & Dependencies

* **Framework:** Next.js (App Router, Server Actions, API Routes)
* **Language:** TypeScript
* **Styling & UI:** Tailwind CSS, Lucide Icons
* **Mapping:** Leaflet / React-Leaflet
* **AI Engine:** Google Generative AI (`gemini-1.5-flash`)
* **Data Standards:** INCOIS Ocean State Forecasts (OSF) & ERDDAP RESTful griddap telemetry formats

---

## 📂 Project Directory Structure

```text
orca-lite-isro/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── orca/
│   │   │       └── route.ts       # Core backend fusion & Gemini broadcast endpoint
│   │   ├── layout.tsx             # Root layout with hydration safety
│   │   └── page.tsx               # Main interactive geospatial dashboard UI
│   ├── components/                # Map, telemetry card, and audio broadcast components
│   └── lib/
│       ├── erddapClient.ts        # Live INCOIS/Open-Meteo fetcher & offline memory cache
│       ├── orcaEngine.ts          # Pure deterministic safety & hazard hierarchy engine
│       └── types.ts               # Shared TypeScript interfaces & harbour datasets
├── public/                        # Static assets and map markers
├── tailwind.config.ts             # Custom design tokens
└── README.md
