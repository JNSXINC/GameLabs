import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { emulatorDownloads } from "./emulatorDownloads";
import { downloadFile } from "./downloadFile";
import { extractFull } from "node-7z";
import sevenZipBin from "7zip-bin";

import { resolveStaticUrl } from "./resolvers/staticUrlResolver";
import { resolveGithubLatestReleaseUrl } from "./resolvers/githubReleaseResolver";
import { resolveDolphinLatestUrl } from "./resolvers/dolphinResolver";

function findExecutable(
    folder: string,
    candidates: string[]
): string | null {
    const entries = fs.readdirSync(folder, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const fullPath = path.join(folder, entry.name);

        if (entry.isDirectory()) {
            const found = findExecutable(fullPath, candidates);

            if (found) {
                return found;
            }
        }

        if (
            entry.isFile() &&
            candidates.some(
                (candidate) =>
                    entry.name.toLowerCase() ===
                    candidate.toLowerCase()
            )
        ) {
            return fullPath;
        }
    }

    return null;
}

async function resolveDownloadUrl(emulator: {
    resolver: {
        type: string;
        url?: string;
        owner?: string;
        repo?: string;
        assetIncludes?: string[];
        assetExcludes?: string[];
    };
}): Promise<string> {

    if (emulator.resolver.type === "static") {
        return resolveStaticUrl(emulator.resolver.url || "");
    }

    if (emulator.resolver.type === "manual") {
        throw new Error(
            "Download automático não disponível para este emulador."
        );
    }

    if (emulator.resolver.type === "dolphin_latest") {
        return resolveDolphinLatestUrl();
    }

    if (emulator.resolver.type === "github_latest") {
        if (
            !emulator.resolver.owner ||
            !emulator.resolver.repo ||
            !emulator.resolver.assetIncludes
        ) {
            throw new Error("Resolver GitHub incompleto.");
        }

        return resolveGithubLatestReleaseUrl({
            owner: emulator.resolver.owner,
            repo: emulator.resolver.repo,
            assetIncludes: emulator.resolver.assetIncludes,
            assetExcludes: emulator.resolver.assetExcludes,
        });
    }

    throw new Error("Tipo de resolver não suportado.");
}

export async function downloadEmulator(
    emulatorId: string
) {
    const emulator = emulatorDownloads.find(
        (item) => item.id === emulatorId
    );

    if (!emulator) {
        throw new Error("Emulador não encontrado.");
    }

    const downloadUrl = await resolveDownloadUrl(emulator);

    console.log(`[Download Center] URL: ${downloadUrl}`);

    const installDir = path.join(
        process.cwd(),
        emulator.installFolder
    );

    const tempDir = path.join(
        process.cwd(),
        "data",
        "temp",
        "downloads"
    );

    const archivePath = path.join(
        tempDir,
        `${emulator.id}.${emulator.archiveType}`
    );

    console.log(
        `[Download Center] [1/3] Baixando ${emulator.name}...`
    );

    await downloadFile(downloadUrl, archivePath);

    console.log(
        `[Download Center] [2/3] Extraindo ${emulator.name}...`
    );

    fs.mkdirSync(installDir, {
        recursive: true,
    });

    if (emulator.archiveType === "zip") {
        const zip = new AdmZip(archivePath);
        zip.extractAllTo(installDir, true);
    } else if (emulator.archiveType === "7z") {
        await new Promise<void>((resolve, reject) => {
            const stream = extractFull(
                archivePath,
                installDir,
                {
                    $bin: sevenZipBin.path7za,
                }
            );

            stream.on("end", () => resolve());
            stream.on("error", (error) => reject(error));
        });
    } else {
        throw new Error(
            `Tipo de arquivo ainda não suportado: ${emulator.archiveType}`
        );
    }

    const executablePath = findExecutable(
        installDir,
        emulator.executableCandidates
    );

    if (!executablePath) {
        throw new Error(
            `Executável não encontrado após extração de ${emulator.name}.`
        );
    }

    console.log(
        `[Download Center] [3/3] ${emulator.name} instalado em ${executablePath}`
    );

    return {
        success: true,
        emulatorId: emulator.id,
        name: emulator.name,
        installDir,
        executablePath,
    };
}