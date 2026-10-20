import { execFileSync } from "node:child_process";

export function isEmulatorRunning(executableNames: string[]): boolean {
  if (process.platform !== "win32") {
    return false;
  }

  const output = execFileSync("tasklist", ["/FO", "CSV", "/NH"], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 5000,
  });

  const names = new Set(executableNames.map((name) => name.toLowerCase()));

  return output.split(/\r?\n/).some((line) => {
    const imageName = line.match(/^"([^"]+)"/)?.[1];

    return imageName ? names.has(imageName.toLowerCase()) : false;
  });
}
