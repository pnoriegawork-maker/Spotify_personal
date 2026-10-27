/**
 * MÓDULO 1: AUTENTICACIÓN Y GESTIÓN DE SESIÓN (OAUTH 2.0 PKCE)
 * Implementa el estándar RFC 7636 para clientes públicos sin secreto compartido expuesto
 * Deconstruido a partir de la lógica de autenticación web de Spotify (REA Framework)
 */

import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';

export class AuthManager {
  constructor() {
    this.clientId = localStorage.getItem(CONFIG.STORAGE_KEYS.CLIENT_ID) || CONFIG.DEFAULT_CLIENT_ID;
    this.initFromStorage();
  }

  // Generador de cadena criptográfica aleatoria para PKCE
  generateRandomString(length = 64) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values).reduce((acc, x) => acc + possible[x % possible.length], '');
  }

  // Algoritmo SHA-256 para el code challenge
  async sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  }

  // Codificador Base64 URL-safe (sin caracteres +, / ni =)
  base64urlencode(a) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Iniciar flujo de autorización OAuth2 PKCE
  async loginWithSpotify() {
    try {
      const codeVerifier = this.generateRandomString(64);
      const hashed = await this.sha256(codeVerifier);
      const codeChallenge = this.base64urlencode(hashed);

      localStorage.setItem(CONFIG.STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        scope: [
          'user-read-private',
          'user-read-email',
          'user-read-playback-state',
          'user-modify-playback-state',
          'playlist-read-private',
          'playlist-read-collaborative'
        ].join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: CONFIG.REDIRECT_URI
      });

      state.addNetworkLog('accounts.spotify.com/authorize', 'OAuth2 PKCE', 302, 'Redirigiendo a pantalla de consentimiento');
      window.location.href = `${CONFIG.ENDPOINTS.ACCOUNTS_AUTH}?${params.toString()}`;
    } catch (err) {
      console.error('Error al iniciar OAuth PKCE:', err);
      state.addNetworkLog('accounts.spotify.com', 'OAuth2 PKCE', 500, `Fallo en handshake: ${err.message}`);
    }
  }

  // Interceptar retorno de callback con parámetro ?code=...
  async handleCallbackIfPresent() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Error devuelto por Spotify Auth:', error);
      state.addNetworkLog('accounts.spotify.com', 'OAuth2 Callback', 400, `Rechazado: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return false;
    }

    if (code) {
      state.addNetworkLog('accounts.spotify.com', 'OAuth2 Callback', 200, 'Código de autorización recibido. Intercambiando por Bearer Token...');
      const success = await this.exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, window.location.pathname);
      return success;
    }

    return false;
  }

  // Intercambio de código temporal por Access Token y Refresh Token
  async exchangeCodeForToken(code) {
    const codeVerifier = localStorage.getItem(CONFIG.STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      console.warn('No se encontró code_verifier en localStorage');
      return false;
    }

    const payload = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: CONFIG.REDIRECT_URI,
      code_verifier: codeVerifier
    });

    try {
      const response = await fetch(CONFIG.ENDPOINTS.ACCOUNTS_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.saveSession(data);
      state.addNetworkLog('accounts.spotify.com/api/token', 'OAuth2 Token', 200, 'Tokens emitidos y almacenados en caché');
      return true;
    } catch (err) {
      console.error('Error intercambiando código por token:', err);
      state.addNetworkLog('accounts.spotify.com/api/token', 'OAuth2 Token', 401, `Error en intercambio: ${err.message}`);
      return false;
    }
  }

  // Refrescar token caducado con Refresh Token
  async refreshAccessToken() {
    const refreshToken = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    const payload = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId
    });

    try {
      const response = await fetch(CONFIG.ENDPOINTS.ACCOUNTS_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload
      });

      if (!response.ok) throw new Error(`Refresh failed: ${response.status}`);

      const data = await response.json();
      this.saveSession(data);
      state.addNetworkLog('accounts.spotify.com/api/token', 'Token Refresh', 200, 'Access Token renovado automáticamente');
      return true;
    } catch (err) {
      console.warn('Error renovando token:', err);
      state.addNetworkLog('accounts.spotify.com/api/token', 'Token Refresh', 401, 'Refresh Token expirado');
      return false;
    }
  }

  // Guardar sesión en localStorage y en el estado global
  saveSession(tokenData) {
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token);
    if (tokenData.refresh_token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token);
    }
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN_EXPIRY, expiresAt.toString());

    state.set('auth', {
      isAuthenticated: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || state.get('auth').refreshToken,
      expiresAt: expiresAt,
      userName: 'Usuario Spotify (Conectado)',
      clientId: this.clientId
    });
  }

  // Inicializar estado desde LocalStorage
  initFromStorage() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    const expiresAt = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN_EXPIRY) || '0', 10);

    if (token && expiresAt > Date.now()) {
      state.set('auth', {
        isAuthenticated: true,
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        userName: 'Usuario Spotify (Conectado)',
        clientId: this.clientId
      });
    } else if (refreshToken) {
      // Intentar refresco automático
      this.refreshAccessToken();
    }
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CODE_VERIFIER);

    state.set('auth', {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: 0,
      userName: 'Modo Libre (SpClient Demo)',
      clientId: this.clientId
    });
    state.addNetworkLog('client://auth', 'Session', 200, 'Sesión cerrada. Regresando a catálogo libre.');
  }

  // Obtener Token válido o lanzar refresco
  async getValidToken() {
    const auth = state.get('auth');
    if (!auth.accessToken) return null;

    if (Date.now() >= auth.expiresAt - 60000) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) return null;
      return state.get('auth').accessToken;
    }

    return auth.accessToken;
  }
}

export const auth = new AuthManager();
