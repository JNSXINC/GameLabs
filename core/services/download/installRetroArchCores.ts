import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

import { downloadFile } from "./downloadFile";
import { getDownloadsTempPath } from "../storage/appPaths";

const CORE_BASE_URL =
  "https://buildbot.libretro.com/nightly/windows/x86_64/latest";

const REQUIRED_CORES = [
  "snes9x_libretro.dll",
  "mgba_libretro.dll",
  "fceumm_libretro.dll",
  "genesis_plus_gx_libretro.dll",
  "fbneo_libretro.dll",
] as const;

export async function installRetroArchCores(
  executablePath: string,
): Promise<void> {
  const retroArchDir = path.dirname(executablePath);
  const coresDir = path.join(retroArchDir, "cores");
  const tempDir = path.join(getDownloadsTempPath(), "retroarch-cores");

  fs.mkdirSync(coresDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  for (const coreName of REQUIRED_CORES) {
    const destination = path.join(coresDir, coreName);

    if (fs.existsSync(destination) && fs.statSync(destination).size > 0) {
      console.log(`[RetroArch] Núcleo existente: ${coreName}`);
      continue;
    }

    const archivePath = path.join(tempDir, `${coreName}.zip`);
    const temporaryCorePath = path.join(coresDir, `${coreName}.download`);

    const url = `${CORE_BASE_URL}/${coreName}.zip`;

    console.log(`[RetroArch] Baixando núcleo: ${coreName}`);

    try {
      await downloadFile(url, archivePath);

      const zip = new AdmZip(archivePath);
      const entry = zip
        .getEntries()
        .find(
          (item) =>
            !item.isDirectory &&
            path.posix.basename(item.entryName.replace(/\\/g, "/")) ===
              coreName,
        );

      if (!entry) {
        throw new Error(`Núcleo não encontrado no ZIP: ${coreName}`);
      }

      const content = entry.getData();

      if (content.length < 2 || content[0] !== 0x4d || content[1] !== 0x5a) {
        throw new Error(`DLL inválida: ${coreName}`);
      }

      fs.writeFileSync(temporaryCorePath, content);
      fs.renameSync(temporaryCorePath, destination);

      console.log(`[RetroArch] Núcleo instalado: ${coreName}`);
    } finally {
      fs.rmSync(archivePath, { force: true });
      fs.rmSync(temporaryCorePath, { force: true });
    }
  }
}
