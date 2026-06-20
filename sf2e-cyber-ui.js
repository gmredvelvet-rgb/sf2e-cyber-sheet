/**
 * SF2E Cyber Sheet — Inicialización del módulo
 *
 * NO registramos ni reemplazamos hojas del sistema sf2e.
 * El módulo opera puramente por CSS (sf2e.css) y el animador
 * holográfico (scripts/hologram-animator.js).
 *
 * La clase sf-cyber-sheet sobre el form y sf-cyber-ui sobre el body
 * son los únicos puntos de entrada CSS del módulo.
 */

Hooks.once('ready', () => {
    // Marca el body para que los selectores CSS globales del módulo
    // (body.sf-cyber-ui .window-app ...) solo afecten sesiones con el módulo activo.
    document.body.classList.add('sf-cyber-ui');
    console.log('SF2e Cyber Sheet | Módulo activo.');
});

// hologram-animator.js ya registra su propio hook renderActorSheet
// que añade sf-cyber-sheet al html[0].
// No duplicamos ese hook aquí.
