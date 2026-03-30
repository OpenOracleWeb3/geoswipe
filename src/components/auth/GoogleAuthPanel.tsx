import { AlertCircle, LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  clearStoredGoogleAuthUser,
  disableGoogleAutoSelect,
  isGoogleAuthConfigured,
  renderGoogleSignInButton,
  type GoogleAuthUser
} from "../../services/googleIdentity";

interface GoogleAuthPanelProps {
  user: GoogleAuthUser | null;
  setUser: Dispatch<SetStateAction<GoogleAuthUser | null>>;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function GoogleAuthPanel({
  user,
  setUser,
  compact = false,
  title = "Connect Google",
  subtitle = "Attach this device profile to a Google identity."
}: GoogleAuthPanelProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buttonRoot = buttonRef.current;

    if (!buttonRoot || user) {
      return;
    }

    if (!isGoogleAuthConfigured()) {
      setError("Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void renderGoogleSignInButton({
      parent: buttonRoot,
      onAuthenticated: (nextUser) => {
        if (cancelled) {
          return;
        }

        setUser(nextUser);
        setIsLoading(false);
        setError(null);
      }
    })
      .then(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setIsLoading(false);
          setError(nextError instanceof Error ? nextError.message : "Google sign-in failed to load.");
        }
      });

    return () => {
      cancelled = true;
      if (buttonRoot) {
        buttonRoot.innerHTML = "";
      }
    };
  }, [setUser, user]);

  const handleSignOut = () => {
    disableGoogleAutoSelect();
    clearStoredGoogleAuthUser();
    setUser(null);
    setError(null);
  };

  const containerStyle = {
    width: "100%",
    maxWidth: compact ? 360 : 400,
    padding: compact ? "14px 16px" : "18px 18px 16px",
    borderRadius: compact ? 18 : 22,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "linear-gradient(145deg, rgba(13,31,60,0.74), rgba(6,16,36,0.88))",
    boxShadow: "0 18px 32px rgba(0,0,0,0.18)",
    backdropFilter: "blur(16px)",
    color: "#fff"
  } as const;

  if (user) {
    return (
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                style={{
                  width: compact ? 44 : 52,
                  height: compact ? 44 : 52,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.14)"
                }}
              />
            ) : (
              <div
                style={{
                  width: compact ? 44 : 52,
                  height: compact ? 44 : 52,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, rgba(46,204,113,0.24), rgba(52,152,219,0.24))",
                  border: "2px solid rgba(255,255,255,0.14)",
                  fontWeight: 800,
                  letterSpacing: 1
                }}
              >
                {getInitials(user.name)}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <ShieldCheck size={16} color="#9fe870" />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "#9fe870" }}>
                  Google linked
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: compact ? 16 : 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.58)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              flex: "0 0 auto",
              minHeight: compact ? 40 : 44,
              padding: compact ? "0 12px" : "0 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <UserCircle2 size={compact ? 18 : 20} color="#9fe870" style={{ flex: "0 0 auto", marginTop: 2 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: compact ? 16 : 18 }}>{title}</div>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.68)", lineHeight: 1.5 }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div ref={buttonRef} />
        {isLoading ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.56)" }}>
            Loading Google sign-in...
          </div>
        ) : null}
        {error ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 14,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.82)"
            }}
          >
            <AlertCircle size={14} style={{ flex: "0 0 auto", marginTop: 1 }} />
            <span style={{ fontSize: 12, lineHeight: 1.45 }}>{error}</span>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, letterSpacing: 0.3, color: "rgba(255,255,255,0.42)" }}>
        Gameplay still works in guest mode. This frontend repo does not yet have a backend session exchange.
      </div>
    </div>
  );
}
