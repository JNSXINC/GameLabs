import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { games as baseGames } from "./data/games";

import AppLayout from "./layout/AppLayout";
import BrowseView from "./views/browse/BrowseView";
import FavoritesView from "./views/favorites/FavoritesView";
import LibraryView from "./views/library/LibraryView";
import SettingsView from "./views/settings/SettingsView";
import UserView from "./views/user/UserView";
import ActivationView from "./views/settings/licensing/ActivationView";

import { useFavorites } from "./hooks/useFavorites";
import { useGameValidation } from "./hooks/useGameValidation";
import { useGameLauncher } from "./hooks/useGameLauncher";
import { useGamePersistence } from "./hooks/useGamePersistence";
import { useGameExecutable } from "./hooks/useGameExecutable";
import { useEmulators } from "./hooks/useEmulators";
import { useGameFiles } from "./hooks/useGameFiles";
import { useGameImport } from "./hooks/useGameImport";
import { resolveGameMetadata } from "./services/metadata/metadataResolver";

import { Screen } from "./types/screen";
import { Game } from "./types/game";
import type { ScannedGame } from "./types/scanner";

const SCREEN_KEY = "gamelabs_screen";
const SEARCH_KEY = "gamelabs_search";
const SORT_KEY = "gamelabs_sort_mode";

type SortMode = "az" | "za" | "platform" | "favorites";

