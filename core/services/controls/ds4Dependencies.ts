import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { downloadFile } from "../download/downloadFile";

export type DS4DependenciesStatus = {
  dotnetInstalled: boolean;
  vigemBusInstalled: boolean;
};

function execCommand(command: string): Promise<string> {
  return new Promise((resolve) => {
    exec(command, { windowsHide: true }, (_error, stdout) => {
      resolve(stdout || "");
    });
  });
}

export async function checkDS4Dependencies(): Promise<DS4DependenciesStatus> {
  const dotnetOutput = await execCommand("dotnet --list-runtimes");

  const vigemOutput = await execCommand(
    "powershell -NoProfile -Command \"Get-PnpDevice | Where-Object { $_.FriendlyName -like '*ViGEmBus*' -or $_.FriendlyName -like '*Nefarius Virtual Gamepad Emulation Bus*' } | Select-Object -ExpandProperty FriendlyName\"",
  );

  return {
    dotnetInstalled: /Microsoft\.WindowsDesktop\.App 8\./.test(dotnetOutput),
    vigemBusInstalled:
      vigemOutput.toLowerCase().includes("vigem") ||
      vigemOutput.toLowerCase().includes("virtual gamepad emulation bus"),
  };
}

export function installDotnetDesktopRuntime(
  installerPath: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const installer = spawn(
      installerPath,
      ["/install", "/quiet", "/norestart"],
      {
        windowsHide: true,
      },
    );

    installer.on("error", (error) => {
      console.error(
        "Erro ao iniciar instalador do .NET Desktop Runtime:",
        error,
      );

      resolve(false);
    });

    installer.on("close", (code) => {
      if (code === 0 || code === 3010) {
        resolve(true);
        return;
      }

      console.error(`Instalador do .NET encerrou com código ${code}`);

      resolve(false);
    });
  });
}

type DotnetReleaseMetadata = {
  releases: Array<{
    windowsdesktop?: {
      files?: Array<{
        name: string;
        rid: string;
        url: string;
      }>;
    };
  }>;
};

export async function resolveDotnetDesktopRuntimeUrl(): Promise<string> {
  const metadataUrl =
    "https://builds.dotnet.microsoft.com/dotnet/release-metadata/8.0/releases.json";

  const response = await fetch(metadataUrl);

  if (!response.ok) {
    throw new Error(
      `Falha ao consultar versões do .NET 8 (${response.status}).`,
    );
  }

  const metadata = (await response.json()) as DotnetReleaseMetadata;

  const latestRelease = metadata.releases[0];

  const installer = latestRelease?.windowsdesktop?.files?.find(
    (file) => file.rid === "win-x64" && file.name.endsWith(".exe"),
  );

  if (!installer?.url) {
    throw new Error("Instalador do .NET 8 Desktop Runtime x64 não encontrado.");
  }

  return installer.url;
}

export async function downloadDotnetDesktopRuntime(): Promise<string> {
  const downloadUrl = await resolveDotnetDesktopRuntimeUrl();

  const tempDir = path.join(process.cwd(), "temp", "dependencies");

  fs.mkdirSync(tempDir, {
    recursive: true,
  });

  const installerPath = path.join(
    tempDir,
    "windowsdesktop-runtime-8-win-x64.exe",
  );

  if (fs.existsSync(installerPath)) {
    fs.unlinkSync(installerPath);
  }

  await downloadFile(downloadUrl, installerPath);

  if (!fs.existsSync(installerPath)) {
    throw new Error("Download do .NET Desktop Runtime não foi concluído.");
  }

  return installerPath;
}

export async function ensureDotnetDesktopRuntime(): Promise<boolean> {
  const currentStatus = await checkDS4Dependencies();

  if (currentStatus.dotnetInstalled) {
    console.log(".NET 8 Desktop Runtime já está instalado.");
    return true;
  }

  let installerPath: string | null = null;

  try {
    console.log("Baixando .NET 8 Desktop Runtime...");

    installerPath = await downloadDotnetDesktopRuntime();

    console.log("Instalando .NET 8 Desktop Runtime...");

    const installed = await installDotnetDesktopRuntime(installerPath);

    if (!installed) {
      return false;
    }

    const newStatus = await checkDS4Dependencies();

    return newStatus.dotnetInstalled;
  } catch (error) {
    console.error("Erro ao preparar .NET 8 Desktop Runtime:", error);

    return false;
  } finally {
    if (installerPath && fs.existsSync(installerPath)) {
      fs.unlinkSync(installerPath);
    }
  }
}

const VIGEMBUS_DOWNLOAD_URL =
  "https://github.com/nefarius/ViGEmBus/releases/download/v1.22.0/ViGEmBus_1.22.0_x64_x86_arm64.exe";

export async function downloadViGEmBus(): Promise<string> {
  const tempDir = path.join(process.cwd(), "temp", "dependencies");

  fs.mkdirSync(tempDir, {
    recursive: true,
  });

  const installerPath = path.join(tempDir, "ViGEmBus_1.22.0.exe");

  if (fs.existsSync(installerPath)) {
    fs.unlinkSync(installerPath);
  }

  await downloadFile(VIGEMBUS_DOWNLOAD_URL, installerPath);

  if (!fs.existsSync(installerPath)) {
    throw new Error("Download do ViGEmBus não foi concluído.");
  }

  return installerPath;
}

export function installViGEmBus(installerPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const escapedPath = installerPath.replace(/'/g, "''");

    const command = [
      "Start-Process",
      `-FilePath '${escapedPath}'`,
      "-ArgumentList '/exenoui','/qn','/norestart'",
      "-Verb RunAs",
      "-Wait",
      "-PassThru",
    ].join(" ");

    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`,
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          console.error("Erro ao instalar ViGEmBus:", error);

          resolve(false);
          return;
        }

        const output = stdout || "";

        console.log("Instalação do ViGEmBus finalizada.", output);

        resolve(true);
      },
    );
  });
}

export async function ensureViGEmBus(): Promise<boolean> {
  const currentStatus = await checkDS4Dependencies();

  if (currentStatus.vigemBusInstalled) {
    console.log("ViGEmBus já está instalado.");
    return true;
  }

  let installerPath: string | null = null;

  try {
    console.log("Baixando ViGEmBus...");

    installerPath = await downloadViGEmBus();

    console.log("Instalando ViGEmBus...");

    const installed = await installViGEmBus(installerPath);

    if (!installed) {
      return false;
    }

    const newStatus = await checkDS4Dependencies();

    return newStatus.vigemBusInstalled;
  } catch (error) {
    console.error("Erro ao preparar ViGEmBus:", error);

    return false;
  } finally {
    if (installerPath && fs.existsSync(installerPath)) {
      fs.unlinkSync(installerPath);
    }
  }
}
export async function ensureDS4Dependencies(): Promise<DS4DependenciesStatus> {
  let status = await checkDS4Dependencies();

  if (!status.dotnetInstalled) {
    await ensureDotnetDesktopRuntime();
  }

  status = await checkDS4Dependencies();

  if (!status.vigemBusInstalled) {
    await ensureViGEmBus();
  }

  return checkDS4Dependencies();
}
