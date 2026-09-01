"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { COASTAL_HARBOURS } from "@/lib/orcaEngine";

interface MarineMapProps {
  userLocation: { lat: number; lng: number; name?: string };
  pfzCoords?: { lat: number; lng: number } | null;
  status: string;
  optimalRoute?: { recommendedPort: string; distanceKm: number; routingNote: string } | null;
}

export default function MarineMap({ userLocation, pfzCoords, status, optimalRoute }: MarineMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([userLocation.lat, userLocation.lng], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap | ISRO / INCOIS OSF',
        maxZoom: 18,
      }).addTo(map);

      layersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 9);
    }

    if (layersRef.current && mapInstanceRef.current) {
      layersRef.current.clearLayers();

      // 1. Status-based Vessel Color & Animation Glow
      const isDanger = status === "DO NOT GO" || status === "DO NOT PROCEED";
      const isCaution = status === "CAUTION";
      const vesselColor = isDanger ? "#ef4444" : isCaution ? "#f59e0b" : "#10b981";

      // User Vessel Marker
      const vesselMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 10,
        fillColor: vesselColor,
        color: "#ffffff",
        weight: 25,
        fillOpacity: 0.9,
      }).bindPopup(`<b>Vessel GPS Location</b><br/>Status: <b>${status}</b>`);
      layersRef.current.addLayer(vesselMarker);

      // 2. Animated Danger / Cyclone Radar Ring if status is restricted
      if (isDanger) {
        const pulseRing = L.circle([userLocation.lat, userLocation.lng], {
          radius: 8000,
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.2,
          dashArray: "6, 6",
        }).bindPopup("<b>Active Hazard / Cyclone Warning Zone</b>");
        layersRef.current.addLayer(pulseRing);
      }

      // 3. Potential Fishing Zone (PFZ) Thermal Front Highlight
      if (pfzCoords && !isDanger) {
        const pfzCircle = L.circle([pfzCoords.lat, pfzCoords.lng], {
          radius: 6000,
          color: "#06b6d4",
          fillColor: "#22d3ee",
          fillOpacity: 0.35,
          dashArray: "4, 4",
        }).bindPopup("<b>INCOIS PFZ Opportunity Zone</b><br/>High chlorophyll & thermal gradient detected.");
        layersRef.current.addLayer(pfzCircle);

        // Safe Navigation Vector Line
        const routeLine = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [pfzCoords.lat, pfzCoords.lng],
          ],
          { color: "#38bdf8", weight: 3, dashArray: "8, 8" }
        ).bindPopup("<b>Recommended Transit Route</b>");
        layersRef.current.addLayer(routeLine);
      }

      // 4. Restricted Maritime Boundary Geofence (Shifted strictly offshore into the sea)
      // 4. Restricted Maritime Boundary Geofence (Dynamic Offshore Shift)
      const isWestCoast = userLocation.lng < 78.0;
      // West coast shifts negative (West into sea), East coast shifts positive (East into sea)
      const boundLng1 = isWestCoast ? userLocation.lng - 0.18 : userLocation.lng + 0.15;
      const boundLng2 = isWestCoast ? userLocation.lng - 0.32 : userLocation.lng + 0.28;

      const boundaryPolygon = L.polygon(
        [
          [userLocation.lat + 0.15, boundLng1],
          [userLocation.lat + 0.25, boundLng2],
          [userLocation.lat - 0.05, boundLng2],
        ],
        { color: "#dc2626", fillColor: "#7f1d1d", fillOpacity: 0.25 }
      ).bindPopup("<b>Restricted Sovereign Maritime Boundary</b>");
      layersRef.current.addLayer(boundaryPolygon);

      // 5. Fuel-Optimized Vector Return Route
    if (optimalRoute && layersRef.current) {
      const destPort = COASTAL_HARBOURS.find((p) => p.name === optimalRoute.recommendedPort);
      if (destPort) {
        const routeLine = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [destPort.lat, destPort.lng],
          ],
          { color: "#3b82f6", dashArray: "8, 8", weight: 3 }
        ).bindPopup(
          `<b>Optimal Evacuation Route:</b><br/>${destPort.name} (${optimalRoute.distanceKm} km)<br/><i>${optimalRoute.routingNote}</i>`
        );
        layersRef.current.addLayer(routeLine);
      }
    }
    }
  }, [userLocation, pfzCoords, status, optimalRoute]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "340px" }} />;
}