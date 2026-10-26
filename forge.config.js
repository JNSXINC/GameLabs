const path = require("node:path");
const { execFileSync } = require("node:child_process");

const CERTIFICATE_THUMBPRINT = "A723BDEDEFB6B35C88675EA686D163C49AFFD96F";

function signFile(filePath, successMessage) {
  const escapedPath = filePath.replace(/'/g, "''");

  const script = `
    $ErrorActionPreference = "Stop"

    $file = '${escapedPath}'
    $thumbprint = '${CERTIFICATE_THUMBPRINT}'

    if (-not (Test-Path $file)) {
      throw "Arquivo não encontrado: $file"
    }

    $cert = Get-ChildItem Cert:\\CurrentUser\\My, Cert:\\LocalMachine\\My |
      Where-Object {
        $_.Thumbprint -eq $thumbprint -and $_.HasPrivateKey
      } |
      Select-Object -First 1

    if (-not $cert) {
      throw "Certificado de assinatura não encontrado."
    }

    $signature = Set-AuthenticodeSignature -FilePath $file -Certificate $cert -HashAlgorithm SHA256

    if ($signature.Status -ne "Valid") {
      throw "Falha na assinatura: $($signature.Status) - $($signature.StatusMessage)"
    }

    Write-Host "${successMessage}: $file"
  `;

  execFileSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { stdio: "inherit" },
  );
}

module.exports = {
  packagerConfig: {
    asar: {
      unpack: "**/node_modules/7zip-bin/win/x64/7za.exe",
    },

    ignore: [
      /^[/\\]admin-tools([/\\]|$)/,
      /^[/\\]Emulators([/\\]|$)/,
      /^[/\\]data([/\\]|$)/,
      /^[/\\]library([/\\]|$)/,
      /^[/\\]controlls_config([/\\]|$)/,
      /^[/\\]Controls([/\\]|$)/,
      /^[/\\]docs([/\\]|$)/,
      /^[/\\]scripts([/\\]|$)/,
      /^[/\\]ui([/\\]|$)/,
      /^[/\\]out([/\\]|$)/,
      /^[/\\]\.git([/\\]|$)/,
      /^[/\\]desktop\.ini$/,
    ],

    extraResource: ["core/services/controls/templates"],
  },

  hooks: {
    postPackage: async (_config, packageResult) => {
      if (packageResult.platform !== "win32") {
        return;
      }

      for (const outputPath of packageResult.outputPaths) {
        const exe = path.join(outputPath, "GameLabs.exe");

        signFile(exe, "ASSINATURA DO EXECUTAVEL CONFIRMADA");
      }
    },

    postMake: async (_config, makeResults) => {
      for (const result of makeResults) {
        for (const artifact of result.artifacts ?? []) {
          if (
            result.platform === "win32" &&
            artifact.toLowerCase().endsWith("gamelabssetup.exe")
          ) {
            signFile(artifact, "ASSINATURA DO INSTALADOR CONFIRMADA");
          }
        }
      }
    },
  },

  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "gamelabs",
        setupExe: "GameLabsSetup.exe",
      },
    },
  ],
};
