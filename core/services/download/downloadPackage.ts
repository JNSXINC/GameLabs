import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { app } from "electron";
import { extractFull } from "node-7z";
import sevenZipBin from "7zip-bin";

import { DownloadablePackage } from "./downloadablePackage";
import { downloadFile } from "./downloadFile";
import { installRetroArchCores } from "./installRetroArchCores";
import { resolveStaticUrl } from "./resolvers/staticUrlResolver";
import { resolveGithubLatestReleaseUrl } from "./resolvers/githubReleaseResolver";

import {
  getEmulatorsInstallPath,
  getDownloadsTempPath,
} from "../storage/appPaths";

export type DownloadStatus = "downloading" | "extracting" | "installed";
export function findExecutable(
  folder: string,
  candidates: string[],
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
        (candidate) => entry.name.toLowerCase() === candidate.toLowerCase(),
      )
    ) {
      return fullPath;
    }
  }

  return null;
}

export async function resolveDownloadUrl(
  packageConfig: DownloadablePackage,
): Promise<string> {
  if (packageConfig.resolver.type === "static") {
    return resolveStaticUrl(packageConfig.resolver.url || "");
  }

  if (packageConfig.resolver.type === "manual") {
    throw new Error(
      `Download automático não disponível para ${packageConfig.name}.`,
    );
  }

  if (packageConfig.resolver.type === "github_latest") {
    if (
      !packageConfig.resolver.owner ||
      !packageConfig.resolver.repo ||
      !packageConfig.resolver.assetIncludes
    ) {
      throw new Error("Resolver GitHub incompleto.");
    }

    return resolveGithubLatestReleaseUrl({
      owner: packageConfig.resolver.owner,
      repo: packageConfig.resolver.repo,
      assetIncludes: packageConfig.resolver.assetIncludes,
      assetExcludes: packageConfig.resolver.assetExcludes,
    });
  }

  throw new Error("Tipo de resolver não suportado.");
}

export async function downloadPackage(
  packageConfig: DownloadablePackage,
  onProgress?: (progress: number) => void,
  onStatus?: (status: DownloadStatus) => void,
) {
  const downloadUrl = await resolveDownloadUrl(packageConfig);

  console.log(`[Download] URL: ${downloadUrl}`);

  const installFolder = packageConfig.installFolder.replace(/\\/g, "/");

  if (
    path.posix.isAbsolute(installFolder) ||
    path.win32.isAbsolute(installFolder) ||
    installFolder.split("/").includes("..") ||
    !installFolder.startsWith("Emulators/")
  ) {
    throw new Error("Diretório de instalação inválido.");
  }

  const emulatorFolder = installFolder.slice("Emulators/".length);

  const installDir = path.join(getEmulatorsInstallPath(), emulatorFolder);

  const tempDir = getDownloadsTempPath();

  fs.mkdirSync(tempDir, { recursive: true });

  const archivePath = path.join(
    tempDir,
    `${packageConfig.id}.${packageConfig.archiveType}`,
  );

  console.log(`[Download] [1/3] Baixando ${packageConfig.name}...`);

  onStatus?.("downloading");

  await downloadFile(downloadUrl, archivePath, (progress) => {
    console.log(`[Download] ${packageConfig.name}: ${progress}%`);
    onProgress?.(progress);
  });

  console.log(`[Download] [2/3] Extraindo ${packageConfig.name}...`);

  onStatus?.("extracting");

  fs.mkdirSync(installDir, { recursive: true });

  if (packageConfig.archiveType === "zip") {
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(installDir, true);
  } else if (packageConfig.archiveType === "7z") {
    await new Promise<void>((resolve, reject) => {
      const sevenZipExecutable = app.isPackaged
        ? sevenZipBin.path7za.replace(/app\.asar(?=[\\/])/, "app.asar.unpacked")
        : sevenZipBin.path7za;

      const stream = extractFull(archivePath, installDir, {
        $bin: sevenZipExecutable,
      });

      stream.on("end", () => resolve());
      stream.on("error", (error) => reject(error));
    });
  } else {
    throw new Error(
      `Tipo de arquivo ainda não suportado: ${packageConfig.archiveType}`,
    );
  }

  const executablePath = findExecutable(
    installDir,
    packageConfig.executableCandidates,
  );

  if (!executablePath) {
    throw new Error(
      `Executável não encontrado após extração de ${packageConfig.name}.`,
    );
  }

  if (packageConfig.id === "retroarch") {
    console.log("[RetroArch] Instalando núcleos necessários...");

    onStatus?.("extracting");

    await installRetroArchCores(executablePath);
  }

  console.log(
    `[Download] [3/3] ${packageConfig.name} instalado em ${executablePath}`,
  );

  onStatus?.("installed");

  return {
    success: true,
    id: packageConfig.id,
    name: packageConfig.name,
    installDir,
    executablePath,
  };
}
