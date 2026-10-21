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
import { useGamepadNavigation } from "./hooks/useGamepadNavigation";
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
const TRIAL_STARTED_KEY = "gamelabs_trial_started";

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
  const [accessType, setAccessType] = useState<"lifetime" | "trial" | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function checkSavedLicense() {
      try {
        const result = await window.electronAPI.getLicenseStatus();

        if (!active) return;

        if (result.valid && result.license.type === "lifetime") {
          setAccessType("lifetime");
          setPreviewActivation(false);
          return;
        }

        {
          const trial = await window.electronAPI.getTrialStatus();

          if (!active) return;

          if (
            "status" in trial &&
            trial.status === "ACTIVE" &&
            trial.remainingSeconds > 0
          ) {
            const expiresAt = Date.now() + trial.remainingSeconds * 1000;

            if (Number.isFinite(expiresAt)) {
              trialDeadlineRef.current =
                performance.now() + trial.remainingSeconds * 1000;

              setTrialExpiresAt(expiresAt);
              setAccessType("trial");
              setPreviewActivation(false);
              return;
            }
          }
        }

        setAccessType(null);
        setPreviewActivation(true);
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

  const [startingTrial, setStartingTrial] = useState(false);
  const [trialExpiresAt, setTrialExpiresAt] = useState<number | null>(null);
  const trialDeadlineRef = useRef<number | null>(null);
  const [trialRemainingSeconds, setTrialRemainingSeconds] = useState<
    number | null
  >(null);

  const handleStartTrial = async () => {
    if (startingTrial || activating) return;

    setStartingTrial(true);
    setActivationError(null);

    try {
      const result = await window.electronAPI.startTrial();

      if ("status" in result && result.status === "ACTIVE") {
        const expiresAt = Date.now() + result.remainingSeconds * 1000;

        if (!Number.isFinite(expiresAt) || result.remainingSeconds <= 0) {
          setActivationError("Não foi possível validar o prazo da Trial.");
          return;
        }

        try {
          localStorage.setItem(TRIAL_STARTED_KEY, "true");
        } catch (error) {
          console.warn("Não foi possível registrar a Trial localmente:", error);
        }

        trialDeadlineRef.current =
          performance.now() + result.remainingSeconds * 1000;

        setTrialExpiresAt(expiresAt);
        setAccessType("trial");
        setPreviewActivation(false);
        return;
      }

      if ("status" in result && result.status === "EXPIRED") {
        setActivationError("Seu período gratuito de 1 hora já terminou.");
        return;
      }

      setActivationError(
        "Não foi possível verificar sua Trial. Confira sua conexão.",
      );
    } catch (error) {
      console.error("Erro ao iniciar Trial:", error);
      setActivationError(
        "Não foi possível conectar ao servidor de licenciamento.",
      );
    } finally {
      setStartingTrial(false);
    }
  };

  useEffect(() => {
    if (accessType !== "trial" || trialExpiresAt === null) return;

    const checkExpiration = () => {
      const deadline = trialDeadlineRef.current;

      if (deadline !== null) {
        setTrialRemainingSeconds(
          Math.max(0, Math.ceil((deadline - performance.now()) / 1000)),
        );
      }
      if (
        trialDeadlineRef.current !== null &&
        performance.now() >= trialDeadlineRef.current
      ) {
        setAccessType(null);
        setTrialExpiresAt(null);
        setPreviewActivation(true);
        setActivationError("Seu período gratuito de 1 hora terminou.");
      }
    };

    checkExpiration();

    const interval = setInterval(checkExpiration, 1000);

    return () => clearInterval(interval);
  }, [accessType, trialExpiresAt]);

  useEffect(() => {
    if (accessType !== "trial") return;

    let active = true;
    let checking = false;

    const verifyTrial = async () => {
      if (checking) return;
      checking = true;

      try {
        const result = await window.electronAPI.startTrial();

        if (!active) return;

        if (
          !("status" in result) ||
          result.status !== "ACTIVE" ||
          result.remainingSeconds <= 0
        ) {
          setAccessType(null);
          setTrialExpiresAt(null);
          setPreviewActivation(true);
          setActivationError("Sua Trial expirou ou não pôde ser verificada.");
          return;
        }

        const expiresAt = Date.now() + result.remainingSeconds * 1000;

        if (!Number.isFinite(expiresAt)) {
          setAccessType(null);
          setTrialExpiresAt(null);
          setPreviewActivation(true);
          setActivationError("Resposta inválida do servidor.");
          return;
        }
        trialDeadlineRef.current =
          performance.now() + result.remainingSeconds * 1000;

        setTrialExpiresAt(expiresAt);
      } catch (error) {
        if (!active) return;

        console.error("Erro ao revalidar Trial:", error);
        setAccessType(null);
        setTrialExpiresAt(null);
        setPreviewActivation(true);
        setActivationError("Não foi possível verificar sua Trial online.");
      } finally {
        checking = false;
      }
    };

    const interval = setInterval(verifyTrial, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [accessType]);

  const handleActivateLicense = async (licenseText: string) => {
    if (activating) return;

    setActivating(true);
    setActivationError(null);

    try {
      const license = JSON.parse(licenseText);

      const result = await window.electronAPI.activateLicense(license);

      if (result.valid) {
        setAccessType("lifetime");
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

  const { games, setGames, favorites, toggleFavorite } = useFavorites([]);

  useEffect(() => {
    async function loadSavedLibrary() {
      try {
        const savedGames = await window.electronAPI.loadLibrary();

        if (Array.isArray(savedGames)) {
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

  const [gamepadFocusId, setGamepadFocusId] = useState<string | null>(null);
  const [gamepadArea, setGamepadArea] = useState<"games" | "topbar">("games");

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

    const targetLeft =
      selectedItem.offsetLeft +
      selectedItem.offsetWidth / 2 -
      container.clientWidth / 2;

    container.scrollTo({
      left: targetLeft,
      behavior: "smooth",
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

  const { handleLaunchGame, isLaunching } = useGameLauncher({
    gameStatus,
    filteredLibraryGames,
    emulators,
    setScreen,
    setSelected,
    setGames,
  });

  const gamepadGridGames =
    screen === "favorites"
      ? favorites
      : screen === "browse"
        ? filteredBrowseGames
        : [];

  const gamepadGridIndex = gamepadGridGames.findIndex(
    (game) => game.id === gamepadFocusId,
  );

  const moveGamepadGrid = (direction: "left" | "right" | "up" | "down") => {
    if (gamepadGridGames.length === 0) return;

    const grid = document.querySelector<HTMLElement>(
      `[data-gamepad-grid="${screen}"]`,
    );

    const cards = grid
      ? Array.from(grid.querySelectorAll<HTMLElement>("[data-gamepad-card]"))
      : [];

    const currentIndex = Math.max(0, gamepadGridIndex);
    let nextIndex = currentIndex;

    if (direction === "left") {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (direction === "right") {
      nextIndex = Math.min(gamepadGridGames.length - 1, currentIndex + 1);
    } else {
      const currentCard = cards[currentIndex];

      if (currentCard) {
        const currentRect = currentCard.getBoundingClientRect();
        const currentX = currentRect.left + currentRect.width / 2;
        const currentY = currentRect.top + currentRect.height / 2;

        const candidates = cards
          .map((card, index) => {
            const rect = card.getBoundingClientRect();

            return {
              index,
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
          })
          .filter((candidate) =>
            direction === "down"
              ? candidate.y > currentY + 10
              : candidate.y < currentY - 10,
          )
          .sort((a, b) => {
            const distanceA =
              Math.abs(a.x - currentX) + Math.abs(a.y - currentY) * 0.25;

            const distanceB =
              Math.abs(b.x - currentX) + Math.abs(b.y - currentY) * 0.25;

            return distanceA - distanceB;
          });

        if (candidates.length > 0) {
          nextIndex = candidates[0].index;
        } else if (direction === "up") {
          setGamepadArea("topbar");

          document
            .querySelector<HTMLElement>("[data-gamepad-grid-scroll]")
            ?.scrollTo({ top: 0, behavior: "smooth" });

          return;
        }
      }
    }

    const nextGame = gamepadGridGames[nextIndex];

    if (nextGame) {
      setGamepadFocusId(nextGame.id);

      const card = cards[nextIndex];

      if (card) {
        const scrollContainer = card.closest<HTMLElement>(
          "[data-gamepad-grid-scroll]",
        );

        if (scrollContainer) {
          const cardRect = card.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();

          if (cardRect.bottom > containerRect.bottom) {
            scrollContainer.scrollTop +=
              cardRect.bottom - containerRect.bottom + 12;
          } else if (cardRect.top < containerRect.top) {
            scrollContainer.scrollTop -= containerRect.top - cardRect.top + 12;
          }
        }
      }
    }
  };

  useGamepadNavigation({
    enabled: !isLaunching && !checkingLicense && !previewActivation,

    onLeft: () => {
      if (gamepadArea === "topbar") {
        const tabs: Screen[] = ["library", "favorites", "browse", "settings"];

        const index = tabs.indexOf(screen);

        setScreen(
          tabs[index < 0 ? 0 : (index - 1 + tabs.length) % tabs.length],
        );

        return;
      }

      if (screen === "library") {
        setSelected((prev) => prev - 1);
      } else if (screen === "favorites" || screen === "browse") {
        moveGamepadGrid("left");
      }
    },

    onRight: () => {
      if (gamepadArea === "topbar") {
        const tabs: Screen[] = ["library", "favorites", "browse", "settings"];

        const index = tabs.indexOf(screen);

        setScreen(tabs[index < 0 ? 0 : (index + 1) % tabs.length]);

        return;
      }

      if (screen === "library") {
        setSelected((prev) => prev + 1);
      } else if (screen === "favorites" || screen === "browse") {
        moveGamepadGrid("right");
      }
    },

    onUp: () => {
      if (gamepadArea === "topbar") return;

      if (screen === "favorites" || screen === "browse") {
        moveGamepadGrid("up");
      } else if (screen === "library") {
        setGamepadArea("topbar");
      }
    },

    onDown: () => {
      if (gamepadArea === "topbar") {
        setGamepadArea("games");
        return;
      }

      if (screen === "favorites" || screen === "browse") {
        moveGamepadGrid("down");
      }
    },

    onConfirm: () => {
      if (gamepadArea === "topbar") {
        setGamepadArea("games");
        return;
      }
      const game =
        screen === "library"
          ? filteredLibraryGames[realIndex]
          : screen === "favorites" || screen === "browse"
            ? gamepadGridGames[Math.max(0, gamepadGridIndex)]
            : null;

      if (game) {
        void handleLaunchGame(game);
      }
    },

    onBack: () => {
      if (screen !== "library") {
        setScreen("library");
      }
    },

    onNextTab: () => {
      const tabs: Screen[] = ["library", "favorites", "browse", "settings"];
      const index = tabs.indexOf(screen);
      setScreen(tabs[index < 0 ? 0 : (index + 1) % tabs.length]);
    },

    onPreviousTab: () => {
      const tabs: Screen[] = ["library", "favorites", "browse", "settings"];
      const index = tabs.indexOf(screen);
      setScreen(tabs[index < 0 ? 0 : (index - 1 + tabs.length) % tabs.length]);
    },
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
        onStartTrial={handleStartTrial}
        error={activationError}
        activating={activating}
        startingTrial={startingTrial}
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
        gamepadArea={gamepadArea}
        trialRemainingSeconds={
          accessType === "trial" ? trialRemainingSeconds : null
        }
      >
        <FavoritesView
          favorites={favorites}
          gameStatus={gameStatus}
          toggleFavorite={toggleFavorite}
          handleLaunchGame={handleLaunchGame}
          favoritesMenuId={favoritesMenuId}
          setFavoritesMenuId={setFavoritesMenuId}
          assetUrl={assetUrl}
          gamepadFocusId={gamepadArea === "games" ? gamepadFocusId : null}
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
        gamepadArea={gamepadArea}
        trialRemainingSeconds={
          accessType === "trial" ? trialRemainingSeconds : null
        }
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
          gamepadFocusId={gamepadArea === "games" ? gamepadFocusId : null}
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
        gamepadArea={gamepadArea}
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
        gamepadArea={gamepadArea}
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
      gamepadArea={gamepadArea}
      trialRemainingSeconds={
        accessType === "trial" ? trialRemainingSeconds : null
      }
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

const globalStyle = document.createElement("style");

globalStyle.textContent = `
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
  }

  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  *::-webkit-scrollbar {
    display: none;
  }
`;

document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
