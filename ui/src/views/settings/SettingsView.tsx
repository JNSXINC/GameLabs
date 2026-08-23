import React from "react";
import { Emulator } from "../../types/emulator";
import EmulatorSettings from "./emulators/EmulatorSettings";
import ControllerSettings from "./controls/ControllerSettings";


type Props = {
    emulators: Emulator[];
    setEmulators: React.Dispatch<React.SetStateAction<Emulator[]>>;
    setEmulatorExecutable: (id: string) => void | Promise<void>;
};

export default function SettingsView({
    emulators,
    setEmulators,
    setEmulatorExecutable,
}: Props) {
    const glassPanel: React.CSSProperties = {
        background: "rgba(7, 13, 28, 0.62)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.08)",
    };

    return (
        <div style={{ padding: "34px 42px" }}>
            <h1 style={{ marginTop: 0, fontSize: "42px" }}>Settings</h1>

            <div
                style={{
                    ...glassPanel,
                    borderRadius: "18px",
                    padding: "24px",
                    maxWidth: "560px",
                    marginTop: "24px",
                }}
            >
                <p>🎮 Modo desempenho: ON</p>
                <p>🔊 Volume: 80%</p>
                <p>🌙 Tema: Dark</p>
                <p>🧩 Interface estilo console: ativa</p>

                <EmulatorSettings
                    emulators={emulators}
                    setEmulators={setEmulators}
                    setEmulatorExecutable={setEmulatorExecutable}
                />

                <hr
                    style={{
                        margin: "24px 0",
                        borderColor: "rgba(255,255,255,0.08)",
                    }}
                />

                <hr
                    style={{
                        margin: "24px 0",
                        borderColor: "rgba(255,255,255,0.08)",
                    }}
                />

                <ControllerSettings />
            </div>
        </div>
    );
}