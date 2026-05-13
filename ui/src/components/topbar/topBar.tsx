import React from "react";

type Screen = "library" | "favorites" | "browse" | "settings" | "user";

type Props = {
  screen: Screen;
  setScreen: (value: Screen) => void;
  search: string;
  setSearch: (value: string) => void;
  assetUrl?: (value: string) => string;
};

export default function TopBar({
  screen,
  setScreen,
  search,
  setSearch,
  assetUrl,
}: Props) {
  const logoSrc = assetUrl ? assetUrl("logo.png") : "/logo.png";

  const menuItemStyle = (active: boolean): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
    borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
    padding: "0 0 4px",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
        <img
          src={logoSrc}
          alt="GameLabs"
          style={{
            width: "200px",
            objectFit: "contain",
          }}
        />

        <nav style={{ display: "flex", gap: "20px" }}>
          <button
            type="button"
            style={menuItemStyle(screen === "library")}
            onClick={() => setScreen("library")}
          >
            Library
          </button>

          <button
            type="button"
            style={menuItemStyle(screen === "favorites")}
            onClick={() => setScreen("favorites")}
          >
            Favorites
          </button>

          <button
            type="button"
            style={menuItemStyle(screen === "browse")}
            onClick={() => setScreen("browse")}
          >
            Browse
          </button>

          <button
            type="button"
            style={menuItemStyle(screen === "settings")}
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
            borderRadius: "999px",
            padding: "10px 16px",
            color: "white",
            outline: "none",
            width: "240px",
          }}
        />

        <button
          type="button"
          onClick={() => setScreen("user")}
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
          }}
        >
          J
        </button>
      </div>
    </div>
  );
}