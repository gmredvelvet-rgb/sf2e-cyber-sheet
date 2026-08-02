/**
 * SF2E Cyber Sheet — License Client
 *
 * Handles Patreon OAuth, JWT token management, device fingerprinting,
 * periodic heartbeat, and feature gating.
 *
 * All sensitive operations (token issuance, subscription verification)
 * happen on the server. This file is the client-side coordinator only.
 */

const MODULE_ID = 'sf2e-cyber-sheet';
const API_BASE  = 'https://vnd-license.gmredvelvet.workers.dev';

// RSA public key (SPKI base64url) — safe to embed; forging requires the private key (server-only).
const RSA_PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3-hTzuHo9lgENNQiA4-Fm7VIdalqisZ5NhqrBioXmIXSMbEhYpy1TnPkCBAdAzXAsyX1YdTYLcMADETPnERvceLsDoAWHFZzHGxoXBkOGw0ukAyHJyrwBZxCf_bY_FSbip_-XQuTS4YuyhLPVNjbGMZdVarkegh7BKwW4CR9MDb1DMtf_NxtfNqJ3MxhfAiTxIod4AWer8esisr0IekQlPLmMPA2KggzQw9rFj61B4DAVk2F_TAXPMOKyEcX_zVGpp00JTurTsfwK2023UHKO9t98R0rG17oX0rK_x2EOBiW2Nla3NChZyR4yi8zHe0vjYhprqcwozv9wN0wbANnzwIDAQAB';

// ── Storage keys (localStorage) ───────────────────────────────────────────────
const SK = {
  accessToken:    `${MODULE_ID}:at`,
  refreshToken:   `${MODULE_ID}:rt`,
  tokenExpiry:    `${MODULE_ID}:exp`,
  installationId: `${MODULE_ID}:iid`,
  tier:           `${MODULE_ID}:tier`,
  features:       `${MODULE_ID}:features`,
};

// ── SF2eLicenseClient ─────────────────────────────────────────────────────────

export class SF2eLicenseClient {
  static #instance = null;

  #accessToken      = null;
  #refreshToken     = null;
  #tokenExpiry      = 0;
  #installationId   = null;
  #fingerprint      = null;
  #features         = [];
  #tier             = 'none';
  #heartbeatTimer        = null;
  #initialHeartbeatTimer = null;
  #lastHeartbeat         = 0;
  #gracePeriodMs    = 5 * 60 * 1000;
  #degraded         = false;
  #rsaPublicKey     = null;

  static get instance() {
    if (!this.#instance) this.#instance = new SF2eLicenseClient();
    return this.#instance;
  }

  // ── Initialization ──────────────────────────────────────────────────────────

  async initialize() {
    this.#installationId = this.#getOrCreateInstallationId();
    this.#fingerprint    = await this.#computeFingerprint();
    this.#loadStoredTokens();

    if (this.#accessToken && this.#isAccessTokenValid()) {
      try {
        await this.#loadVerifiedClaims();
      } catch {
        this.#clearStoredTokens();
        return false;
      }
      this.#startHeartbeat();
      return true;
    }

    if (this.#refreshToken) {
      try {
        await this.#doRefresh();
        this.#startHeartbeat();
        return true;
      } catch (e) {
        // A transient outage must never destroy a valid licence: keep the
        // credentials so the heartbeat can recover once the server is back.
        // The unconditional clear here meant that loading a world while
        // offline cost the GM their licence and a full re-authorisation.
        if (this.#isTransient(e)) {
          this.#startHeartbeat();
          return false;
        }
        this.#clearStoredTokens();
      }
    }

    return false;
  }

  // ── Feature gate ───────────────────────────────────────────────────────────

  hasFeature(featureName) {
    if (this.#degraded) return false;
    if (!this.#accessToken || !this.#isAccessTokenValid()) return false;
    return this.#features.includes(featureName);
  }

  get tier() { return this.#tier; }
  get isLicensed() { return this.#tier !== 'none' && !this.#degraded; }

  // ── OAuth flow ─────────────────────────────────────────────────────────────

  async startOAuth() {
    const { url } = await this.#apiCall('/oauth/start', { origin: globalThis.location.origin, moduleId: MODULE_ID });
    const popup   = window.open(url, 'sf2e-patreon-auth', 'width=600,height=700,popup=yes');

    return new Promise((resolve, reject) => {
      const expectedOrigin = new URL(API_BASE).origin;

      const handler = async (event) => {
        if (event.origin !== expectedOrigin) return;
        if (event.data?.type !== 'vnd-auth-code') return;
        window.removeEventListener('message', handler);
        popup?.close();
        try {
          await this.activateWithCode(event.data.authCode);
          resolve(true);
        } catch (e) {
          reject(e);
        }
      };
      window.addEventListener('message', handler);

      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);
          window.removeEventListener('message', handler);
          resolve(false);
        }
      }, 1000);
    });
  }

  async activateWithCode(authCode) {
    const result = await this.#apiCall('/oauth/exchange', {
      authCode,
      installationId:  this.#installationId,
      fingerprintHash: this.#fingerprint,
      moduleId:        MODULE_ID
    });

