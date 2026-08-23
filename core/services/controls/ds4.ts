import { spawn, exec } from "child_process";

let watchdogInterval: NodeJS.Timeout | null = null;

function minimizeDS4Window() {
    const command = `
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
}
"@

$processes = Get-Process DS4Windows -ErrorAction SilentlyContinue

foreach ($process in $processes) {
    if ($process.MainWindowHandle -ne 0) {
        [Win32]::ShowWindowAsync($process.MainWindowHandle, 6)
    }
}
`;

    exec(
        `powershell -NoProfile -ExecutionPolicy Bypass -Command "${command.replace(
            /\n/g,
            " "
        )}"`,
        () => { }
    );
}

export function launchDS4(ds4Path: string) {
    if (!ds4Path) {
        throw new Error("DS4Windows não configurado.");
    }

    const ds4Process = spawn(ds4Path, [], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
    });

    ds4Process.unref();

    let attempts = 0;

    const minimizeInterval = setInterval(() => {
        attempts += 1;
        minimizeDS4Window();

        if (attempts >= 10) {
            clearInterval(minimizeInterval);
        }
    }, 500);

    return true;
}

export function isDS4Running(): Promise<boolean> {
    return new Promise((resolve) => {
        exec(
            'tasklist /FI "IMAGENAME eq DS4Windows.exe"',
            (error, stdout) => {
                if (error) {
                    resolve(false);
                    return;
                }

                resolve(stdout.includes("DS4Windows.exe"));
            }
        );
    });
}

export function startDS4Watchdog(ds4Path: string) {
    if (watchdogInterval) {
        return;
    }

    watchdogInterval = setInterval(async () => {
        const running = await isDS4Running();

        if (!running) {
            console.log("DS4 fechado. Reiniciando...");
            launchDS4(ds4Path);
        }
    }, 5000);
}

export function stopDS4Watchdog() {
    if (watchdogInterval) {
        clearInterval(watchdogInterval);
        watchdogInterval = null;
    }
}

export function killDS4() {
    exec("taskkill /F /IM DS4Windows.exe");
}