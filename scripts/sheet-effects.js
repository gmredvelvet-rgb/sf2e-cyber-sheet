/**
 * SF2E NEURAL COMMAND INTERFACE — AAA Holographic Terminal Engine
 * Year 3200 | Military-Grade | FoundryVTT V13
 *
 * Systems:
 *   Layer 1  — Starfield
 *   Layer 2  — Nebula clouds
 *   Layer 3  — Holographic grid
 *   Layer 4  — Data-stream particles
 *   Layer 5  — Animated scanlines + sweep
 *   Layer 6  — Hologram flicker
 *   Layer 7  — Corner HUD brackets
 *   Layer 8  — Portrait biometric scanner
 *   Layer 9  — Tactical radar
 *   Layer 10 — Hex attribute power cores
 *   Layer 11 — Starship systems panel
 *   Layer 12 — Glitch engine
 *   Layer 13 — Energy edge segments
 *   Layer 14 — Telemetry floating labels
 *   Layer 15 — Status header ticker
 */

'use strict';

// ─── Registry ─────────────────────────────────────────────────────────────
const _nciRegistry = new WeakMap();

// ─── Tiny helpers ──────────────────────────────────────────────────────────
function _el(tag, cls = '') {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
}

function _rnd(min, max) { return min + Math.random() * (max - min); }
function _rndInt(min, max) { return Math.floor(_rnd(min, max + 0.999)); }

// ─── Attribute color palette ───────────────────────────────────────────────
const ATTR_COLORS = {
    str: '#ff6b00', dex: '#00ff88', con: '#ff2244',
    int: '#a100ff', wis: '#ffd700', cha: '#00cfff',
};

// ─── Main engine ───────────────────────────────────────────────────────────
class SF2eNeuralInterface {

    constructor(winEl) {
        this.win     = winEl;
        this.content = winEl.querySelector('.window-content');
        this._timers = [];
        this._streamBox = null;
    }

    // ── Public API ────────────────────────────────────────────────────────
    mount() {
        if (!this.content) return;
        this._buildLayerStack();
        this._cornerHUD();
        this._statusTicker();
        this._portraitScanner();
        this._tacticalRadar();
        this._hexCores();
        this._starshipPanel();
        this._energyEdges();
        this._telemetryLabels();
        this._initBar();
        this._dataStreams();
        this._glitchEngine();
    }

