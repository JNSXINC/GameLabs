import React from "react";
import TopBar from "../components/topbar/topBar";
import { Screen } from "../types/screen";

type Props = {
  screen: Screen;
  setScreen: (value: Screen) => void;
  search: string;
  setSearch: (value: string) => void;
  trialRemainingSeconds?: number | null;
  gamepadArea?: "games" | "topbar";
  children: React.ReactNode;
};

export default function AppLayout({
  screen,
  setScreen,
  search,
  setSearch,
  trialRemainingSeconds,
  gamepadArea = "games",
  children,
}: Props) {
  return (
    <div
      style={{
        height: "100vh",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        isolation: "isolate",
        backgroundColor: "#030814",
        color: "white",
      }}
    >
      {/* Fundo permanente da interface */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundImage:
            'linear-gradient(180deg, rgba(3,8,20,0.25), rgba(3,8,20,0.75)), url("/backgrounds/gamelabs-background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        <TopBar
          screen={screen}
          setScreen={setScreen}
          search={search}
          setSearch={setSearch}
          trialRemainingSeconds={trialRemainingSeconds}
          gamepadArea={gamepadArea}
        />
      </div>

      <main
        data-gamepad-grid-scroll
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
        }}
      >
        {children}
      </main>
    </div>
  );
}
