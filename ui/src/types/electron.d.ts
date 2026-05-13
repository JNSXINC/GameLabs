import type { ScannedGame } from "./scanner";

export { };

declare global {
  interface Window {
    electronAPI: {
      launchGame: (
        gamePath: string,
        args?: string[]
      ) => Promise<{
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
      selectBiosFile: () => Promise<{
        canceled: boolean;
        path: string | null;
      }>;
      checkGamePath: (path: string) => Promise<{
        exists: boolean;
      }>;
      openGameFolder: (path: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
      scanGamesFromFolder: () => Promise<ScannedGame[]>;
      onGameClosed: (callback: () => void) => () => void;
    };
  }
}