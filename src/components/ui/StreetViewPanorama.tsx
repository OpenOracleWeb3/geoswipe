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

  // Load the pano immediately on mount — don't wait for interactive toggle
  useEffect(() => {
    let cancelled = false;
    let giveUpTimer: number | null = null;
    const listeners: google.maps.MapsEventListener[] = [];

    setTilesLoaded(false);
    setFailed(false);

    // No pano ID and no coordinates means preview-only.
    if (!media.panoId && !media.coordinates) {
      setFailed(true);
      return;
    }

    loadGoogleMapsApi()
      .then((googleMaps) => {
        if (cancelled || !containerRef.current) return;

        const panorama = new googleMaps.maps.StreetViewPanorama(containerRef.current, {
          ...PANORAMA_OPTIONS,
          ...(media.panoId ? { pano: media.panoId } : {}),
          ...(media.coordinates ? { position: { lat: media.coordinates[0], lng: media.coordinates[1] } } : {}),
          pov: { heading: media.heading, pitch: media.pitch },
          zoom: media.zoom
        });

        panoramaRef.current = panorama;

        listeners.push(
          panorama.addListener("tilesloaded", () => {
            if (!cancelled) setTilesLoaded(true);
          })
        );

        if (typeof panorama.getStatus === "function") {
          listeners.push(
            panorama.addListener("status_changed", () => {
              if (cancelled) return;
              const status = panorama.getStatus?.();
              if (status && status !== "OK") setFailed(true);
            })
          );
        }

        giveUpTimer = window.setTimeout(() => {
          if (!cancelled && !tilesLoaded) setFailed(true);
        }, 6000);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
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

  // Show the pano canvas when: user toggled interactive AND tiles loaded AND not failed
  const showPano = interactive && tilesLoaded && !failed;

  return (
    <div className="gs-panorama-shell ready">
      {/* Static Street View image — always underneath */}
      <img
        src={media.previewUrl}
        alt={alt}
        className="gs-round-image"
        style={{ opacity: showPano ? 0 : 1, transition: "opacity 0.3s ease" }}
      />

      {/* Interactive pano canvas — always mounted (preloading), visibility controlled */}
      <div
        ref={containerRef}
        className="gs-street-view-canvas"
        style={{
          position: "absolute",
          inset: 0,
          opacity: showPano ? 1 : 0,
          pointerEvents: showPano ? "auto" : "none",
          transition: "opacity 0.3s ease"
        }}
      />
    </div>
  );
}
