import * as fs from "fs";
import * as path from "path";
import {
    detectPlatform,
    getDefaultEmulatorId,
    VALID_GAME_EXTENSIONS,
    EmulatorId,
} from "../platform/platformRegistry";
import { hashGame } from "./hashGame";
import { normalizeGameName } from "./normalizeGameName";

export type ScannedGame = {
    id: string;
    name: string;
    executablePath: string;
    gameFilePath: string;
    folderPath: string;
    platform: string;
    launchType: "pc" | "emulator";
    emulatorId?: EmulatorId;
};

function shouldIgnoreFile(fileName: string): boolean {
    const lower = fileName.toLowerCase();

    return (
        lower.includes("unins") ||
        lower.includes("uninstall") ||
        lower.includes("setup") ||
        lower.includes("crash") ||
        lower.includes("vc_redist") ||
        lower.includes("dxsetup") ||
        lower.includes("launcher") ||
        lower.includes("chrome") ||
        lower.includes("service") ||
        lower.includes("helper") ||
        lower.includes("updater") ||
        lower.includes("installer")
    );
}

function scanDirectoryRecursive(dirPath: string, results: ScannedGame[]) {
    let entries: fs.Dirent[] = [];

    try {
        entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (error) {
        console.warn("Não foi possível ler a pasta:", dirPath, error);
        return;
    }

    for (const entry of entries) {
        try {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isSymbolicLink()) continue;

            if (entry.isDirectory()) {
                scanDirectoryRecursive(fullPath, results);
                continue;
            }

            if (!entry.isFile()) continue;

            const ext = path.extname(entry.name).toLowerCase();

            if (!VALID_GAME_EXTENSIONS.includes(ext)) continue;

            if (ext === ".exe" && shouldIgnoreFile(entry.name)) continue;

            const name = normalizeGameName(entry.name);
            const platform = detectPlatform(fullPath);
            const launchType = platform === "windows" ? "pc" : "emulator";
            const emulatorId = getDefaultEmulatorId(platform);

            results.push({
                id: hashGame(fullPath),
                name,
                executablePath: launchType === "pc" ? fullPath : "",
                gameFilePath: launchType === "emulator" ? fullPath : "",
                folderPath: path.dirname(fullPath),
                platform,
                launchType,
                emulatorId,
            });
        } catch (error) {
            console.warn("Erro ao processar item do scanner:", entry.name, error);
        }
    }
}

export function scanLibrary(folderPath: string): ScannedGame[] {
    const results: ScannedGame[] = [];

    if (!folderPath) return results;
    if (!fs.existsSync(folderPath)) return results;

    scanDirectoryRecursive(folderPath, results);

    return results;
}