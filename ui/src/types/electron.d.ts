import type { ScannedGame } from "./scanner";

export {};

declare global {
  interface Window {
    electronAPI: {
      loadLibrary: () => Promise<Game[]>;

      saveLibrary: (games: Game[]) => Promise<{ success: boolean }>;

      addGameToLibrary: (game: Game) => Promise<Game>;

      updateGameInLibrary: (
        gameId: string,
        patch: Partial<Game>,
      ) => Promise<{ success: boolean }>;

      removeGameFromLibrary: (gameId: string) => Promise<{ success: boolean }>;

      launchGame: (game: unknown) => Promise<{
        success: boolean;
        error?: string;
      }>;

      selectGameExecutable: () => Promise<{
        canceled: boolean;
        path: string | null;
      }>;

      selectGameFile: () => Promise<{
        canceled: boolean;
        path: string | null;
      }>;

      checkGamePath: (path: string) => Promise<{
        exists: boolean;
      }>;

      openGameFolder: (gamePath: string) => Promise<{
        success: boolean;
        error?: string;
      }>;

      scanGamesFromFolder: () => Promise<any[]>;

      selectBiosFile: () => Promise<{
        canceled: boolean;
        path: string | null;
      }>;

      listBios: () => Promise<
        {
          platform: string;
          name: string;
          path?: string;
          required: boolean;
          status: "configured" | "partial" | "missing" | "not_required";
          regions?: {
            region: "usa" | "japan" | "europe";
            name: string;
            biosHint?: string;
            path?: string;
            status: "configured" | "missing";
          }[];
        }[]
      >;

      selectBios: (platform: string, region?: string) => Promise<string | null>;

      openBiosFolder: (biosPath?: string) => Promise<void>;

      downloadEmulator: (emulatorId: string) => Promise<{
        success: boolean;
        emulatorId: string;
        name?: string;
        installDir?: string;
        executablePath?: string;
      }>;

      onDownloadProgress: (
        callback: (data: { emulatorId: string; progress: number }) => void,
      ) => () => void;

      onDownloadStatus: (
        callback: (data: {
          emulatorId: string;
          status: "downloading" | "extracting" | "installed";
        }) => void,
      ) => () => void;

      searchSteamGridGame: (gameName: string) => Promise<any>;

      loadControllerSettings: () => Promise<{
        autoStartDS4: boolean;
        watchdogDS4: boolean;
        closeWithGameLabs: boolean;
        ds4Path: string;
      }>;

      saveControllerSettings: (settings: {
        autoStartDS4: boolean;
        watchdogDS4: boolean;
        closeWithGameLabs: boolean;
        ds4Path: string;
      }) => Promise<boolean>;

      selectDS4Executable: () => Promise<{
        canceled: boolean;
        path: string | null;
      }>;

      checkDS4Dependencies: () => Promise<{
        dotnetInstalled: boolean;
        vigemBusInstalled: boolean;
      }>;

      ensureDS4Dependencies: () => Promise<{
        dotnetInstalled: boolean;
        vigemBusInstalled: boolean;
      }>;

      setupDS4Windows: () => Promise<{
        success: boolean;
        executablePath: string;
        installDir: string;
        dependencies: {
          dotnetInstalled: boolean;
          vigemBusInstalled: boolean;
        };
      }>;

      onDS4DownloadProgress: (
        callback: (progress: number) => void,
      ) => () => void;

      onGameClosed: (callback: () => void) => () => void;
    };
  }
}
