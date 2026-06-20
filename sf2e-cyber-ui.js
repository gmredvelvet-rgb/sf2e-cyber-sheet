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

import { registerSettings } from './scripts/settings.js';
import { SF2eLicenseClient, SF2eLicenseUI } from './scripts/license-client.js';

const MODULE_ID = 'sf2e-cyber-sheet';

// ── Init: register settings ────────────────────────────────────────────────
Hooks.once('init', () => {
    registerSettings();
});

// ── Setup: license gate ────────────────────────────────────────────────────
Hooks.once('setup', async () => {
    if (game.user?.isGM) {
        const licensed = await SF2eLicenseClient.instance.initialize();
        if (licensed) {
            try { await game.settings.set(MODULE_ID, 'worldLicensed', true); } catch { /* ignore */ }
        } else {
            Hooks.once('ready', () => SF2eLicenseUI.show());
        }
    }

    const worldLicensed = game.settings.get(MODULE_ID, 'worldLicensed') ?? false;
    if (!worldLicensed) return;

    _activateModule();
});

// ── Ready: re-check for players (GM already handled in setup) ──────────────
Hooks.on('ready', () => {
    const worldLicensed = game.settings.get(MODULE_ID, 'worldLicensed') ?? false;
    if (!worldLicensed) return;

    document.body.classList.add('sf-cyber-ui');
    console.log('SF2e Cyber Sheet | Módulo activo.');
});

// Activate when GM connects mid-session (worldLicensed written after OAuth)
Hooks.on('sf2e-cyber-sheet.activate', () => {
    document.body.classList.add('sf-cyber-ui');
});

function _activateModule() {
    // hologram-animator.js ya registra su propio hook renderActorSheet
    // que añade sf-cyber-sheet al html[0]. No duplicamos ese hook aquí.
    document.body.classList.add('sf-cyber-ui');
    console.log('SF2e Cyber Sheet | Módulo activo.');
}
