import type { ScannedGame } from "./scanner";

export { };

declare global {
  interface Window {
    electronAPI: {

      loadLibrary: () => Promise<Game[]>;

      saveLibrary: (games: Game[]) => Promise<{ success: boolean }>;

      addGameToLibrary: (game: Game) => Promise<Game>;

      updateGameInLibrary: (
        gameId: string,
        patch: Partial<Game>
      ) => Promise<{ success: boolean }>;

      removeGameFromLibrary: (
        gameId: string
      ) => Promise<{ success: boolean }>;

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

      selectBios: (
        platform: string,
        region?: string
      ) => Promise<string | null>;

      openBiosFolder: (
        biosPath?: string
      ) => Promise<void>;

      downloadEmulator: (
        emulatorId: string
      ) => Promise<{
        success: boolean;
        emulatorId: string;
        name?: string;
        installDir?: string;
        executablePath?: string;
      }>;

      searchSteamGridGame: (gameName: string) => Promise<any>;

      onGameClosed: (callback: () => void) => () => void;
    };
  }
}