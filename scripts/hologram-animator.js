/**
 * SF2E Cyber Sheet — Hologram Animator + Audio
 *
 * Secuencia de apertura:
 *  1. open.webm   → esquina inferior-izquierda
 *  2. La ficha emerge (clip-path) cuando quedan EMERGE_BEFORE_MS del video
 *  3. sheetaudio.mp3 → loop ambiental mientras la hoja está activa
 *  4. Al terminar open.webm → idle.webm en esquina (loop)
 *
 * Secuencia de cierre:
 *  1. Detener idle + audio ambiental (fade-out)
 *  2. Colapso visual de la ventana
 *  3. origClose() elimina el DOM
 *  4. close.webm en esquina
 */

const MODULE_ID        = 'sf2e-cyber-sheet';
const IMG_BASE         = `modules/${MODULE_ID}/assets/images`;
const SND_BASE         = `modules/${MODULE_ID}/assets/sounds`;
const EMERGE_MS        = 1150;   // debe coincidir con la duración CSS (1.1s)
const COLLAPSE_MS      = 700;    // debe coincidir con la duración CSS (0.65s)
const EMERGE_BEFORE_MS = 3500;   // la hoja emerge este tiempo ANTES de que termine open.webm

/** Resolve app.element a HTMLElement (jQuery v1 o ApplicationV2 nativo). */
function getWindowEl(app) {
    const el = app.element;
    if (!el) return null;
    if (el instanceof HTMLElement) return el;
    if (el.jquery !== undefined) return el[0] ?? null;
    return null;
}

/**
 * Crea un <video> fijo en la esquina inferior-izquierda.
 */
function cornerVideo(src, loop = false) {
    const wrap = document.createElement('div');
    wrap.className = 'sf-holo-corner-wrap';
    Object.assign(wrap.style, {
        position      : 'fixed',
        bottom        : '0',
        left          : '0',
        zIndex        : '99998',
        pointerEvents : 'none',
        lineHeight    : '0',
    });

    const vid = document.createElement('video');
    vid.src         = src;
    vid.autoplay    = true;
    vid.muted       = true;
    vid.loop        = loop;
    vid.playsInline = true;
    Object.assign(vid.style, {
        display   : 'block',
        width     : 'auto',
        height    : 'auto',
        maxWidth  : '50vw',
        maxHeight : '60vh',
        objectFit : 'contain',
    });

    wrap.appendChild(vid);

    const promise = loop
        ? Promise.resolve()
        : new Promise(resolve => {
            vid.addEventListener('ended', resolve, { once: true });
            vid.addEventListener('error', resolve, { once: true });
        });

    return { wrap, vid, promise };
}

/** Centra la ventana en el área visible (excluye la barra izquierda de Foundry). */
function centerWindow(app, windowEl) {
    try {
        const leftBar = 76;
        const vpW     = window.innerWidth  - leftBar;
        const vpH     = window.innerHeight - 80;
        const winW    = windowEl.offsetWidth  || 600;
        const winH    = windowEl.offsetHeight || 700;
        app.setPosition({
            left : Math.round(leftBar + Math.max(0, (vpW - winW) / 2)),
            top  : Math.round(Math.max(10, (vpH - winH) / 3)),
        });
    } catch (err) {
        console.debug('SF2E Cyber | setPosition no disponible:', err.message);
    }
}

// ── Estado por ventana ────────────────────────────────────────────────────
// WeakMap: GC automático cuando la ventana sale del DOM; soporta múltiples fichas simultáneas
const _holoState = new WeakMap();

function _getState(windowEl) {
    if (!_holoState.has(windowEl)) {
        _holoState.set(windowEl, { idleWrap: null, audio: null, fadeInterval: null });
    }
    return _holoState.get(windowEl);
}

let _clickAudio = null;   // singleton one-shot — no necesita estado por ventana

// ── Audio helpers ──────────────────────────────────────────────────────────

function startSheetAudio(windowEl) {
    const state = _getState(windowEl);
    if (state.audio) return;

    const audio  = new Audio(`${SND_BASE}/sheetaudio.mp3`);
    audio.loop   = true;
    audio.volume = 0;
    state.audio  = audio;
    audio.play().catch(() => {});

    const target = 0.28;
    const step   = target / 24;
    state.fadeInterval = setInterval(() => {
        if (state.audio !== audio) { clearInterval(state.fadeInterval); state.fadeInterval = null; return; }
        audio.volume = Math.min(audio.volume + step, target);
        if (audio.volume >= target) { clearInterval(state.fadeInterval); state.fadeInterval = null; }
    }, 50);
}

function stopSheetAudio(windowEl) {
    const state = _getState(windowEl);
    if (!state.audio) return;

    if (state.fadeInterval) { clearInterval(state.fadeInterval); state.fadeInterval = null; }

    const audio = state.audio;
    state.audio = null;

    state.fadeInterval = setInterval(() => {
        audio.volume = Math.max(0, audio.volume - 0.05);
        if (audio.volume <= 0) {
            clearInterval(state.fadeInterval);
            state.fadeInterval = null;
            audio.pause();
        }
    }, 30);
}