    this.#storeTokens(result.accessToken, result.refreshToken, result.expiresIn, result.tier, result.features);
    this.#tier     = result.tier;
    this.#features = result.features ?? [];
    this.#startHeartbeat();
    Hooks.callAll('sf2e-cyber-sheet.activate');
    game.settings?.set?.(MODULE_ID, 'worldLicensed', true).catch(() => {});

    ui.notifications?.info(`SF2E Cyber Sheet: Connected as ${result.tier} subscriber. Welcome!`);
  }

  // ── Release installation slot ───────────────────────────────────────────────

  async releaseInstallation() {
    try {
      await this.#apiCall('/license/release', { installationId: this.#installationId });
      this.#clearStoredTokens();
      this.#stopHeartbeat();
      game.settings?.set?.(MODULE_ID, 'worldLicensed', false).catch(() => {});
      ui.notifications?.info('SF2E Cyber Sheet: Installation slot released.');
    } catch (e) {
      ui.notifications?.error(`SF2E Cyber Sheet: Failed to release slot — ${e.message}`);
    }
  }

  // ── Internal: token storage ─────────────────────────────────────────────────

  #loadStoredTokens() {
    this.#accessToken  = localStorage.getItem(SK.accessToken);
    this.#refreshToken = localStorage.getItem(SK.refreshToken);
    this.#tokenExpiry  = Number.parseInt(localStorage.getItem(SK.tokenExpiry) ?? '0', 10);
    const rawFeatures  = JSON.parse(localStorage.getItem(SK.features) ?? '[]');
    this.#features     = Array.isArray(rawFeatures) ? rawFeatures : [];
    this.#tier         = localStorage.getItem(SK.tier) ?? 'none';
  }

  #storeTokens(at, rt, expiresIn, tier, features) {
    const expiry = Date.now() + expiresIn * 1000;
    this.#accessToken  = at;
    this.#refreshToken = rt;
    this.#tokenExpiry  = expiry;
    this.#tier         = tier;
    this.#features     = features ?? [];

    localStorage.setItem(SK.accessToken,  at);
    localStorage.setItem(SK.refreshToken, rt);
    localStorage.setItem(SK.tokenExpiry,  String(expiry));
    localStorage.setItem(SK.tier,         tier);
    localStorage.setItem(SK.features,     JSON.stringify(features ?? []));
  }

  #clearStoredTokens() {
    this.#accessToken  = null;
    this.#refreshToken = null;
    this.#tokenExpiry  = 0;
    this.#tier         = 'none';
    this.#features     = [];
    Object.values(SK).forEach(k => localStorage.removeItem(k));
  }

  #isAccessTokenValid() {
    return !!this.#accessToken && this.#tokenExpiry > Date.now() + 60_000;
  }

  async #loadVerifiedClaims() {
    const claims    = await this.#verifyAndParseJwt(this.#accessToken);
    this.#tier      = claims.tier     ?? 'none';
    this.#features  = claims.features ?? [];
  }

  // ── Internal: installation ID ───────────────────────────────────────────────

  #getOrCreateInstallationId() {
    let iid = localStorage.getItem(SK.installationId);
    if (!iid) {
      iid = crypto.randomUUID();
      localStorage.setItem(SK.installationId, iid);
    }
    return iid;
  }

  // ── Internal: device fingerprint ────────────────────────────────────────────

  async #computeFingerprint() {
    const components = [
      game.world?.id ?? 'unknown',
      game.version ?? '',
      this.#installationId,
      navigator.language,
      navigator.hardwareConcurrency,
      screen.width, screen.height, screen.colorDepth,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      await this.#canvasFingerprint()
    ].join('|');

    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(components));
    return btoa(String.fromCodePoint(...new Uint8Array(buf)));
  }

  async #canvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('sf2e-fp', 2, 15);
      ctx.fillStyle = 'rgba(102,204,0,0.7)';
      ctx.fillText('sf2e-fp', 4, 17);
      return canvas.toDataURL().slice(-32);
    } catch { return 'no-canvas'; }
  }

  // ── Internal: refresh ───────────────────────────────────────────────────────

  // Serialises token rotation. The server revokes the old refresh token the
  // moment it is used and treats a second presentation as reuse — a critical
  // SECURITY_VIOLATION that revokes the whole token family. Two overlapping
  // refreshes were enough to trigger it and push the GM back through Patreon.
  #refreshInFlight = null;

  async #doRefresh() {
    this.#refreshInFlight ??= this.#doRefreshOnce()
      .finally(() => { this.#refreshInFlight = null; });
    return this.#refreshInFlight;
  }

  // Transport hiccups are safe to retry and must never destroy tokens;
  // anything else is a definitive verdict from the licence server.
  #isTransient(e) {
    if (!(e instanceof LicenseError)) return true;
    return ['NETWORK_ERROR', 'INTERNAL_ERROR', 'RATE_LIMITED', 'NOT_FOUND', 'API_ERROR'].includes(e.code);
  }

  async #doRefreshOnce() {
    const result = await this.#apiCall('/token/refresh', {
      refreshToken:    this.#refreshToken,
      fingerprintHash: this.#fingerprint
    });
    this.#storeTokens(result.accessToken, result.refreshToken, result.expiresIn, result.tier, result.features);
  }

  // ── Internal: heartbeat ─────────────────────────────────────────────────────

  #startHeartbeat() {
    this.#stopHeartbeat();
    const INTERVAL = 15 * 60 * 1000;
    this.#lastHeartbeat = Date.now();

    this.#initialHeartbeatTimer = setTimeout(() => {
      this.#initialHeartbeatTimer = null;
      this.#doHeartbeat();
    }, 60_000);
    this.#heartbeatTimer = setInterval(() => this.#doHeartbeat(), INTERVAL);
  }

  #stopHeartbeat() {
    if (this.#initialHeartbeatTimer) {
      clearTimeout(this.#initialHeartbeatTimer);
      this.#initialHeartbeatTimer = null;
    }
    if (this.#heartbeatTimer) {
      clearInterval(this.#heartbeatTimer);
      this.#heartbeatTimer = null;
    }
  }

  async #doHeartbeat() {
    try {
      const result = await this.#apiCall('/heartbeat', {
        installationId:  this.#installationId,
        fingerprintHash: this.#fingerprint
      });

      this.#storeTokens(result.accessToken, this.#refreshToken, result.expiresIn, result.tier, result.features);
      this.#lastHeartbeat = Date.now();
      this.#degraded = false;
    } catch {
      this.#handleHeartbeatFailure();
    }
  }

  #handleHeartbeatFailure() {
    const timeSinceLast = Date.now() - this.#lastHeartbeat;
    if (timeSinceLast > this.#gracePeriodMs) {
      if (!this.#degraded) {
        this.#degraded = true;
        if (game.user?.isGM) {
          game.settings?.set?.(MODULE_ID, 'worldLicensed', false).catch(() => {});
          ui.notifications?.warn('SF2E Cyber Sheet: License server unreachable. Premium features suspended until reconnected.');
        }
      }
    }
  }

  // ── Internal: API call ──────────────────────────────────────────────────────

  async #apiCall(endpoint, body, method = 'POST') {
    const nonce     = crypto.randomUUID();
    const timestamp = Date.now();

    const init = {
      method,
      headers: {
        'Content-Type':       'application/json',
        'X-Installation-ID':  this.#installationId ?? '',
      }
    };

    if (this.#accessToken) {
      init.headers['Authorization'] = `Bearer ${this.#accessToken}`;
    }

    if (method === 'POST' && body !== null) {
      init.body = JSON.stringify({ ...body, nonce, timestamp });
    }

    const url  = `${API_BASE}${endpoint}`;
    // fetch() rejects on DNS failure / offline / server down — a transport
    // problem, never an auth verdict. Callers must not burn tokens over it.
    let resp;
    try {
      resp = await fetch(url, init);
    } catch {
      throw new LicenseError('License server unreachable', 'NETWORK_ERROR');
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Network error', code: 'NETWORK_ERROR' }));
      throw new LicenseError(err.error ?? 'Request failed', err.code ?? 'API_ERROR');
    }

    const data = await resp.json();

    if (data.sig && data.payload) {
      await this.#verifyResponseSig(data.payload, data.sig);
      return data.payload;
    }

    return data;
  }

  // ── RSA helpers ─────────────────────────────────────────────────────────────

  async #importRsaPublicKey() {
    if (this.#rsaPublicKey) return this.#rsaPublicKey;
    const keyBytes = Uint8Array.from(
      atob(RSA_PUBLIC_KEY.replaceAll('-', '+').replaceAll('_', '/')),
      c => c.codePointAt(0)
    );
    this.#rsaPublicKey = await crypto.subtle.importKey(
      'spki', keyBytes,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify']
    );
    return this.#rsaPublicKey;
  }

  async #verifyResponseSig(payload, jwt) {
    const parts = jwt.split('.');
    if (parts.length !== 3) throw new LicenseError('Malformed response token', 'SIGNATURE_INVALID');

    const [hdr, body, sig] = parts;
    const key  = await this.#importRsaPublicKey();
    const data = new TextEncoder().encode(`${hdr}.${body}`);
    const sigBytes = Uint8Array.from(
      atob(sig.replaceAll('-', '+').replaceAll('_', '/')),
      c => c.codePointAt(0)
    );

    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes, data);
    if (!valid) throw new LicenseError('Server response verification failed', 'SIGNATURE_INVALID');

    const claims = JSON.parse(atob(body.replaceAll('-', '+').replaceAll('_', '/')));
    const now    = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) throw new LicenseError('Response token expired', 'REPLAY_DETECTED');

    const payloadHash = await crypto.subtle.digest(
      'SHA-256', new TextEncoder().encode(JSON.stringify(payload))
    );
    const expectedPh = btoa(String.fromCodePoint(...new Uint8Array(payloadHash)))
      .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    if (claims.ph !== expectedPh) throw new LicenseError('Response payload tampered', 'SIGNATURE_INVALID');
  }

  async #verifyAndParseJwt(token) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new LicenseError('Malformed JWT', 'INVALID_TOKEN');

    const [hdr, body, sig] = parts;
    const key  = await this.#importRsaPublicKey();
    const data = new TextEncoder().encode(`${hdr}.${body}`);
    const sigBytes = Uint8Array.from(
      atob(sig.replaceAll('-', '+').replaceAll('_', '/')),
      c => c.codePointAt(0)
    );

    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes, data);
    if (!valid) throw new LicenseError('JWT signature invalid', 'INVALID_TOKEN');

    const payload = JSON.parse(atob(body.replaceAll('-', '+').replaceAll('_', '/')));
    const now     = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) throw new LicenseError('JWT expired', 'TOKEN_EXPIRED');
    return payload;
  }
}

