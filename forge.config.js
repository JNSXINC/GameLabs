module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: ["core/services/controls/templates"],
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "gamelabs",
        setupExe: "GameLabsSetup.exe",
      },
    },
  ],
};
