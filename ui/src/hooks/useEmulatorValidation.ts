import { useEffect, useState } from "react";
import { Emulator } from "../types/emulator";

export type EmulatorStatus = "none" | "valid" | "invalid";

export function useEmulatorValidation(emulators: Emulator[]) {
    const [emulatorStatus, setEmulatorStatus] = useState<
        Record<string, EmulatorStatus>
    >({});

    useEffect(() => {
        let cancelled = false;

        const checkEmulators = async () => {
            const statusMap: Record<string, EmulatorStatus> = {};

            for (const emulator of emulators) {
                if (!emulator.executablePath) {
                    statusMap[emulator.id] = "none";
                    continue;
                }

                const result = await window.electronAPI.checkGamePath(
                    emulator.executablePath
                );

                statusMap[emulator.id] = result.exists ? "valid" : "invalid";
            }

            if (!cancelled) {
                setEmulatorStatus(statusMap);
            }
        };

        checkEmulators();

        return () => {
            cancelled = true;
        };
    }, [emulators]);

    return {
        emulatorStatus,
    };
}