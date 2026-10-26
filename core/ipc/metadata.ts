import { registerSecureHandler } from "./secureIpc";
import { searchSteamGridGame } from "../services/metadata/steamGridDB";

export function registerMetadataIpc() {
  registerSecureHandler(
    "metadata:search-steamgriddb",
    async (_, gameName: string) => {
      return searchSteamGridGame(gameName);
    },
  );
}
