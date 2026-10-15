module.exports = {
  packagerConfig: {
    asar: true,

    ignore: [/^[/\\]admin-tools([/\\]|$)/],

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
