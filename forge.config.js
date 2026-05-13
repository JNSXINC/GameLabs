module.exports = {
  packagerConfig: {
    asar: true
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "gamelabs",
        setupExe: "GameLabsSetup.exe"
      }
    }
  ]
};