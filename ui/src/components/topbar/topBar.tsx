import React, { useEffect, useState } from "react";

type Screen = "library" | "favorites" | "browse" | "settings" | "user";

type Props = {
  screen: Screen;
  setScreen: (value: Screen) => void;
  search: string;
  setSearch: (value: string) => void;
  assetUrl?: (value: string) => string;
  trialRemainingSeconds?: number | null;
  gamepadArea?: "games" | "topbar";
  gamepadTopbarFocus?: Screen | "search";
};

export default function TopBar({
  screen,
  setScreen,
  search,
  setSearch,
  trialRemainingSeconds = null,
  gamepadArea = "games",
  gamepadTopbarFocus = "library",
}: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await window.electronAPI.loadUserProfile();

        if (!active) return;

        setInitial(profile.displayName.trim().charAt(0).toUpperCase() || "?");

        const avatar = await window.electronAPI.readUserAvatar();

        if (active) {
          setAvatarUrl(avatar);
        }
      } catch (error) {
        console.error("[GameLabs] Erro ao carregar perfil no TopBar:", error);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [screen]);

  const logoSrc = new URL(
    `${import.meta.env.BASE_URL}logo.png`,
    document.baseURI,
  ).href;

  const menuItemStyle = (
    active: boolean,
    focused: boolean,
  ): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    fontSize: "19px",
    fontWeight: 600,
    cursor: "pointer",
    color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
    borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
    padding: "0 0 4px",
    outline:
      gamepadArea === "topbar" && focused
        ? "2px solid rgba(255,255,255,0.85)"
        : "2px solid transparent",
    outlineOffset: "7px",
    borderRadius: "3px",
    transition: "outline-color 0.15s ease",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        padding: "12px 36px",
        minHeight: "64px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(3, 8, 20, 0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "36px",
          paddingLeft: "150px",
        }}
      >
        <img
          src={logoSrc}
          alt="GameLabs"
          style={{
            position: "absolute",
            top: "0px",
            left: "8px",
            width: "420px",
            height: "120px",
            objectFit: "contain",
            objectPosition: "left center",
            zIndex: 20,
            pointerEvents: "none",
          }}
        />

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            transform: "translateY(12px)",
          }}
        >
          <button
            type="button"
            style={menuItemStyle(
              screen === "library",
              gamepadTopbarFocus === "library",
            )}
            onClick={() => setScreen("library")}
          >
            Library
          </button>

          <button
            type="button"
            style={menuItemStyle(
              screen === "favorites",
              gamepadTopbarFocus === "favorites",
            )}
            onClick={() => setScreen("favorites")}
          >
            Favorites
          </button>

          <button
            type="button"
            style={menuItemStyle(
              screen === "browse",
              gamepadTopbarFocus === "browse",
            )}
            onClick={() => setScreen("browse")}
          >
            Browse
          </button>

          <button
            type="button"
            style={menuItemStyle(
              screen === "settings",
              gamepadTopbarFocus === "settings",
            )}
            onClick={() => setScreen("settings")}
          >
            Settings
          </button>
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <input
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            outline:
              gamepadArea === "topbar" && gamepadTopbarFocus === "search"
                ? "2px solid rgba(255,255,255,0.85)"
                : "2px solid transparent",
            outlineOffset: "3px",
            borderRadius: "999px",
            padding: "10px 16px",
            color: "white",
            width: "240px",
          }}
        />

        {trialRemainingSeconds !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${
                trialRemainingSeconds <= 300 ? "#ef4444" : "#3b82f6"
              }`,
              color: trialRemainingSeconds <= 300 ? "#f87171" : "#93c5fd",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span>⏱ Trial</span>

            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {[
                Math.floor(Math.max(0, trialRemainingSeconds) / 3600),
                Math.floor((Math.max(0, trialRemainingSeconds) % 3600) / 60),
                Math.max(0, trialRemainingSeconds) % 60,
              ]
                .map((value) => String(value).padStart(2, "0"))
                .join(":")}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setScreen("user")}
          title="Perfil do jogador"
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.85)",
            fontSize: "18px",
            fontWeight: 700,
            cursor: "pointer",
            overflow: "hidden",
            padding: 0,
            flexShrink: 0,
            outline:
              gamepadArea === "topbar" && gamepadTopbarFocus === "user"
                ? "2px solid rgba(255,255,255,0.85)"
                : "2px solid transparent",
            outlineOffset: "4px",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar do jogador"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            initial
          )}
        </button>
      </div>
    </div>
  );
}
