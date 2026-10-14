import { parentPort } from "node:worker_threads";
import { migrateLegacyEmulators } from "./emulatorMigration";

type MigrationWorkerData = {
  sourcePath: string;
  destinationPath: string;
};

parentPort?.once("message", (data: MigrationWorkerData) => {
  const { sourcePath, destinationPath } = data;

  try {
    const result = migrateLegacyEmulators(sourcePath, destinationPath);

    parentPort?.postMessage(result);
  } catch (error) {
    parentPort?.postMessage({
      success: false,
      sourcePath,
      destinationPath,
      copiedFiles: 0,
      skippedFiles: 0,
      verifiedFiles: [],
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
});