const assetUrl = (value: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${import.meta.env.BASE_URL}${value.replace(/^\/+/, "")}`;
};

function sortGames(games: Game[], sortMode: SortMode) {
  const result = [...games];

  switch (sortMode) {
    case "az":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "za":
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;

    case "platform":
      result.sort((a, b) => (a.platform || "").localeCompare(b.platform || ""));
      break;

    case "favorites":
      result.sort((a, b) => {
        if (a.favorite === b.favorite) return a.name.localeCompare(b.name);
        return a.favorite ? -1 : 1;
      });
      break;
  }

  return result;
}

function SortSelector({
  sortMode,
  setSortMode,
}: {
  sortMode: SortMode;
  setSortMode: React.Dispatch<React.SetStateAction<SortMode>>;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
      }}
    >
      <span style={{ color: "#fff", opacity: 0.75, fontSize: 13 }}>
        Ordenar:
      </span>

      <select
        value={sortMode}
        onChange={(e) => setSortMode(e.target.value as SortMode)}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          background: "#111827",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
        <option value="platform">Plataforma</option>
        <option value="favorites">Favoritos primeiro</option>
      </select>
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [previewActivation, setPreviewActivation] = useState(true);
  const [checkingLicense, setCheckingLicense] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSavedLicense() {
      try {
        const result = await window.electronAPI.getLicenseStatus();

        if (active) {
          setPreviewActivation(!result.valid);
        }
      } catch (error) {
        console.error("Erro ao verificar licença salva:", error);
      } finally {
        if (active) {
          setCheckingLicense(false);
        }
      }
    }

    checkSavedLicense();

    return () => {
      active = false;
    };
  }, []);

  const [activationError, setActivationError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const handleActivateLicense = async (licenseText: string) => {
    if (activating) return;

    setActivating(true);
    setActivationError(null);

    try {
      const license = JSON.parse(licenseText);

      const result = await window.electronAPI.activateLicense(license);

      if (result.valid) {
        setPreviewActivation(false);
        return;
      }

      const messages: Record<string, string> = {
        INVALID_FORMAT: "Formato de licença inválido.",
        INVALID_SIGNATURE: "A assinatura da licença é inválida.",
        DEVICE_MISMATCH: "Esta licença pertence a outro computador.",
        EXPIRED: "Esta licença expirou.",
        CLOCK_VERIFICATION_REQUIRED:
          "Esta licença precisa de verificação online.",
        ACTIVATION_FAILED: "Não foi possível ativar a licença.",
      };

      setActivationError(
        messages[result.reason] ?? "Não foi possível validar a licença.",
      );
    } catch {
      setActivationError(
        "Não foi possível processar a licença. Verifique o formato JSON.",
      );
    } finally {
      setActivating(false);
    }
  };

  const { games, setGames, favorites, toggleFavorite } = useFavorites(
    (baseGames as Game[]).map((game) => ({
      ...game,
      path: game.path || "",
    })),
  );

  useEffect(() => {
    async function loadSavedLibrary() {
      try {
        const savedGames = await window.electronAPI.loadLibrary();

        if (Array.isArray(savedGames) && savedGames.length > 0) {
          setGames(savedGames);
        }
      } catch (error) {
        console.error("Erro ao carregar biblioteca:", error);
      }
    }

    loadSavedLibrary();
  }, [setGames]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const { importGameFile } = useGameImport({ setGames });

  const { emulators, setEmulators, setEmulatorExecutable } = useEmulators();

  const { gameStatus } = useGameValidation(games);

  useGamePersistence(games, setGames);

  const {
    handleOpenGameFolder,
    removeGameExecutable,
    handleRemoveGameFromSystem,
    setGameExecutable,
  } = useGameExecutable({ setGames });

  const { setGameFile } = useGameFiles({ setGames });

  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const saved = localStorage.getItem(SCREEN_KEY) as Screen | null;

      if (
        saved === "library" ||
        saved === "favorites" ||
        saved === "browse" ||
        saved === "settings" ||
        saved === "user"
      ) {
        return saved;
      }

      return "library";
    } catch {
      return "library";
    }
  });

  const [selected, setSelected] = useState(0);

  const [search, setSearch] = useState(() => {
    try {
      return localStorage.getItem(SEARCH_KEY) || "";
    } catch {
      return "";
    }
  });

  const [sortMode, setSortMode] = useState<SortMode>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY) as SortMode | null;

      if (
        saved === "az" ||
        saved === "za" ||
        saved === "platform" ||
        saved === "favorites"
      ) {
        return saved;
      }

      return "az";
    } catch {
      return "az";
    }
  });

  const [favoritesMenuId, setFavoritesMenuId] = useState<string | null>(null);
  const [browseMenuId, setBrowseMenuId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const onUpdateGame = async (gameId: string, patch: Partial<Game>) => {
    setGames((prevGames) => {
      const updatedGames = prevGames.map((game) =>
        game.id === gameId ? { ...game, ...patch } : game,
      );

      window.electronAPI.saveLibrary(updatedGames);

      return updatedGames;
    });
  };

  const filteredBrowseGames = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = !term
      ? games
      : games.filter((g) => g.name.toLowerCase().includes(term));

    return sortGames(filtered, sortMode);
  }, [games, search, sortMode]);

  const filteredLibraryGames = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = !term
      ? games
      : games.filter((g) => g.name.toLowerCase().includes(term));

    return sortGames(filtered, sortMode);
  }, [games, search, sortMode]);

  const recentGames = useMemo(() => {
    return [...games]
      .filter((game) => game.lastPlayed)
      .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
      .slice(0, 8);
  }, [games]);

  const totalLibraryGames = filteredLibraryGames.length;

  const realIndex =
    totalLibraryGames > 0
      ? ((selected % totalLibraryGames) + totalLibraryGames) % totalLibraryGames
      : 0;

  const currentLibraryGame =
    filteredLibraryGames.length > 0 ? filteredLibraryGames[realIndex] : null;

  const infiniteLibraryGames =
    totalLibraryGames > 0
      ? [
          ...filteredLibraryGames,
          ...filteredLibraryGames,
          ...filteredLibraryGames,
        ]
      : [];

  const infiniteCenterOffset = totalLibraryGames;

  useEffect(() => {
    try {
      localStorage.setItem(SCREEN_KEY, screen);
    } catch {}
  }, [screen]);

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_KEY, search);
    } catch {}
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sortMode);
    } catch {}
  }, [sortMode]);

  useEffect(() => {
    setSelected(0);
  }, [search, screen, sortMode]);

  useEffect(() => {
    if (!totalLibraryGames) return;

    if (Math.abs(selected) > totalLibraryGames * 50) {
      setSelected(realIndex);
    }
  }, [selected, totalLibraryGames, realIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen !== "library") return;
      if (!totalLibraryGames) return;

      if (e.key === "ArrowRight") setSelected((prev) => prev + 1);
      if (e.key === "ArrowLeft") setSelected((prev) => prev - 1);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen, totalLibraryGames]);

  useEffect(() => {
    if (screen !== "library") return;

    const container = listRef.current;
    if (!container || !totalLibraryGames) return;

    const targetIndex = realIndex + infiniteCenterOffset;
    const selectedItem = container.children[targetIndex] as
      | HTMLElement
      | undefined;

    if (!selectedItem) return;

    selectedItem.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [realIndex, screen, totalLibraryGames, infiniteCenterOffset]);

  useEffect(() => {
    setFavoritesMenuId(null);
    setBrowseMenuId(null);
  }, [screen]);

  const handleAddScannedGame = async (scannedGame: ScannedGame) => {
    const metadata = await resolveGameMetadata(scannedGame.name);

    setGames((prev) => {
      const filePath =
        scannedGame.launchType === "emulator"
          ? scannedGame.gameFilePath
          : scannedGame.executablePath;

      const alreadyExists = prev.some(
        (game) =>
          game.path === filePath ||
          game.executablePath === filePath ||
          game.gameFilePath === filePath,
      );

      if (alreadyExists) {
        alert("Jogo já está na biblioteca.");
        return prev;
      }

      const newGame: Game = {
        id: scannedGame.id,
        name: metadata.name || scannedGame.name,
        cover: metadata.cover,
        bg: metadata.bg,
        description: metadata.description || "Jogo importado pelo scanner.",
        playtime: 0,
        installed: true,
        favorite: false,
        path: scannedGame.launchType === "pc" ? scannedGame.executablePath : "",
        executablePath:
          scannedGame.launchType === "pc" ? scannedGame.executablePath : "",
        gameFilePath:
          scannedGame.launchType === "emulator" ? scannedGame.gameFilePath : "",
        launchType: scannedGame.launchType,
        platform: scannedGame.platform as Game["platform"],
        emulatorId: scannedGame.emulatorId,
        controllerProfileId:
          scannedGame.platform === "windows"
            ? "pc"
            : (scannedGame.platform as Game["controllerProfileId"]),
      };

      const updatedGames = [...prev, newGame];

      window.electronAPI.saveLibrary(updatedGames);

      return updatedGames;
    });
  };

  const clearGames = () => {
    setGames((prev) => {
      const updatedGames = prev.filter(
        (game) => !game.path && !game.gameFilePath,
      );

      window.electronAPI.saveLibrary(updatedGames);

      return updatedGames;
    });
  };

  const { handleLaunchGame } = useGameLauncher({
    gameStatus,
    filteredLibraryGames,
    emulators,
    setScreen,
    setSelected,
    setGames,
  });

  if (checkingLicense) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#050505",
        }}
      />
    );
  }

  if (previewActivation) {
    return (
      <ActivationView
        onActivate={handleActivateLicense}
        error={activationError}
        activating={activating}
      />
    );
  }

  if (showSplash) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background:
            "radial-gradient(circle at center, #111827 0%, #050505 55%, #000 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          animation: "splashFadeIn 0.8s ease-out",
        }}
      >
        <style>
          {`
                    @keyframes splashFadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.98);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }

                    @keyframes splashPulse {
                        0% {
                            opacity: 0.65;
                            transform: scale(1);
                        }
                        50% {
                            opacity: 1;
                            transform: scale(1.03);
                        }
                        100% {
                            opacity: 0.65;
                            transform: scale(1);
                        }
                    }
                `}
        </style>

        <h1
          style={{
            fontSize: 72,
            margin: 0,
            letterSpacing: 8,
            fontWeight: 800,
            animation: "splashPulse 2s ease-in-out infinite",
          }}
        >
          GAMELABS
        </h1>

        <p
          style={{
            opacity: 0.65,
            marginTop: 16,
            letterSpacing: 3,
            fontSize: 13,
            textTransform: "uppercase",
          }}
        >
          Universal Gaming Platform
        </p>
      </div>
    );
  }

  if (screen === "favorites") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <FavoritesView
          favorites={favorites}
          gameStatus={gameStatus}
          toggleFavorite={toggleFavorite}
          handleLaunchGame={handleLaunchGame}
          favoritesMenuId={favoritesMenuId}
          setFavoritesMenuId={setFavoritesMenuId}
          assetUrl={assetUrl}
        />
      </AppLayout>
    );
  }

  if (screen === "browse") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <SortSelector sortMode={sortMode} setSortMode={setSortMode} />

        <BrowseView
          games={filteredBrowseGames}
          gameStatus={gameStatus}
          toggleFavorite={toggleFavorite}
          handleLaunchGame={(game) => handleLaunchGame(game)}
          setGameExecutable={setGameExecutable}
          setGameFile={setGameFile}
          removeGameExecutable={removeGameExecutable}
          handleOpenGameFolder={(game) => handleOpenGameFolder(game)}
          browseMenuId={browseMenuId}
          setBrowseMenuId={(id) => setBrowseMenuId(id)}
          assetUrl={assetUrl}
          onAddScannedGame={handleAddScannedGame}
          onClearGames={clearGames}
          onRemoveGameFromSystem={handleRemoveGameFromSystem}
          onImportGameFile={importGameFile}
          onUpdateGame={onUpdateGame}
        />
      </AppLayout>
    );
  }

  if (screen === "settings") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <SettingsView
          emulators={emulators}
          setEmulators={setEmulators}
          setEmulatorExecutable={setEmulatorExecutable}
        />
      </AppLayout>
    );
  }

  if (screen === "user") {
    return (
      <AppLayout
        screen={screen}
        setScreen={setScreen}
        search={search}
        setSearch={setSearch}
      >
        <UserView favorites={favorites} games={games} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      screen={screen}
      setScreen={setScreen}
      search={search}
      setSearch={setSearch}
    >
      <SortSelector sortMode={sortMode} setSortMode={setSortMode} />

      <LibraryView
        currentLibraryGame={currentLibraryGame}
        recentGames={recentGames}
        infiniteLibraryGames={infiniteLibraryGames}
        realIndex={realIndex}
        infiniteCenterOffset={infiniteCenterOffset}
        totalLibraryGames={totalLibraryGames}
        listRef={listRef}
        setSelected={setSelected}
        assetUrl={assetUrl}
        toggleFavorite={toggleFavorite}
        handleLaunchGame={handleLaunchGame}
      />
    </AppLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
