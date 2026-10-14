import * as fs from "node:fs";
import * as path from "node:path";

import { getEmulatorsInstallPath } from "./appPaths";
import { createHash } from "node:crypto";

function calculateFileHash(filePath: string): string {
  const hash = createHash("sha256");
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(1024 * 1024);

  try {
    let bytesRead: number;

    while ((bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
      hash.update(buffer.subarray(0, bytesRead));
    }

    return hash.digest("hex");
  } finally {
    fs.closeSync(fd);
  }
}

export type EmulatorMigrationResult = {
  success: boolean;
  sourcePath: string;
  destinationPath: string;
  copiedFiles: number;
  skippedFiles: number;
  errors: string[];
  verifiedFiles: string[];
};

export function migrateLegacyEmulators(
  sourcePath: string,
  destinationPath: string = getEmulatorsInstallPath(),
): EmulatorMigrationResult {
  const result: EmulatorMigrationResult = {
    success: false,
    sourcePath,
    destinationPath,
    copiedFiles: 0,
    skippedFiles: 0,
    errors: [],
    verifiedFiles: [],
  };

  const source = path.resolve(sourcePath);
  const destination = path.resolve(destinationPath);

  if (!fs.existsSync(source)) {
    result.errors.push("Diretório de origem não encontrado.");
    return result;
  }

  const sourceInfo = fs.lstatSync(source);

  if (!sourceInfo.isDirectory() || sourceInfo.isSymbolicLink()) {
    result.errors.push("A origem precisa ser uma pasta válida.");
    return result;
  }

  function validateDestinationParents(directory: string): void {
    const parent = path.dirname(directory);

    if (parent !== directory) {
      validateDestinationParents(parent);
    }

    if (!fs.existsSync(directory)) {
      return;
    }

    const info = fs.lstatSync(directory);

    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error(
        `Diretório superior inválido ou link simbólico: ${directory}`,
      );
    }
  }

  const relative = path.relative(source, destination);

  if (
    source.toLowerCase() === destination.toLowerCase() ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  ) {
    result.errors.push(
      "O destino não pode ser igual ou estar dentro da origem.",
    );
    return result;
  }

  function copyDirectory(
    currentSource: string,
    currentDestination: string,
  ): void {
    fs.mkdirSync(currentDestination, { recursive: true });

    const destinationInfo = fs.lstatSync(currentDestination);

    if (!destinationInfo.isDirectory() || destinationInfo.isSymbolicLink()) {
      throw new Error(`Diretório de destino inválido: ${currentDestination}`);
    }

    for (const entry of fs.readdirSync(currentSource, {
      withFileTypes: true,
    })) {
      const sourceFile = path.join(currentSource, entry.name);
      const destinationFile = path.join(currentDestination, entry.name);

      if (entry.isSymbolicLink()) {
        result.skippedFiles++;
        continue;
      }

      if (entry.isDirectory()) {
        copyDirectory(sourceFile, destinationFile);
        continue;
      }

      if (!entry.isFile()) {
        result.skippedFiles++;
        continue;
      }

      if (fs.existsSync(destinationFile)) {
        const sourceInfo = fs.statSync(sourceFile);
        const destinationInfo = fs.lstatSync(destinationFile);

        const isVerified =
          destinationInfo.isFile() &&
          !destinationInfo.isSymbolicLink() &&
          sourceInfo.size === destinationInfo.size &&
          calculateFileHash(sourceFile) === calculateFileHash(destinationFile);

        if (!isVerified) {
          result.errors.push(
            `Arquivo existente precisa de verificação manual: ${destinationFile}`,
          );
        } else {
          result.verifiedFiles.push(destinationFile);
        }

        result.skippedFiles++;
        continue;
      }

      const temporaryFile = `${destinationFile}.gamelabs-migrating`;
      let temporaryCreated = false;

      try {
        if (fs.existsSync(temporaryFile)) {
          throw new Error("Existe uma cópia temporária pendente.");
        }

        const sourceFd = fs.openSync(sourceFile, "r");
        let temporaryFd: number | undefined;

        try {
          temporaryFd = fs.openSync(temporaryFile, "wx");
          temporaryCreated = true;

          const buffer = Buffer.alloc(1024 * 1024);
          let bytesRead: number;

          while (
            (bytesRead = fs.readSync(
              sourceFd,
              buffer,
              0,
              buffer.length,
              null,
            )) > 0
          ) {
            let offset = 0;

            while (offset < bytesRead) {
              offset += fs.writeSync(
                temporaryFd,
                buffer,
                offset,
                bytesRead - offset,
              );
            }
          }
        } finally {
          fs.closeSync(sourceFd);

          if (temporaryFd !== undefined) {
            fs.closeSync(temporaryFd);
          }
        }

        const sourceSize = fs.statSync(sourceFile).size;
        const copiedSize = fs.statSync(temporaryFile).size;

        if (sourceSize !== copiedSize) {
          throw new Error("O tamanho do arquivo copiado não confere.");
        }

        const sourceHash = calculateFileHash(sourceFile);
        const copiedHash = calculateFileHash(temporaryFile);

        if (sourceHash !== copiedHash) {
          throw new Error("Falha na verificação de integridade SHA-256.");
        }

        fs.linkSync(temporaryFile, destinationFile);
        fs.unlinkSync(temporaryFile);

        result.copiedFiles++;
        result.verifiedFiles.push(destinationFile);
      } catch (error) {
        try {
          if (temporaryCreated && fs.existsSync(temporaryFile)) {
            fs.unlinkSync(temporaryFile);
          }
        } catch {
          result.errors.push(
            `Falha ao limpar arquivo temporário: ${temporaryFile}`,
          );
        }

        result.errors.push(
          `${sourceFile}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  try {
    validateDestinationParents(destination);
    copyDirectory(source, destination);
    result.success = result.errors.length === 0;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}
