/**
 * SF2E Cyber Sheet — Hologram Animator
 *
 * Secuencia exacta:
 *  1. open.webm   → esquina inferior-izquierda (reloj/mano)
 *  2. Al terminar: la ficha emerge desde abajo (clip-path) + idle.webm comienza SIMULTÁNEAMENTE
 *  3. idle.webm   → loop en esquina mientras la ficha está abierta
 *  4. Al cerrar   → la ficha colapsa + close.webm en esquina
 */

const MODULE_ID        = 'sf2e-cyber-sheet';
const IMG_BASE         = `modules/${MODULE_ID}/assets/images`;
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
 * Tamaño natural, sin crop.
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
        const leftBar = 76;                          // ancho de la barra izquierda de herramientas
        const vpW     = window.innerWidth  - leftBar;
        const vpH     = window.innerHeight - 80;    // descontar barra superior + inferior
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

// ── Estado global del idle overlay ───────────────────────────────────────
let _idleWrap = null;

// ── Open sequence ─────────────────────────────────────────────────────────

async function openHologram(app, windowEl) {
    if (windowEl.dataset.holoState) return;
    windowEl.dataset.holoState = 'opening';

    // Ocultar la ventana (opacity:0 no rompe el layout)
    windowEl.classList.add('sf-holo-init');

    // 1 ─ Reproducir open.webm en la esquina
    const { wrap: openWrap, vid: openVid, promise: openDone } = cornerVideo(`${IMG_BASE}/open.webm`);
    document.body.appendChild(openWrap);

    // 2 ─ Esperar hasta que queden EMERGE_BEFORE_MS ms del video (no hasta que termine)
    await new Promise(resolve => {
        let fired = false;
        function schedule() {
            if (fired) return;
            fired = true;
            const totalMs = (openVid.duration || 0) * 1000;
            const waitMs  = Math.max(0, totalMs - EMERGE_BEFORE_MS);
            setTimeout(resolve, waitMs);
        }
        if (openVid.readyState >= 1) {   // metadata ya cargada
            schedule();
        } else {
            openVid.addEventListener('loadedmetadata', schedule, { once: true });
            openVid.addEventListener('error',          schedule, { once: true });
            setTimeout(schedule, 2000);  // fallback si metadata tarda demasiado
        }
    });

    // 3 ─ Centrar la ventana ANTES de revelarla
    centerWindow(app, windowEl);

    // 4 ─ Emerge (open.webm sigue corriendo en la esquina)
    windowEl.classList.remove('sf-holo-init');
    windowEl.classList.add('sf-holo-emerge');

    // 5 ─ Esperar que termine la emerge animation
    await new Promise(r => setTimeout(r, EMERGE_MS));
    windowEl.classList.remove('sf-holo-emerge');
    windowEl.classList.add('sf-holo-active');
    windowEl.dataset.holoState = 'idle';

    // 6 ─ Esperar que open.webm termine COMPLETAMENTE antes de arrancar idle
    await openDone;
    openWrap.remove();

    // Guardia: si el usuario cerró la hoja mientras open.webm corría, no arrancar idle
    if (!_idleWrap && windowEl.isConnected && windowEl.dataset.holoState === 'idle') {
        const { wrap: iw } = cornerVideo(`${IMG_BASE}/idle.webm`, true);
        _idleWrap = iw;
        document.body.appendChild(_idleWrap);
    }
}

// ── Close sequence ────────────────────────────────────────────────────────

async function closeHologram(windowEl) {
    // Detener idle
    if (_idleWrap) { _idleWrap.remove(); _idleWrap = null; }

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
    if (app.actor?.type !== 'character') return;

    const windowEl = getWindowEl(app);
    if (!windowEl) return;

    html[0]?.classList.add('sf-cyber-sheet');

    // Parchar close() una sola vez por instancia
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

    // Solo en el primer render (no en re-renders por cambio de datos)
    if (!windowEl.dataset.holoState) {
        openHologram(app, windowEl);
    }
});