    destroy() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
        this.win.querySelectorAll('[data-nci]').forEach(e => e.remove());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER STACK (1-6)
    // ═══════════════════════════════════════════════════════════════════════
    _buildLayerStack() {
        if (this.content.querySelector('[data-nci="layers"]')) return;
        this.content.style.position = 'relative';

        const root = _el('div', 'sf2e-neural-command-interface');
        root.dataset.nci = 'layers';

        // L1 Starfield
        const starfield = _el('div', 'nci-layer nci-starfield');
        for (let i = 0; i < 90; i++) {
            const s = _el('div', 'nci-star');
            const sz = _rnd(0.5, 2.4);
            s.style.cssText = [
                `left:${_rnd(0,100)}%`,
                `top:${_rnd(0,100)}%`,
                `width:${sz}px`,
                `height:${sz}px`,
                `--nci-star-dur:${_rnd(2,9)}s`,
                `--nci-star-delay:${_rnd(0,7)}s`,
                `--nci-star-min:${_rnd(0.04,0.18)}`,
                `--nci-star-max:${_rnd(0.45, 1)}`,
            ].join(';');
            starfield.appendChild(s);
        }

        // L2 Nebula
        const nebula = _el('div', 'nci-layer nci-nebula');

        // L3 Grid
        const grid = _el('div', 'nci-layer nci-grid');

        // L4 Streams
        const streams = _el('div', 'nci-layer nci-streams');
        streams.dataset.nci = 'streams';
        this._streamBox = streams;

        // L5 Scanlines
        const scanlines = _el('div', 'nci-layer nci-scanlines');
        const sweep = _el('div', 'nci-scan-sweep');
        scanlines.appendChild(sweep);

        // L6 Flicker
        const flicker = _el('div', 'nci-layer nci-flicker');

        root.append(starfield, nebula, grid, streams, scanlines, flicker);
        this.content.insertBefore(root, this.content.firstChild);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CORNER HUD BRACKETS
    // ═══════════════════════════════════════════════════════════════════════
    _cornerHUD() {
        if (this.content.querySelector('[data-nci="hud"]')) return;

        const wrap = _el('div', 'nci-corner-hud');
        wrap.setAttribute('data-nci', 'hud');

        const makeSVG = () => {
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('viewBox', '0 0 38 38');
            svg.setAttribute('width', '38');
            svg.setAttribute('height', '38');

            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', 'M2 28 L2 2 L28 2');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#00cfff');
            path.setAttribute('stroke-width', '1.8');
            path.setAttribute('stroke-linecap', 'square');

            const dot = document.createElementNS(ns, 'circle');
            dot.setAttribute('cx', '2'); dot.setAttribute('cy', '2');
            dot.setAttribute('r', '2.2'); dot.setAttribute('fill', '#00cfff');

            const t1 = document.createElementNS(ns, 'line');
            t1.setAttribute('x1', '20'); t1.setAttribute('y1', '2');
            t1.setAttribute('x2', '20'); t1.setAttribute('y2', '6');
            t1.setAttribute('stroke', '#00cfff');
            t1.setAttribute('stroke-width', '0.9');
            t1.setAttribute('opacity', '0.55');

            const t2 = document.createElementNS(ns, 'line');
            t2.setAttribute('x1', '2'); t2.setAttribute('y1', '20');
            t2.setAttribute('x2', '6'); t2.setAttribute('y2', '20');
            t2.setAttribute('stroke', '#00cfff');
            t2.setAttribute('stroke-width', '0.9');
            t2.setAttribute('opacity', '0.55');

            svg.append(path, dot, t1, t2);
            return svg;
        };

        ['tl','tr','bl','br'].forEach(pos => {
            const corner = _el('div', `nci-corner ${pos}`);
            corner.appendChild(makeSVG());
            wrap.appendChild(corner);
        });

        this.content.appendChild(wrap);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS TICKER
    // ═══════════════════════════════════════════════════════════════════════
    _statusTicker() {
        const header = this.win.querySelector('.window-header');
        if (!header || header.querySelector('[data-nci="ticker"]')) return;

        const msgs = [
            'SYSTEM NOMINAL',       'BIO-SYNC ■ ACTIVE',    'NEURAL LINK EST.',
            'TARGET ACQ READY',     'DATA STREAM ■ OK',      'SHIELDS ■ ONLINE',
            'COMM ■ ENCRYPTED', 'ACCESS GRANTED ■ Δ7', 'CORE TEMP 36.7°C',
            'HRV 72 BPM ■ NOMINAL', 'BIOMETRIC ■ CONFIRMED', 'STARMAP SYNC OK',
            'FTL DRIVE STANDBY',    'THREAT LVL ■ MINIMAL',  'SEC CLR ■ DELTA-5',
            'SCANNING...',          'UPLINK ACTIVE',              'ENCRYPTED TX OPEN',
        ];

        header.style.position = 'relative';

        const ticker = _el('div', 'nci-status-ticker');
        ticker.setAttribute('data-nci', 'ticker');
        ticker.textContent = msgs[0];
        header.appendChild(ticker);

        let idx = 0;
        const cycle = () => {
            if (!this.win.isConnected) return;
            ticker.classList.add('nci-out');
            const t1 = setTimeout(() => {
                idx = (idx + 1) % msgs.length;
                ticker.textContent = msgs[idx];
                ticker.classList.remove('nci-out');
            }, 280);
            const t2 = setTimeout(cycle, 3500 + _rnd(0, 2200));
            this._timers.push(t1, t2);
        };
        const t0 = setTimeout(cycle, 3500);
        this._timers.push(t0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PORTRAIT BIOMETRIC SCANNER
    // ═══════════════════════════════════════════════════════════════════════
    _portraitScanner() {
        const portrait = this.win.querySelector(
            '.sf-cyber-image, .portrait-section, figure.portrait, ' +
            '.char-image, [class*="actor-portrait"], .pc-column .portrait'
        );
        if (!portrait || portrait.querySelector('[data-nci="scanner"]')) return;

        portrait.style.position = 'relative';
        portrait.style.overflow = 'visible';

        const wrap = _el('div', 'nci-portrait-scanner');
        wrap.setAttribute('data-nci', 'scanner');

        wrap.innerHTML = `<svg class="nci-scanner-svg" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <filter id="nciGlow1" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="nciSweepLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#00cfff" stop-opacity="0"/>
      <stop offset="30%"  stop-color="#00cfff" stop-opacity="0.7"/>
      <stop offset="50%"  stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="70%"  stop-color="#00cfff" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#00cfff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- DATA ORBIT RING -->
  <g class="nci-ring-data" style="transform-origin:110px 130px">
    <circle cx="110" cy="130" r="112" fill="none" stroke="#00cfff"
      stroke-width="0.4" stroke-opacity="0.18" stroke-dasharray="4 22"/>
    <circle cx="110" cy="130" r="112" fill="none" stroke="#a100ff"
      stroke-width="0.3" stroke-opacity="0.12" stroke-dasharray="2 34" stroke-dashoffset="18"/>
    <line x1="110" y1="18"  x2="110" y2="10"  stroke="#00cfff" stroke-width="1.0" stroke-opacity="0.5"/>
    <line x1="110" y1="242" x2="110" y2="250" stroke="#00cfff" stroke-width="1.0" stroke-opacity="0.5"/>
    <line x1="-2"  y1="130" x2="-10" y2="130" stroke="#00cfff" stroke-width="1.0" stroke-opacity="0.5"/>
    <line x1="222" y1="130" x2="230" y2="130" stroke="#00cfff" stroke-width="1.0" stroke-opacity="0.5"/>
  </g>
  <!-- OUTER TACTICAL RING -->
  <g class="nci-ring-outer" style="transform-origin:110px 130px">
    <circle cx="110" cy="130" r="96" fill="none" stroke="#00cfff"
      stroke-width="1.0" stroke-opacity="0.32" stroke-dasharray="42 8 10 8"/>
    <rect x="107" y="33"  width="6" height="3" fill="#00cfff" fill-opacity="0.5"/>
    <rect x="107" y="224" width="6" height="3" fill="#00cfff" fill-opacity="0.5"/>
    <rect x="13"  y="127" width="3" height="6" fill="#00cfff" fill-opacity="0.5"/>
    <rect x="204" y="127" width="3" height="6" fill="#00cfff" fill-opacity="0.5"/>
  </g>
  <!-- SCANNING RING -->
  <g class="nci-ring-mid" style="transform-origin:110px 130px">
    <circle cx="110" cy="130" r="78" fill="none" stroke="#00cfff"
      stroke-width="0.7" stroke-opacity="0.22" stroke-dasharray="20 6 6 6"/>
  </g>
  <!-- BIOMETRIC RING -->
  <g class="nci-ring-inner" style="transform-origin:110px 130px">
    <circle cx="110" cy="130" r="58" fill="none" stroke="#00ff88"
      stroke-width="0.7" stroke-opacity="0.28" stroke-dasharray="8 5"/>
    <circle cx="110" cy="72"  r="2.2" fill="#00ff88" fill-opacity="0.65"/>
    <circle cx="168" cy="130" r="2.2" fill="#00ff88" fill-opacity="0.65"/>
    <circle cx="110" cy="188" r="2.2" fill="#00ff88" fill-opacity="0.65"/>
    <circle cx="52"  cy="130" r="2.2" fill="#00ff88" fill-opacity="0.65"/>
  </g>
  <!-- TARGETING BRACKETS -->
  <g class="nci-target-bracket" filter="url(#nciGlow1)">
    <path d="M20 58 L20 20 L58 20"   fill="none" stroke="#00cfff" stroke-width="2.4" stroke-linecap="square" stroke-opacity="0.92"/>
    <path d="M162 20 L200 20 L200 58" fill="none" stroke="#00cfff" stroke-width="2.4" stroke-linecap="square" stroke-opacity="0.92"/>
    <path d="M20 202 L20 240 L58 240" fill="none" stroke="#00cfff" stroke-width="2.4" stroke-linecap="square" stroke-opacity="0.92"/>
    <path d="M200 202 L200 240 L162 240" fill="none" stroke="#00cfff" stroke-width="2.4" stroke-linecap="square" stroke-opacity="0.92"/>
    <path d="M32 46 L32 32 L46 32"    fill="none" stroke="#00cfff" stroke-width="0.8" stroke-opacity="0.4"/>
    <path d="M188 32 L174 32 L174 46" fill="none" stroke="#00cfff" stroke-width="0.8" stroke-opacity="0.4"/>
    <path d="M32 214 L32 228 L46 228" fill="none" stroke="#00cfff" stroke-width="0.8" stroke-opacity="0.4"/>
    <path d="M188 228 L174 228 L174 214" fill="none" stroke="#00cfff" stroke-width="0.8" stroke-opacity="0.4"/>
  </g>
  <!-- CROSSHAIRS -->
  <line x1="74"  y1="130" x2="92"  y2="130" stroke="#00cfff" stroke-width="1.2" stroke-opacity="0.7"/>
  <line x1="128" y1="130" x2="146" y2="130" stroke="#00cfff" stroke-width="1.2" stroke-opacity="0.7"/>
  <line x1="110" y1="94"  x2="110" y2="112" stroke="#00cfff" stroke-width="1.2" stroke-opacity="0.7"/>
  <line x1="110" y1="148" x2="110" y2="166" stroke="#00cfff" stroke-width="1.2" stroke-opacity="0.7"/>
  <circle cx="110" cy="130" r="3.2" fill="#00cfff" fill-opacity="0.5"/>
  <circle cx="110" cy="130" r="7"   fill="none" stroke="#00cfff" stroke-width="0.5" stroke-opacity="0.3"/>
  <!-- DIAGONAL DECORATIONS -->
  <line x1="20"  y1="20"  x2="52"  y2="52"  stroke="#00cfff" stroke-width="0.4" stroke-opacity="0.12"/>
  <line x1="200" y1="20"  x2="168" y2="52"  stroke="#00cfff" stroke-width="0.4" stroke-opacity="0.12"/>
  <line x1="20"  y1="240" x2="52"  y2="208" stroke="#00cfff" stroke-width="0.4" stroke-opacity="0.12"/>
  <line x1="200" y1="240" x2="168" y2="208" stroke="#00cfff" stroke-width="0.4" stroke-opacity="0.12"/>
  <!-- BIOSCAN SWEEP -->
  <rect class="nci-bio-scan" x="20" y="130" width="180" height="2"
    fill="url(#nciSweepLine)" rx="1"/>
  <!-- ORBITING ELEMENTS -->
  <g style="transform-origin:110px 130px;animation:nci-spin-cw 16s linear infinite">
    <circle cx="110" cy="18" r="2" fill="#ffd700" fill-opacity="0.75" filter="url(#nciGlow1)"/>
  </g>
  <g style="transform-origin:110px 130px;animation:nci-spin-ccw 11s linear infinite">
    <polygon points="110,242 113,248 107,248" fill="none" stroke="#a100ff"
      stroke-width="1.2" stroke-opacity="0.7" filter="url(#nciGlow1)"/>
  </g>
  <g style="transform-origin:110px 130px;animation:nci-spin-cw 22s linear infinite">
    <rect x="-6" y="127" width="4" height="6" fill="#00ff88" fill-opacity="0.6" filter="url(#nciGlow1)"/>
  </g>
  <!-- DATA LABELS -->
  <text x="20"  y="257" font-family="'Share Tech Mono',monospace" font-size="6.5" fill="#00cfff" fill-opacity="0.72" letter-spacing="2">ID &#9632; CONFIRMED</text>
  <text x="136" y="13"  font-family="'Share Tech Mono',monospace" font-size="6.5" fill="#00cfff" fill-opacity="0.72" letter-spacing="2">BIO-SCAN</text>
  <text x="20"  y="13"  font-family="'Share Tech Mono',monospace" font-size="6"   fill="#00ff88" fill-opacity="0.70" letter-spacing="1.5">&#9632; ONLINE</text>
  <text x="20"  y="18"  font-family="'Share Tech Mono',monospace" font-size="5.5" fill="#a100ff" fill-opacity="0.50" letter-spacing="1">CLR: &#916;5</text>
  <text x="152" y="257" font-family="'Share Tech Mono',monospace" font-size="6"   fill="#ffd700" fill-opacity="0.55" letter-spacing="1">THR: LOW</text>
</svg>`;

        portrait.appendChild(wrap);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TACTICAL RADAR
    // ═══════════════════════════════════════════════════════════════════════
    _tacticalRadar() {
        if (this.win.querySelector('[data-nci="radar"]')) return;

        const R = 52, cx = R + 8, cy = R + 8, D = (R + 8) * 2;
        const ang = (deg) => ({
            x: cx + R * Math.sin(deg * Math.PI / 180),
            y: cy - R * Math.cos(deg * Math.PI / 180),
        });
        const p1 = ang(0), p2 = ang(60);
        const sweepPath = `M${cx},${cy} L${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${R},${R} 0 0 1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} Z`;

        const blips = [
            { x: cx + R*0.36, y: cy - R*0.52, c: '#00ff88', r: 2.6, d: 0   },
            { x: cx - R*0.48, y: cy + R*0.32, c: '#ff2244', r: 2.1, d: 1.6 },
            { x: cx + R*0.2,  y: cy + R*0.62, c: '#00ff88', r: 1.9, d: 2.9 },
            { x: cx - R*0.58, y: cy - R*0.24, c: '#ffd700', r: 1.7, d: 0.9 },
            { x: cx + R*0.7,  y: cy + R*0.1,  c: '#a100ff', r: 1.5, d: 3.4 },
        ];

        const wrap = _el('div', 'nci-radar-wrap');
        wrap.dataset.nci = 'radar';

        // Posicionar justo a la izquierda del área principal (después del sidebar)
        const sidebar = this.win.querySelector('.sheet-sidebar, aside, .sidebar');
        const leftOffset = sidebar ? sidebar.offsetWidth + 6 : 8;
        wrap.style.cssText = `position:absolute;bottom:8px;left:${leftOffset}px;pointer-events:none;z-index:18;`;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${D} ${D}`);
        svg.setAttribute('width', `${D}`);
        svg.setAttribute('height', `${D}`);
        svg.style.display = 'block';

        const uid = `nciR${D}`;
        svg.innerHTML = `
<defs>
  <radialGradient id="${uid}Grad" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#00cfff" stop-opacity="0.65"/>
    <stop offset="100%" stop-color="#00cfff" stop-opacity="0"/>
  </radialGradient>
  <filter id="${uid}Blip">
    <feGaussianBlur stdDeviation="1.5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<circle cx="${cx}" cy="${cy}" r="${R+2}" fill="#000a12" stroke="#00cfff" stroke-width="1" stroke-opacity="0.45"/>
<circle cx="${cx}" cy="${cy}" r="${R*0.75}" fill="none" stroke="#00cfff" stroke-width="0.5" stroke-opacity="0.18"/>
<circle cx="${cx}" cy="${cy}" r="${R*0.5}"  fill="none" stroke="#00cfff" stroke-width="0.4" stroke-opacity="0.14"/>
<circle cx="${cx}" cy="${cy}" r="${R*0.25}" fill="none" stroke="#00cfff" stroke-width="0.3" stroke-opacity="0.10"/>
<line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="#00cfff" stroke-width="0.4" stroke-opacity="0.18"/>
<line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="#00cfff" stroke-width="0.4" stroke-opacity="0.18"/>
<line x1="${(cx-R*0.7).toFixed(1)}" y1="${(cy-R*0.7).toFixed(1)}" x2="${(cx+R*0.7).toFixed(1)}" y2="${(cy+R*0.7).toFixed(1)}" stroke="#00cfff" stroke-width="0.25" stroke-opacity="0.10"/>
<line x1="${(cx+R*0.7).toFixed(1)}" y1="${(cy-R*0.7).toFixed(1)}" x2="${(cx-R*0.7).toFixed(1)}" y2="${(cy+R*0.7).toFixed(1)}" stroke="#00cfff" stroke-width="0.25" stroke-opacity="0.10"/>
<g class="nci-radar-sweep-g" style="transform-origin:${cx}px ${cy}px">
  <path d="${sweepPath}" fill="url(#${uid}Grad)" opacity="0.85"/>
  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy-R}" stroke="#00cfff" stroke-width="1.3" stroke-opacity="0.95"/>
</g>
<g class="nci-radar-sweep-g-2" style="transform-origin:${cx}px ${cy}px">
  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy-R}" stroke="#00cfff" stroke-width="0.7" stroke-opacity="0.4"/>
</g>
${blips.map(b => `<circle class="nci-radar-blip" cx="${b.x.toFixed(2)}" cy="${b.y.toFixed(2)}" r="${b.r}" fill="${b.c}" filter="url(#${uid}Blip)" style="--nci-blip-cycle:4.2s;--nci-blip-delay:${b.d}s"/>`).join('\n')}
<circle cx="${cx}" cy="${cy}" r="${R+2}" fill="none" stroke="#00cfff" stroke-width="1.3" stroke-opacity="0.5"/>
<circle cx="${cx}" cy="${cy}" r="2" fill="#00cfff" fill-opacity="0.6"/>`;

        const label = _el('div', 'nci-radar-label');
        label.textContent = 'TACTICAL';

        const coords = _el('div', 'nci-coords');
        coords.textContent = 'Δ 14.3° / Σ 8.7°';

        wrap.append(svg, label, coords);

        const coordPool = [
            'Δ 14.3° / Σ 8.7°','Δ 22.1° / Σ 3.2°',
            'Δ 07.8° / Σ 15.4°','Δ 31.0° / Σ 11.9°',
            'Δ 18.5° / Σ 06.3°','Δ 09.4° / Σ 28.1°',
        ];
        let ci = 0;
        const rotCoords = () => {
            if (!this.win.isConnected) return;
            ci = (ci + 1) % coordPool.length;
            coords.textContent = coordPool[ci];
            const t = setTimeout(rotCoords, 4200 + _rnd(0, 3200));
            this._timers.push(t);
        };
        this._timers.push(setTimeout(rotCoords, 4200));

        this.content.appendChild(wrap);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HEX ATTRIBUTE POWER CORES
    // ═══════════════════════════════════════════════════════════════════════
    _hexCores() {
        const attrs = this.win.querySelectorAll(
            '.sf-cyber-attributes .attribute, .crb-style .attribute, [class*="attribute-block"]'
        );

        attrs.forEach((attr, i) => {
            if (attr.querySelector('[data-nci="hex"]')) return;

            const abbr  = [...attr.classList].find(c => ATTR_COLORS[c]) ?? 'str';
            const color = ATTR_COLORS[abbr] ?? '#00cfff';
            const pct   = 52 + Math.random() * 43;
            const delay = (i * 0.4).toFixed(2);

            const bg = _el('div', 'nci-hex-bg');
            bg.dataset.nci = 'hex';
            bg.dataset.nciPanel = '';
            bg.style.setProperty('--nci-core-color', color);

            bg.innerHTML = `
<svg class="nci-hex-svg" viewBox="0 0 80 90" width="80" height="90"
  style="--nci-core-color:${color};--nci-hex-delay:${delay}s;opacity:0.22;">
  <polygon points="40,4 74,22 74,68 40,86 6,68 6,22"
    fill="none" stroke="${color}" stroke-width="1.3"/>
  <polygon points="40,10 68,26 68,64 40,80 12,64 12,26"
    fill="${color}" fill-opacity="0.06" stroke="${color}" stroke-width="0.5" stroke-opacity="0.4"/>
</svg>
<svg class="nci-hex-spin-ring" viewBox="0 0 80 90" width="80" height="90"
  style="--nci-core-color:${color};--nci-hex-delay:${delay}s;opacity:0.12;">
  <polygon points="40,1 77,20 77,70 40,89 3,70 3,20"
    fill="none" stroke="${color}" stroke-width="0.6" stroke-dasharray="6 10"/>
</svg>`;

            const bar  = _el('div', 'nci-pwr-bar');
            const fill = _el('div', 'nci-pwr-fill');
            fill.style.cssText = `width:${pct.toFixed(1)}%;background:${color};box-shadow:0 0 5px ${color};--nci-core-color:${color};--nci-hex-delay:${delay}s;`;
            bar.appendChild(fill);

            const pctLbl = _el('div', 'nci-pwr-pct');
            pctLbl.textContent = `${pct.toFixed(1)}%`;
            pctLbl.style.setProperty('--nci-core-color', color);

            bg.append(bar, pctLbl);
            attr.style.position = 'relative';
            attr.insertBefore(bg, attr.firstChild);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STARSHIP SYSTEMS PANEL
    // ═══════════════════════════════════════════════════════════════════════
    _starshipPanel() {
        if (this.win.querySelector('[data-nci="ship"]')) return;

        const systems = [
            { lbl: 'SHIELDS',   pct: 87,  color: '#00cfff' },
            { lbl: 'ENGINES',   pct: 94,  color: '#00ff88' },
            { lbl: 'WEAPONS',   pct: 76,  color: '#ff6b00' },
            { lbl: 'LIFE SUPP', pct: 100, color: '#00ff88' },
            { lbl: 'FTL DRIVE', pct: 62,  color: '#a100ff' },
            { lbl: 'HULL INT',  pct: 91,  color: '#00cfff' },
            { lbl: 'FUEL RSRV', pct: 58,  color: '#ffd700' },
            { lbl: 'COMMS',     pct: 100, color: '#00ff88' },
        ];

        const panel = _el('div', 'nci-ship-panel');
        panel.dataset.nci = 'ship';
        panel.style.cssText = 'position:absolute;bottom:6px;right:6px;width:168px;pointer-events:none;z-index:16;';

        const hdr = _el('div', 'nci-ship-header');
        hdr.textContent = '▸ SHIP SYSTEMS';
        panel.appendChild(hdr);

        const hbWrap = _el('div', 'nci-heartbeat-wrap');
        hbWrap.innerHTML = `<svg class="nci-heartbeat-svg" viewBox="0 0 140 22" width="140" height="22" style="display:block">
  <path d="M0 11 L18 11 L26 3 L34 19 L42 3 L50 11 L62 11 L70 6 L78 16 L86 11 L140 11"
    fill="none" stroke="#00ff88" stroke-width="1.3" stroke-opacity="0.7" stroke-linejoin="round"/>
</svg>`;
        panel.appendChild(hbWrap);

        systems.forEach((sys, i) => {
            const row   = _el('div', 'nci-ship-row');
            const lbl   = _el('div', 'nci-sys-lbl');
            lbl.textContent = sys.lbl;

            const track = _el('div', 'nci-sys-track');
            const fill  = _el('div', 'nci-sys-fill');
            fill.style.cssText = `width:${sys.pct}%;background:${sys.color};box-shadow:0 0 4px ${sys.color};--nci-sys-delay:${(i*0.28).toFixed(2)}s;`;
            track.appendChild(fill);

            const pct = _el('div', 'nci-sys-pct');
            pct.style.color = sys.pct < 70 ? '#ff6b00' : sys.color;
            pct.textContent = `${sys.pct}%`;

            row.append(lbl, track, pct);
            panel.appendChild(row);
        });

        const footer = _el('div', 'nci-ship-footer');
        footer.textContent = `T+ ${Date.now().toString(16).slice(-8).toUpperCase()}`;
        panel.appendChild(footer);

        this.content.appendChild(panel);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ENERGY EDGE SEGMENTS
    // ═══════════════════════════════════════════════════════════════════════
    _energyEdges() {
        // NOTE: keep selectors narrow — broad selectors like `.crb-style section`
        // set overflow:hidden on tab content containers and clip buttons/nav items.
        const sel = [
            '.sf-cyber-attributes', '.sf-cyber-subsection', '.sf-cyber-details',
            '.attribute-list', '.saves-panel', '.sidebar-block',
        ].join(', ');

        this.win.querySelectorAll(sel).forEach((panel, i) => {
            if (panel.querySelector('[data-nci="edge"]')) return;
            panel.style.position = 'relative';
            // Do NOT set overflow:hidden here — the edge containers handle
            // their own clipping and tab/button content must not be clipped.

            const sentinel = _el('span');
            sentinel.setAttribute('data-nci', 'edge');
            sentinel.style.display = 'none';
            panel.appendChild(sentinel);

            const dur   = (2.4 + _rnd(0, 1.2)).toFixed(2);
            const delay = (i * 0.32).toFixed(2);

            const eh = _el('div', 'nci-energy-edge-h');
            const sh = _el('div', 'nci-energy-seg-h');
            sh.style.cssText = `--nci-edge-dur:${dur}s;--nci-edge-delay:${delay}s;`;
            eh.appendChild(sh);
            panel.appendChild(eh);

            const ev = _el('div', 'nci-energy-edge-v');
            const sv = _el('div', 'nci-energy-seg-v');
            sv.style.cssText = `--nci-edge-dur:${dur}s;--nci-edge-delay:${(Number.parseFloat(delay)+1.2).toFixed(2)}s;`;
            ev.appendChild(sv);
            panel.appendChild(ev);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TELEMETRY FLOATING LABELS
    // ═══════════════════════════════════════════════════════════════════════
    _telemetryLabels() {
        if (this.content.querySelector('[data-nci="telem"]')) return;

        const items = [
            { txt: 'SEC ■ DELTA-5', l: '1%', t: '6%',  d: 0,   dur: 8  },
            { txt: 'NODE 0x4F2A',   l: '1%', t: '11%', d: 2.2, dur: 10 },
            { txt: 'SUBSEC 7-G',    l: '1%', t: '16%', d: 4.1, dur: 9  },
            { txt: 'LAT: +14.3°',  r: '1%', t: '6%',  d: 1,   dur: 7  },
            { txt: 'LON: -88.7°',  r: '1%', t: '11%', d: 3,   dur: 11 },
            { txt: 'ALT: 3.2KM',   r: '1%', t: '16%', d: 1.5, dur: 8  },
            { txt: 'T+00:14:22',   l: '1%', b: '12%', d: 0.5, dur: 9  },
            { txt: 'UPLINK ■ EST', l: '1%', b: '8%',  d: 2.8, dur: 7  },
            { txt: 'FREQ 4.7GHz',  r: '1%', b: '12%', d: 1.2, dur: 8  },
            { txt: 'LINK ■ STABLE',r: '1%', b: '8%',  d: 3.5, dur: 9  },
        ];

        const layer = _el('div', 'nci-telemetry-layer');
        layer.dataset.nci = 'telem';

        items.forEach(item => {
            const el = _el('div', 'nci-telem');
            el.textContent = item.txt;
            const css = [];
            if (item.l) css.push(`left:${item.l}`);
            if (item.r) css.push(`right:${item.r}`);
            if (item.t) css.push(`top:${item.t}`);
            if (item.b) css.push(`bottom:${item.b}`);
            css.push(`--nci-telem-delay:${item.d}s`, `--nci-telem-dur:${item.dur}s`);
            el.style.cssText = css.join(';');
            layer.appendChild(el);
        });

        // Live clock
        const clockEl = _el('div', 'nci-telem');
        clockEl.style.cssText = 'right:1%;bottom:3%;--nci-telem-delay:0s;--nci-telem-dur:60s;';
        layer.appendChild(clockEl);
        const tick = () => {
            if (!this.win.isConnected) return;
            const d = new Date();
            clockEl.textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')} UTC`;
            this._timers.push(setTimeout(tick, 1000));
        };
        tick();

        // Live sector
        const sectorEl = _el('div', 'nci-telem');
        sectorEl.style.cssText = 'left:1%;bottom:3%;--nci-telem-delay:0.3s;--nci-telem-dur:12s;';
        sectorEl.textContent = 'SECTOR 7-G';
        layer.appendChild(sectorEl);
        const sectorPool = ['SECTOR 7-G','SECTOR 4-A','SUBSEC B-12','GRID 9-X','SECTOR 2-F'];
        let si = 0;
        const rotateSector = () => {
            if (!this.win.isConnected) return;
            si = (si + 1) % sectorPool.length;
            sectorEl.textContent = sectorPool[si];
            this._timers.push(setTimeout(rotateSector, 12000 + _rnd(0, 8000)));
        };
        this._timers.push(setTimeout(rotateSector, 12000));

        this.content.appendChild(layer);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BOOT PROGRESS BAR
    // ═══════════════════════════════════════════════════════════════════════
    _initBar() {
        const bar = _el('div', 'nci-init-bar');
        bar.setAttribute('data-nci', 'initbar');
        this.content.appendChild(bar);
        this._timers.push(setTimeout(() => { if (bar.parentNode) bar.remove(); }, 1700));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DATA STREAM PARTICLES
    // ═══════════════════════════════════════════════════════════════════════
    _dataStreams() {
        const box = this._streamBox;
        if (!box) return;

        const spawn = () => {
            if (!this.win.isConnected) return;
            const p    = _el('div', 'nci-stream-p');
            const vert = Math.random() > 0.42;
            const w    = this.content.offsetWidth  || 640;
            const h    = this.content.offsetHeight || 720;
            const len  = 14 + Math.random() * 55;
            const dur  = (1.2 + Math.random() * 2.6).toFixed(2);

            if (vert) {
                p.classList.add('vert');
                p.style.cssText = `left:${_rnd(0,w)}px;top:0;height:${len}px;--nci-sp-dur:${dur}s;`;
            } else {
                p.classList.add('horiz');
                p.style.cssText = `top:${_rnd(0,h)}px;left:0;width:${len}px;--nci-sp-dur:${dur}s;`;
            }

            box.appendChild(p);
            p.addEventListener('animationend', () => p.remove(), { once: true });
            this._timers.push(setTimeout(spawn, 140 + Math.random() * 520));
        };

        for (let i = 0; i < 7; i++) {
            this._timers.push(setTimeout(spawn, i * 190));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GLITCH ENGINE
    // ═══════════════════════════════════════════════════════════════════════
    _glitchEngine() {
        const portrait = this.win.querySelector(
            '.sf-cyber-image, .portrait-section, figure.portrait, ' +
            '.char-image, [class*="actor-portrait"], .pc-column .portrait'
        );
        if (!portrait) return;

        const errors = [
            'SIGNAL LOST',    'DATA CORRUPT',    'BIO-SCAN ERR',
            'LINK UNSTABLE',  'NULL REF 0x4F2A', 'SYNC FAILURE',
            'MATRIX OVERFLOW','NODE OFFLINE',    'DECRYPTION FAIL',
            'BUFFER OVERRUN', 'AUTH TIMEOUT',    'STREAM CORRUPT',
        ];

        const cl  = portrait.classList;
        const go  = (ms, fn) => { this._timers.push(setTimeout(fn, ms)); };

        const chromatic = () => {
            cl.add('nci-gfx-chromatic');
            go(90 + _rnd(0, 110), () => cl.remove('nci-gfx-chromatic'));
        };
        const staticFx = () => {
            cl.add('nci-gfx-static');
            go(65 + _rnd(0, 90), () => cl.remove('nci-gfx-static'));
        };
        const jitter = () => {
            cl.add('nci-gfx-jitter');
            go(200 + _rnd(0, 130), () => cl.remove('nci-gfx-jitter'));
        };
        const invert = () => {
            cl.add('nci-gfx-invert');
            go(58 + _rnd(0, 70), () => cl.remove('nci-gfx-invert'));
        };
        const frag = () => {
            cl.add('nci-gfx-frag');
            go(240 + _rnd(0, 180), () => cl.remove('nci-gfx-frag'));
        };
        const slices = () => {
            const n = _rndInt(1, 4);
            for (let i = 0; i < n; i++) {
                const s = _el('div', 'nci-glitch-slice');
                Object.assign(s.style, {
                    top:       `${_rnd(4, 91)}%`,
                    height:    `${_rnd(2, 18)}px`,
                    transform: `translateX(${(_rnd(0,1) - 0.5) * 36}px)`,
                    opacity:   `${_rnd(0.38, 0.92)}`,
                    background: Math.random() > 0.5 ? 'rgba(0,255,255,0.20)' : 'rgba(255,0,80,0.18)',
                });
                portrait.appendChild(s);
                go(55 + _rnd(0, 155), () => { if (s.parentNode) s.remove(); });
            }
        };
        const error = () => {
            const e = _el('div', 'nci-glitch-error');
            e.textContent = errors[_rndInt(0, errors.length - 1)];
            portrait.appendChild(e);
            go(220 + _rnd(0, 360), () => { if (e.parentNode) e.remove(); });
        };

        const pool = [
            chromatic, chromatic, chromatic, chromatic,
            slices, slices, slices,
            jitter, jitter,
            staticFx, staticFx,
            invert, frag,
            () => { chromatic(); go(45, slices); },
            error,
        ];

        const cluster = () => {
            if (!this.win.isConnected) return;
            const n = _rndInt(1, 3);
            for (let i = 0; i < n; i++) {
                go(i * (50 + _rnd(0, 110)), () => pool[_rndInt(0, pool.length - 1)]());
            }
        };

        const schedule = () => {
            if (!this.win.isConnected) return;
            cluster();
            go(1800 + _rnd(0, 6200), schedule);
        };

        go(1400, schedule);
    }
}

// ─── Foundry Hook ─────────────────────────────────────────────────────────
Hooks.on('renderActorSheet', (app, html, _data) => {
    if (app.actor?.type !== 'character') return;

    const el = app.element;
    let winEl = null;
    if (el instanceof HTMLElement) winEl = el;
    else if (el?.jquery !== undefined) winEl = el[0] ?? null;
    if (!winEl) return;

    if (_nciRegistry.has(winEl)) _nciRegistry.get(winEl).destroy();

    const nci = new SF2eNeuralInterface(winEl);
    _nciRegistry.set(winEl, nci);

    const t = setTimeout(() => { if (winEl.isConnected) nci.mount(); }, 420);
    nci._timers.push(t);
});
