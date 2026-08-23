export async function searchSteamGridGame(gameName: string) {
    return window.electronAPI.searchSteamGridGame(gameName);
}