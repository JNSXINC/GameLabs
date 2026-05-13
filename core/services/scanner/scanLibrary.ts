import * as fs from "fs";
import * as path from "path";
import { detectPlatform } from "./detectplatform";
import { hashGame } from "./hashGame";
import { normalizeGameName } from "./normalizeGameName";

export type ScannedGame = {
    id: string;
    name: string;
    executablePath: string;
    folderPath: string;
    platform: string;
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
            if (!entry.name.toLowerCase().endsWith(".exe")) continue;
            if (shouldIgnoreFile(entry.name)) continue;

            const name = normalizeGameName(entry.name);
            const platform = detectPlatform(fullPath);

            results.push({
                id: hashGame(fullPath),
                name,
                executablePath: fullPath,
                folderPath: path.dirname(fullPath),
                platform,
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