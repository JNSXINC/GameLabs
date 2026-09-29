import { emulatorDownloads } from "./emulatorDownloads";
import { downloadPackage, DownloadStatus } from "./downloadPackage";

export async function downloadEmulator(
  emulatorId: string,
  onProgress?: (progress: number) => void,
  onStatus?: (status: DownloadStatus) => void,
) {
  const emulator = emulatorDownloads.find((item) => item.id === emulatorId);

  if (!emulator) {
    throw new Error("Emulador não encontrado.");
  }

  const result = await downloadPackage(emulator, onProgress, onStatus);

  return {
    ...result,
    emulatorId: emulator.id,
  };
}
