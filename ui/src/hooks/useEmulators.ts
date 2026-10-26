import { useEffect, useState } from "react";
import { Emulator } from "../types/emulator";
import { emulators as baseEmulators } from "../data/emulators";

const EMULATORS_KEY = "gamelabs_emulators";

type DetectedEmulator = {
  id: string;
  executablePath: string;
};

export function useEmulators() {
  const [emulators, setEmulators] = useState<Emulator[]>(() => {
    try {
      const saved = localStorage.getItem(EMULATORS_KEY);

      if (!saved) {
        return baseEmulators;
      }

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed) ? parsed : baseEmulators;
    } catch {
      return baseEmulators;
    }
  });

  useEffect(() => {
    let cancelled = false;

    const detectInstalled = async () => {
      try {
        const detected: DetectedEmulator[] =
          await window.electronAPI.detectInstalledEmulators();

        if (cancelled || !Array.isArray(detected)) return;

        setEmulators((previous) =>
          previous.map((emulator) => {
            // Preserva configurações personalizadas existentes.
            if (emulator.executablePath) {
              return emulator;
            }

            const installed = detected.find(
              (item) => item.id === emulator.id && item.executablePath,
            );

            if (!installed) return emulator;

            return {
              ...emulator,
              executablePath: installed.executablePath,
              installed: true,
            };
          }),
        );
      } catch (error) {
        console.error("[GameLabs] Falha ao detectar emuladores:", error);
      }
    };

    void detectInstalled();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(EMULATORS_KEY, JSON.stringify(emulators));
  }, [emulators]);

  const setEmulatorExecutable = async (id: string) => {
    const result = await window.electronAPI.selectGameExecutable();

    if (result.canceled || !result.path) return;

    setEmulators((prev) =>
      prev.map((emulator) =>
        emulator.id === id
          ? {
              ...emulator,
              executablePath: result.path || "",
              installed: true,
            }
          : emulator,
      ),
    );
  };

  return {
    emulators,
    setEmulators,
    setEmulatorExecutable,
  };
}
