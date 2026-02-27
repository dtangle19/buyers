import "./styles.css";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

import type { LegacyRef } from "react";
import type { OutgoingMessage } from "../shared";

type ShieldZone = {
  id: string;
  name: string;
  status: "Fortified" | "Standby" | "Responding";
  responseTime: string;
};

const SHIELD_ZONES: ShieldZone[] = [
  { id: "na", name: "North America Vault", status: "Fortified", responseTime: "12s" },
  { id: "eu", name: "Europe Continuity Ring", status: "Fortified", responseTime: "16s" },
  { id: "apac", name: "APAC Recovery Mesh", status: "Standby", responseTime: "22s" },
  { id: "latam", name: "LATAM Rapid Fallback", status: "Responding", responseTime: "29s" },
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>();
  const [counter, setCounter] = useState(0);
  const positions = useRef<
    Map<
      string,
      {
        location: [number, number];
        size: number;
      }
    >
  >(new Map());

  const socket = usePartySocket({
    room: "default",
    party: "globe",
    onMessage(evt) {
      const message = JSON.parse(evt.data as string) as OutgoingMessage;
      if (message.type === "add-marker") {
        positions.current.set(message.position.id, {
          location: [message.position.lat, message.position.lng],
          size: message.position.id === socket.id ? 0.11 : 0.06,
        });
        setCounter((c) => c + 1);
      } else {
        positions.current.delete(message.id);
        setCounter((c) => c - 1);
      }
    },
  });

  useEffect(() => {
    let phi = 0;

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 480 * 2,
      height: 480 * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1,
      mapSamples: 22000,
      mapBrightness: 5,
      baseColor: [0.07, 0.11, 0.2],
      markerColor: [0.31, 0.83, 0.96],
      glowColor: [0.16, 0.45, 0.6],
      markers: [],
      opacity: 0.95,
      onRender: (state) => {
        state.markers = [...positions.current.values()];
        state.phi = phi;
        phi += 0.0035;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  const safetyScore = useMemo(() => {
    if (counter === 0) {
      return "98.9";
    }

    return Math.max(90, 99 - counter * 0.2).toFixed(1);
  }, [counter]);

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Cloud Disaster Shield</p>
        <h1>Safe Haven Command Center</h1>
        <p className="subtitle">
          A resilient sanctuary for your workloads with live global continuity visibility.
        </p>
      </header>

      <main className="layout">
        <section className="card globe-card">
          <div className="card-header">
            <h2>Global Shield Presence</h2>
            <span className="pill">{counter} guardians online</span>
          </div>
          <canvas
            ref={canvasRef as LegacyRef<HTMLCanvasElement>}
            style={{ width: 480, height: 480, maxWidth: "100%", aspectRatio: 1 }}
          />
          <p className="footnote">Live nodes indicate active continuity guardians and disaster response watchers.</p>
        </section>

        <section className="card status-card">
          <div className="metric">
            <p>Haven Safety Score</p>
            <h3>{safetyScore}%</h3>
          </div>
          <div className="metric">
            <p>Incident Automation</p>
            <h3>Auto-failover armed</h3>
          </div>

          <h2>Disaster Shield Zones</h2>
          <ul>
            {SHIELD_ZONES.map((zone) => (
              <li key={zone.id}>
                <div>
                  <p className="zone-name">{zone.name}</p>
                  <p className="zone-meta">Recovery SLA: {zone.responseTime}</p>
                </div>
                <span className={`badge ${zone.status.toLowerCase()}`}>{zone.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
