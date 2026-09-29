import { DownloadablePackage } from "../download/downloadablePackage";
import { downloadPackage } from "../download/downloadPackage";
import { ensureDS4Dependencies } from "./ds4Dependencies";
import { killDS4 } from "./ds4";
import { app } from "electron";

import fs from "fs";
import path from "path";

export const ds4Download: DownloadablePackage = {
  id: "ds4windows",
  name: "DS4Windows",
  installFolder: "Controls/DS4Windows",
  archiveType: "zip",
  executableCandidates: ["DS4Windows.exe"],

  resolver: {
    type: "github_latest",
    owner: "ds4windowsapp",
    repo: "DS4Windows",
    assetIncludes: ["x64", "zip"],
  },
};

export async function installDS4Windows(
  onProgress?: (progress: number) => void,
) {
  killDS4();

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const result = await downloadPackage(ds4Download, onProgress);

  return {
    success: result.success,
    executablePath: result.executablePath,
    installDir: result.installDir,
  };
}

function installDS4Templates(installDir: string) {
  const executablePath = path.join(installDir, "win-x64");

  const profilesDir = path.join(executablePath, "Profiles");

  const templatesDir = app.isPackaged
    ? path.join(process.resourcesPath, "templates")
    : path.join(process.cwd(), "core", "services", "controls", "templates");

  const sourceSettings = path.join(templatesDir, "Profiles.xml");

  const sourceGameLabsProfile = path.join(
    templatesDir,
    "Profiles",
    "GameLabs.xml",
  );

  const targetSettings = path.join(executablePath, "Profiles.xml");

  const targetGameLabsProfile = path.join(profilesDir, "GameLabs.xml");

  if (!fs.existsSync(sourceSettings)) {
    throw new Error("Template Profiles.xml do DS4Windows não encontrado.");
  }

  if (!fs.existsSync(sourceGameLabsProfile)) {
    throw new Error("Template GameLabs.xml do DS4Windows não encontrado.");
  }

  fs.mkdirSync(profilesDir, {
    recursive: true,
  });

  fs.copyFileSync(sourceSettings, targetSettings);

  fs.copyFileSync(sourceGameLabsProfile, targetGameLabsProfile);

  console.log("Configuração GameLabs aplicada ao DS4Windows.");
}

export async function setupDS4Windows(onProgress?: (progress: number) => void) {
  const dependencies = await ensureDS4Dependencies();

  if (!dependencies.dotnetInstalled) {
    throw new Error(".NET 8 Desktop Runtime não pôde ser instalado.");
  }

  if (!dependencies.vigemBusInstalled) {
    throw new Error("ViGEmBus não pôde ser instalado.");
  }

  const installation = await installDS4Windows(onProgress);

  if (!installation.success || !installation.executablePath) {
    throw new Error("DS4Windows não pôde ser instalado corretamente.");
  }

  installDS4Templates(installation.installDir);

  return {
    success: true,
    executablePath: installation.executablePath,
    installDir: installation.installDir,
    dependencies,
  };
}
