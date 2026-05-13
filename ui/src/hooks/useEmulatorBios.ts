import { Emulator } from "../types/emulator";

type Params = {
  setEmulators: React.Dispatch<React.SetStateAction<Emulator[]>>;
};

export function useEmulatorBios({ setEmulators }: Params) {
  const setEmulatorBios = async (id: string) => {
    const result = await window.electronAPI.selectBiosFile();

    if (result.canceled || !result.path) return;

    setEmulators((prev) =>
      prev.map((emulator) =>
        emulator.id === id
          ? {
              ...emulator,
              biosPath: result.path || "",
              biosConfigured: true,
            }
          : emulator
      )
    );
  };

  return {
    setEmulatorBios,
  };
}