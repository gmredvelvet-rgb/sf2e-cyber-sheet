const MODULE_ID = 'sf2e-cyber-sheet';

export function registerSettings() {
  // World-level license flag — written by GM client after Patreon auth,
  // read by all clients to decide whether to activate the module.
  game.settings.register(MODULE_ID, 'worldLicensed', {
    scope: 'world',
    type: Boolean,
    config: false,
    default: false
  });
}