function playClickSound() {
    if (!_clickAudio) {
        _clickAudio = new Audio(`${SND_BASE}/click.mp3`);
        _clickAudio.volume = 0.6;
    }
    _clickAudio.currentTime = 0;
    _clickAudio.play().catch(() => {});
}

// ── Open sequence ─────────────────────────────────────────────────────────

async function openHologram(app, windowEl) {
    if (windowEl.dataset.holoState) return;
    windowEl.dataset.holoState = 'opening';

    windowEl.classList.add('sf-holo-init');

    // 1 ─ Reproducir open.webm en la esquina
    const { wrap: openWrap, vid: openVid, promise: openDone } = cornerVideo(`${IMG_BASE}/open.webm`);
    document.body.appendChild(openWrap);

    // 2 ─ Esperar hasta EMERGE_BEFORE_MS antes del final del video
    await new Promise(resolve => {
        let fired = false;
        function schedule() {
            if (fired) return;
            fired = true;
            const totalMs = (openVid.duration || 0) * 1000;
            const waitMs  = Math.max(0, totalMs - EMERGE_BEFORE_MS);
            setTimeout(resolve, waitMs);
        }
        if (openVid.readyState >= 1) {
            schedule();
        } else {
            openVid.addEventListener('loadedmetadata', schedule, { once: true });
            openVid.addEventListener('error',          schedule, { once: true });
            setTimeout(schedule, 2000);
        }
    });

    // 3 ─ Centrar la ventana ANTES de revelarla
    centerWindow(app, windowEl);

    // 4 ─ Emerge
    windowEl.classList.remove('sf-holo-init');
    windowEl.classList.add('sf-holo-emerge');

    // 5 ─ Esperar que termine la emerge animation
    await new Promise(r => setTimeout(r, EMERGE_MS));
    windowEl.classList.remove('sf-holo-emerge');
    windowEl.classList.add('sf-holo-active');
    windowEl.dataset.holoState = 'idle';

    // 6 ─ Arrancar audio ambiental
    startSheetAudio(windowEl);

    // 7 ─ Esperar que open.webm termine COMPLETAMENTE antes de arrancar idle
    await openDone;
    openWrap.remove();

    // Guardia: no arrancar idle si la hoja ya se cerró
    const state = _getState(windowEl);
    if (!state.idleWrap && windowEl.isConnected && windowEl.dataset.holoState === 'idle') {
        const { wrap: iw } = cornerVideo(`${IMG_BASE}/idle.webm`, true);
        state.idleWrap = iw;
        document.body.appendChild(state.idleWrap);
    }
}

// ── Close sequence ────────────────────────────────────────────────────────

async function closeHologram(windowEl) {
    // Detener idle y audio inmediatamente
    const state = _getState(windowEl);
    if (state.idleWrap) { state.idleWrap.remove(); state.idleWrap = null; }
    stopSheetAudio(windowEl);

    // Colapsar la ventana
    if (windowEl) {
        windowEl.classList.remove('sf-holo-active');
        windowEl.classList.add('sf-holo-collapse');
        await new Promise(r => setTimeout(r, COLLAPSE_MS));
        windowEl.style.visibility = 'hidden';
    }
    // close.webm se lanza DESPUÉS de origClose (ver hook abajo)
}

// ── Foundry hooks ─────────────────────────────────────────────────────────

Hooks.on('renderActorSheet', (app, html, _data) => {
    if (!game.settings.get?.('sf2e-cyber-sheet', 'worldLicensed')) return;
    if (app.actor?.type !== 'character') return;

    const windowEl = getWindowEl(app);
    if (!windowEl) return;

    html[0]?.classList.add('sf-cyber-sheet');

    // ── Sonido de click en botones/links de la hoja ──────────────────────
    if (!app._sfClickListenerAdded) {
        app._sfClickListenerAdded = true;
        windowEl.addEventListener('click', (e) => {
            if (e.target.closest(
                'button, a[data-action], .rollable, [data-action], ' +
                '.item-control, .trait-tag, .action-glyph, .strike-damage, ' +
                '.tag[data-slug], .cyber-btn, nav.tabs .item'
            )) {
                playClickSound();
            }
        });
    }

    // ── Parchar close() una sola vez por instancia ───────────────────────
    if (!app._holoPatched) {
        app._holoPatched = true;
        const origClose = app.close.bind(app);

        app.close = async function (opts = {}) {
            const el = getWindowEl(this);
            if (el?.dataset.holoState === 'idle') {
                el.dataset.holoState = 'closing';
                await closeHologram(el);
            }
            // Ventana se cierra primero
            await origClose(opts);
            // close.webm entra JUSTO DESPUÉS de que la ventana desapareció del DOM
            const { wrap, promise } = cornerVideo(`${IMG_BASE}/close.webm`);
            document.body.appendChild(wrap);
            await promise;
            wrap.remove();
        };
    }

    // Solo en el primer render
    if (!windowEl.dataset.holoState) {
        openHologram(app, windowEl);
    }
});