// ── LicenseError ──────────────────────────────────────────────────────────────

export class LicenseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'LicenseError';
    this.code = code;
  }
}

// ── License Prompt UI ─────────────────────────────────────────────────────────

export class SF2eLicenseUI {
  static show() {
    if (!game.user?.isGM) return;

    const id = 'sf2e-license-prompt';
    if (document.getElementById(id)) return;

    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = `
      position:fixed; bottom:80px; right:20px; z-index:9999;
      background:#0a0f1a; border:1px solid #00cfff44; border-radius:12px;
      padding:20px 24px; max-width:320px; box-shadow:0 8px 32px rgba(0,200,255,.15);
      font-family:system-ui,sans-serif; color:#c8e8ff;
    `;
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="font-size:1.4rem">🔐</span>
        <strong style="color:#00cfff;font-size:1rem">SF2E Cyber Sheet</strong>
      </div>
      <p style="font-size:.85rem;color:#7aaecc;margin-bottom:16px;line-height:1.4">
        Connect your Patreon account to enable premium features.
      </p>
      <div style="margin-bottom:12px;padding:10px 12px;border-radius:6px;
                  border:1px solid #c89b3c55;background:#c89b3c14;font-size:.85rem;line-height:1.45">
        <strong style="color:#c89b3c">Why am I being asked to reconnect?</strong><br/>
        We changed how Patreon subscriptions are verified, so activations made before the change no longer validate. Reconnecting your account once puts it right. This is not a new charge and not a price change: your Patreon subscription is untouched, you will not be billed again, and you keep your installation slots. Only the authorisation is renewed.
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button id="sf2e-connect-btn" style="
          background:#00cfff;color:#050d18;border:none;border-radius:8px;
          padding:10px;font-size:.9rem;font-weight:700;cursor:pointer;width:100%
        ">Connect Patreon</button>
        <button id="sf2e-code-btn" style="
          background:transparent;color:#7aaecc;border:1px solid #00cfff44;border-radius:8px;
          padding:8px;font-size:.8rem;cursor:pointer;width:100%
        ">I have an auth code</button>
        <button id="sf2e-dismiss-btn" style="
          background:none;border:none;color:#3a6a8a;font-size:.75rem;cursor:pointer;
          text-align:right;padding:0
        ">Dismiss</button>
      </div>
    `;

    el.querySelector('#sf2e-connect-btn').addEventListener('click', async () => {
      const btn = el.querySelector('#sf2e-connect-btn');
      btn.textContent = 'Opening Patreon...';
      btn.disabled = true;
      try {
        const success = await SF2eLicenseClient.instance.startOAuth();
        if (success) el.remove();
        else { btn.textContent = 'Connect Patreon'; btn.disabled = false; }
      } catch (e) {
        btn.textContent = 'Connect Patreon'; btn.disabled = false;
        ui.notifications?.error(`SF2E Cyber Sheet: ${e.message}`);
      }
    });

    el.querySelector('#sf2e-code-btn').addEventListener('click', () => {
      SF2eLicenseUI.showCodeInput();
      el.remove();
    });

    el.querySelector('#sf2e-dismiss-btn').addEventListener('click', () => el.remove());

    document.body.appendChild(el);
  }

  static showCodeInput() {
    new Dialog({
      title: 'SF2E Cyber Sheet — Enter Auth Code',
      content: `
        <div style="margin-bottom:12px;padding:10px 12px;border-radius:6px;
                    border:1px solid #c89b3c55;background:#c89b3c14;font-size:.85rem;line-height:1.45">
          <strong style="color:#c89b3c">Why am I being asked to reconnect?</strong><br/>
          We changed how Patreon subscriptions are verified, so activations made before the change no longer validate. Reconnecting your account once puts it right. This is not a new charge and not a price change: your Patreon subscription is untouched, you will not be billed again, and you keep your installation slots. Only the authorisation is renewed.
        </div>
        <p style="margin-bottom:12px;font-size:.9rem">
          Paste the code shown after connecting your Patreon account.
        </p>
        <input id="sf2e-auth-code-input" type="text"
          placeholder="Paste auth code here..."
          style="width:100%;padding:8px;border-radius:6px;border:1px solid #00cfff44;
                 background:#0a0f1a;color:#c8e8ff;font-family:monospace;font-size:.85rem"/>
      `,
      buttons: {
        activate: {
          label: '<i class="fas fa-key"></i> Activate',
          callback: async (html) => {
            const code = html.find('#sf2e-auth-code-input').val().trim();
            if (!code) return;
            try {
              await SF2eLicenseClient.instance.activateWithCode(code);
            } catch (e) {
              ui.notifications?.error(`SF2E Cyber Sheet: ${e.message}`);
            }
          }
        },
        cancel: { label: 'Cancel' }
      }
    }).render(true, { width: 420 });
  }
}
