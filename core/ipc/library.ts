import { registerSecureHandler } from "./secureIpc";

import {
  loadLibrary,
  saveLibrary,
  addGameToLibrary,
  updateGameInLibrary,
  removeGameFromLibrary,
} from "../services/library/libraryStore";

export function registerLibraryIpc() {
  registerSecureHandler("library:load", async () => {
    console.log("IPC library:load executado");
    return loadLibrary();
  });

  registerSecureHandler("library:save", async (_event, games) => {
    console.log("IPC library:save executado");
    return saveLibrary(games);
  });

  registerSecureHandler("library:add", async (_event, game) => {
    return addGameToLibrary(game);
  });

  registerSecureHandler("library:update", async (_event, gameId, patch) => {
    return updateGameInLibrary(gameId, patch);
  });

  registerSecureHandler("library:remove", async (_event, gameId) => {
    return removeGameFromLibrary(gameId);
  });
}
