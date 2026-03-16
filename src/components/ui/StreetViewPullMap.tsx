import { useEffect, useRef, useState } from "react";
import { Map, Navigation, X } from "lucide-react";
import { loadGoogleMapsApi } from "../../services/googleMapsLoader";
import { traceRoundStreetViewPull, type StreetViewPullAttempt, type StreetViewPullTrace } from "../../services/geoApi";
import type { GeoRound } from "../../types/game";

interface StreetViewPullMapProps {
  round: GeoRound;
  onClose: () => void;
}

function getAttemptLabel(attempt: StreetViewPullAttempt): string {
  if (attempt.selected) {
    return `${attempt.source === "round_coords" ? "Round" : "Catalog"} hit`;
  }

  return `${attempt.source === "round_coords" ? "Round" : "Catalog"} miss`;
}

export function StreetViewPullMap({ round, onClose }: StreetViewPullMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [trace, setTrace] = useState<StreetViewPullTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setFailed(false);
    setTrace(null);

    traceRoundStreetViewPull(round)
      .then((nextTrace) => {
        if (!cancelled) {
          setTrace(nextTrace);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [round]);

  useEffect(() => {
    if (!trace || !mapRef.current) {
      return;
    }

    let cancelled = false;
    const teardown: Array<google.maps.Marker | google.maps.Polyline> = [];

    loadGoogleMapsApi()
      .then((googleMaps) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        const center = trace.requestedCoordinates ?? trace.catalogCoordinates ?? trace.resolvedCoordinates ?? [0, 0];
        const map = new googleMaps.maps.Map(mapRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: 11,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false
        });

        const bounds = new googleMaps.maps.LatLngBounds();
        const path: Array<{ lat: number; lng: number }> = [];

        const addMarker = (
          coords: [number, number],
          fillColor: string,
          scale: number,
          title: string,
          strokeColor = "rgba(255,255,255,0.9)"
        ) => {
          bounds.extend({ lat: coords[0], lng: coords[1] });
          path.push({ lat: coords[0], lng: coords[1] });

          const marker = new googleMaps.maps.Marker({
            map,
            position: { lat: coords[0], lng: coords[1] },
            title,
            icon: {
              path: googleMaps.maps.SymbolPath.CIRCLE,
              scale,
              fillColor,
              fillOpacity: 0.95,
              strokeColor,
              strokeWeight: 2
            }
          });

          teardown.push(marker);
        };

        if (trace.requestedCoordinates) {
          addMarker(trace.requestedCoordinates, "#60a5fa", 8, "Requested coordinates");
        }

        if (
          trace.catalogCoordinates &&
          (!trace.requestedCoordinates ||
            trace.catalogCoordinates[0] !== trace.requestedCoordinates[0] ||
            trace.catalogCoordinates[1] !== trace.requestedCoordinates[1])
        ) {
          addMarker(trace.catalogCoordinates, "#22d3ee", 7, "Catalog fallback coordinates");
        }

        trace.attempts.forEach((attempt) => {
          addMarker(
            attempt.coordinates,
            attempt.selected ? "#2ecc71" : "#ef4444",
            attempt.selected ? 6 : 4,
            `${getAttemptLabel(attempt)} · ${attempt.metadataStatus}`
          );
        });

        if (trace.attempts.length > 1) {
          const line = new googleMaps.maps.Polyline({
            map,
            path: trace.attempts.map((attempt) => ({ lat: attempt.coordinates[0], lng: attempt.coordinates[1] })),
            strokeColor: "#f8fafc",
            strokeOpacity: 0.45,
            strokeWeight: 2
          });
          teardown.push(line);
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, 48);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      teardown.forEach((item) => item.setMap(null));
    };
  }, [trace]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(3, 9, 15, 0.82)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "24px 12px max(24px, env(safe-area-inset-bottom))"
      }}
    >
      <button
        type="button"
        aria-label="Close street view pull map"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, border: "none", background: "transparent" }}
      />

      <section
        style={{
          position: "relative",
          width: "min(100%, 560px)",
          maxHeight: "86vh",
          overflow: "hidden auto",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(13,31,60,0.98), rgba(6,20,40,0.98))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.42)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 18px 12px",
            color: "#fff"
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
              Street View Pull Trace
            </p>
            <h3 style={{ margin: "6px 0 0", fontFamily: "'Outfit', sans-serif", fontSize: 20 }}>
              {round.correctAnswer} · {round.location.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff"
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "0 18px 18px" }}>
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: 320,
              borderRadius: 22,
              overflow: "hidden",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          />

          {loading ? (
            <div style={{ padding: "16px 4px 0", color: "rgba(255,255,255,0.7)" }}>Tracing Street View lookup…</div>
          ) : null}

          {failed ? (
            <div style={{ padding: "16px 4px 0", color: "#fca5a5" }}>Failed to trace this Street View pull.</div>
          ) : null}

          {trace ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 14
                }}
              >
                {[
                  {
                    label: "Resolution",
                    value:
                      trace.resolution === "pano"
                        ? "Resolved to pano"
                        : trace.resolution === "location_fallback"
                          ? "Static location fallback"
                          : "Missing coordinates or key"
                  },
                  {
                    label: "Resolved Pano",
                    value: trace.resolvedPanoId ? `${trace.resolvedPanoId.slice(0, 16)}…` : "None"
                  }
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.06)"
                    }}
                  >
                    <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 6, color: "#fff", fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  marginTop: 14
                }}
              >
                {trace.attempts.map((attempt, index) => (
                  <div
                    key={`${attempt.source}:${attempt.coordinates[0]}:${attempt.coordinates[1]}:${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: attempt.selected ? "rgba(46,204,113,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${attempt.selected ? "rgba(46,204,113,0.32)" : "rgba(255,255,255,0.06)"}`,
                      color: "#fff"
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: attempt.selected ? "#2ecc71" : "#ef4444",
                        boxShadow: attempt.selected ? "0 0 12px rgba(46,204,113,0.55)" : "none"
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {attempt.coordinates[0]}, {attempt.coordinates[1]}
                      </div>
                      <div style={{ marginTop: 3, fontSize: 12, color: "rgba(255,255,255,0.54)" }}>
                        {attempt.source === "round_coords" ? "Round coordinates" : "Catalog fallback"} · {attempt.metadataStatus}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: attempt.selected ? "rgba(46,204,113,0.16)" : "rgba(255,255,255,0.06)",
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      {attempt.selected ? <Navigation size={14} /> : <Map size={14} />}
                      {attempt.selected ? "Hit" : "Miss"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
