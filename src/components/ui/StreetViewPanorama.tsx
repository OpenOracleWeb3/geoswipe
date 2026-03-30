import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "../../services/googleMapsLoader";
import type { StreetViewRoundMedia } from "../../types/game";

interface StreetViewPanoramaProps {
  media: StreetViewRoundMedia;
  alt: string;
  interactive: boolean;
}

const PANORAMA_OPTIONS: google.maps.StreetViewPanoramaOptions = {
  addressControl: false,
  clickToGo: true,
  disableDefaultUI: false,
  enableCloseButton: false,
  fullscreenControl: false,
  linksControl: true,
  motionTracking: false,
  motionTrackingControl: false,
  panControl: false,
  showRoadLabels: false,
  zoomControl: true
};

export function StreetViewPanorama({ media, alt, interactive }: StreetViewPanoramaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let giveUpTimer: number | null = null;
    const listeners: google.maps.MapsEventListener[] = [];
    let settled = false;

    setTilesLoaded(false);
    setFailed(false);

    if (!media.panoId && !media.coordinates) {
      setFailed(true);
      return;
    }

    const markLoaded = () => {
      if (cancelled || settled) {
        return;
      }

      settled = true;
      setTilesLoaded(true);
      setFailed(false);

      if (giveUpTimer !== null) {
        window.clearTimeout(giveUpTimer);
        giveUpTimer = null;
      }
    };

    const markFailed = () => {
      if (cancelled || settled) {
        return;
      }

      settled = true;
      setFailed(true);

      if (giveUpTimer !== null) {
        window.clearTimeout(giveUpTimer);
        giveUpTimer = null;
      }
    };

    loadGoogleMapsApi()
      .then((googleMaps) => {
        if (cancelled || !containerRef.current) return;

        const panorama = new googleMaps.maps.StreetViewPanorama(containerRef.current, {
          ...PANORAMA_OPTIONS,
          pov: { heading: media.heading, pitch: media.pitch },
          zoom: media.zoom
        });

        panoramaRef.current = panorama;

        listeners.push(
          panorama.addListener("tilesloaded", () => {
            markLoaded();
          })
        );

        if (typeof panorama.getStatus === "function") {
          listeners.push(
            panorama.addListener("status_changed", () => {
              if (cancelled) return;
              const status = panorama.getStatus?.();
              const normalizedStatus = status ? String(status) : "";

              if (normalizedStatus === "OK") {
                markLoaded();
                return;
              }

              if (normalizedStatus) {
                markFailed();
              }
            })
          );
        }

        if (media.panoId) {
          panorama.setPano(media.panoId);
          panorama.setPov({ heading: media.heading, pitch: media.pitch });
          panorama.setZoom(media.zoom);
        } else if (media.coordinates) {
          const streetViewService = new googleMaps.maps.StreetViewService();
          const locationRequest = {
            location: { lat: media.coordinates[0], lng: media.coordinates[1] },
            radius: 1000,
            preference: googleMaps.maps.StreetViewPreference.BEST,
            sources: [googleMaps.maps.StreetViewSource.OUTDOOR]
          };

          streetViewService.getPanorama(locationRequest)
            .then((response) => {
              if (cancelled || !response?.data?.location?.pano) {
                markFailed();
                return;
              }

              panorama.setPano(response.data.location.pano);
              panorama.setPov({ heading: media.heading, pitch: media.pitch });
              panorama.setZoom(media.zoom);
            })
            .catch(() => {
              if (!cancelled && media.coordinates) {
                panorama.setPosition({ lat: media.coordinates[0], lng: media.coordinates[1] });
              }
            });
        }

        giveUpTimer = window.setTimeout(() => {
          markFailed();
        }, 6000);
      })
      .catch(() => {
        markFailed();
      });

    return () => {
      cancelled = true;
      if (giveUpTimer !== null) window.clearTimeout(giveUpTimer);
      listeners.forEach((l) => l.remove?.());
      if (window.google?.maps.event?.clearInstanceListeners && panoramaRef.current) {
        window.google.maps.event.clearInstanceListeners(panoramaRef.current);
      }
      panoramaRef.current = null;
    };
  }, [media.coordinates, media.panoId, media.heading, media.pitch, media.zoom]);

  useEffect(() => {
    if (!interactive || !panoramaRef.current || !window.google?.maps?.event) {
      return;
    }

    const panorama = panoramaRef.current;
    const frame = window.requestAnimationFrame(() => {
      panorama.setPov({ heading: media.heading, pitch: media.pitch });
      panorama.setZoom(media.zoom);
      window.google?.maps?.event?.trigger?.(panorama, "resize");
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [interactive, media.heading, media.pitch, media.zoom]);

  const showPano = tilesLoaded && !failed;

  return (
    <div className="gs-panorama-shell ready" aria-label={alt}>
      <div
        ref={containerRef}
        className="gs-street-view-canvas"
        style={{
          position: "absolute",
          inset: 0,
          opacity: showPano ? 1 : 0,
          pointerEvents: showPano && interactive ? "auto" : "none",
          touchAction: interactive ? "none" : "auto",
          transition: "opacity 0.3s ease"
        }}
      />

      {!tilesLoaded && !failed ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.38) 100%)",
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            zIndex: 1,
            pointerEvents: "none"
          }}
        >
          Loading Street View...
        </div>
      ) : null}

      {failed ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            background: "linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.58) 100%)",
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textAlign: "center",
            zIndex: 1,
            pointerEvents: "none"
          }}
        >
          Street View did not finish loading for this round.
        </div>
      ) : null}
    </div>
  );
}
