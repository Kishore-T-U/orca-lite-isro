"use client";

import React from "react";

export default function WeatherEffects({ status }: { status?: string }) {
  let effectClass = "weather-calm";
  if (status?.includes("DO NOT")) effectClass = "weather-storm";
  else if (status === "CAUTION") effectClass = "weather-windy";
  else if (status === "FAVOURABLE") effectClass = "weather-favourable";

  return (
    <>
      <style>{`
        .weather-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 500; /* Placed above map tiles without blocking clicks */
          transition: all 1s ease-in-out;
        }

        .weather-favourable {
          background: radial-gradient(circle at 60% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
        }

        .weather-windy {
          background: repeating-linear-gradient(
            125deg,
            rgba(255, 255, 255, 0.05) 0px,
            rgba(255, 255, 255, 0.05) 1.5px,
            transparent 1.5px,
            transparent 18px
          );
          animation: windMove 1.2s linear infinite;
        }
        @keyframes windMove {
          0% { background-position: 0px 0px; }
          100% { background-position: -80px 80px; }
        }

        .weather-storm {
          background: rgba(220, 38, 38, 0.08);
          animation: stormPulse 3.5s infinite;
        }
        @keyframes stormPulse {
          0%, 94%, 100% { background-color: rgba(220, 38, 38, 0.05); }
          95%, 97% { background-color: rgba(255, 255, 255, 0.22); }
        }
      `}</style>
      <div className={`weather-overlay ${effectClass}`} />
    </>
  );
}