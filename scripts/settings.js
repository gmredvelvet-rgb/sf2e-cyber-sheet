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

  // Per-client toggle: show/hide the holographic arm videos (open, idle, close).
  game.settings.register(MODULE_ID, 'armAnimation', {
    name: 'Arm Animation',
    hint: 'Enable or disable the holographic arm animations (open, idle, close). Does not affect other sheet effects.',
    scope: 'client',
    type: Boolean,
    config: true,
    default: true
  });
}
