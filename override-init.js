/**
 * SF2E Cyber Sheet — override-init.js
 *
 * Antes intentaba reemplazar la hoja de personaje del sistema sf2e
 * usando APIs de V10 (Actors.unregisterSheet / class extends ActorSheet)
 * que no son compatibles con Foundry V12/V13.
 *
 * El módulo ya no reemplaza la hoja: aplica estilos CSS sobre la hoja
 * nativa del sistema y usa hooks de renderizado para efectos visuales.
 */

// sf2e-cyber-ui.js y hologram-animator.js gestionan el ciclo de vida del módulo.
