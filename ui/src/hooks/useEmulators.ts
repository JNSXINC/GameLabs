import { useEffect, useState } from "react";
import { Emulator } from "../types/emulator";
import { emulators as baseEmulators } from "../data/emulators";

const EMULATORS_KEY = "gamelabs_emulators";

export function useEmulators() {
    const [emulators, setEmulators] = useState<Emulator[]>(() => {
        try {
            const saved = localStorage.getItem(EMULATORS_KEY);

            if (!saved) {
                return baseEmulators;
            }

            return JSON.parse(saved);
        } catch {
            return baseEmulators;
        }
    });

    useEffect(() => {
        localStorage.setItem(
            EMULATORS_KEY,
            JSON.stringify(emulators)
        );
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
                    : emulator
            )
        );
    };

    return {
        emulators,
        setEmulators,
        setEmulatorExecutable,
    };
}