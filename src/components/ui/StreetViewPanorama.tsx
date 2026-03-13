import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "../../services/googleMapsLoader";
import type { StreetViewRoundMedia } from "../../types/game";

interface StreetViewPanoramaProps {
  media: StreetViewRoundMedia;
  alt: string;
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

export function StreetViewPanorama({ media, alt }: StreetViewPanoramaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let readyTimer: number | null = null;
    const listeners: google.maps.MapsEventListener[] = [];

    setIsReady(false);
    setLoadFailed(false);

    loadGoogleMapsApi()
      .then((googleMaps) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        const panorama = new googleMaps.maps.StreetViewPanorama(containerRef.current, {
          ...PANORAMA_OPTIONS,
          pano: media.panoId,
          pov: { heading: media.heading, pitch: media.pitch },
          zoom: media.zoom
        });

        panoramaRef.current = panorama;
        panorama.setPano(media.panoId);
        panorama.setPov({ heading: media.heading, pitch: media.pitch });
        panorama.setZoom(media.zoom);
        panorama.setOptions(PANORAMA_OPTIONS);

        listeners.push(
          panorama.addListener("pano_changed", () => {
            if (!cancelled) {
              setIsReady(true);
            }
          })
        );

        if (typeof panorama.getStatus === "function") {
          listeners.push(
            panorama.addListener("status_changed", () => {
              if (cancelled) {
                return;
              }

              const status = panorama.getStatus?.();
              if (status && status !== "OK") {
                setLoadFailed(true);
                return;
              }

              setIsReady(true);
            })
          );
        }

        readyTimer = window.setTimeout(() => {
          if (!cancelled) {
            setIsReady(true);
          }
        }, 900);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (readyTimer !== null) {
        window.clearTimeout(readyTimer);
      }
      listeners.forEach((listener) => listener.remove?.());
      if (window.google?.maps.event?.clearInstanceListeners && panoramaRef.current) {
        window.google.maps.event.clearInstanceListeners(panoramaRef.current);
      }
      panoramaRef.current = null;
    };
  }, [media.heading, media.panoId, media.pitch, media.zoom]);

  return (
    <div className={`gs-panorama-shell ${isReady ? "ready" : ""}`}>
      <img src={media.previewUrl} alt={alt} className="gs-round-image gs-round-image-preview" />
      <div ref={containerRef} className={`gs-street-view-canvas ${isReady && !loadFailed ? "ready" : ""}`} />
      {!isReady ? <div className="gs-panorama-status">Entering Street View...</div> : null}
      {loadFailed ? <div className="gs-panorama-status fallback">Street View preview only</div> : null}
    </div>
  );
}
