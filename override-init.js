import { registerSheetOverride } from './sf2e-cyber-ui.js';

Hooks.once('init', async function() {
  // Sobrescribe la hoja de personaje por defecto del sistema
  registerSheetOverride();
});
