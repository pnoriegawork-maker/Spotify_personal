/**
 * GESTOR DE ESTADO REACTIVO GLOBAL (FLUX / PUB-SUB)
 * Sincroniza en tiempo real la interfaz UI, el motor de audio y el almacenamiento
 */

import { CONFIG } from './config.js';

class AppState {
  constructor() {
    this.listeners = new Map();

    this.state = {
      // Estado de reproducción
      currentTrack: CONFIG.DEMO_CATALOG[0],
      isPlaying: false,
      currentTime: 0,
      duration: CONFIG.DEMO_CATALOG[0].duration,
      volume: 0.8,
      isMuted: false,
      isShuffle: false,
      repeatMode: 'all', // 'none' | 'all' | 'one'

      // Cola de reproducción
      queue: [...CONFIG.DEMO_CATALOG],
      queueIndex: 0,
      history: [],

      // Vistas y Navegación
      activeView: 'home',
      searchQuery: '',
      searchCategory: 'all',
      searchResults: [],

      // Colección Personal
      favorites: [],
      customPlaylists: [
        {
          id: 'pl-favorites',
          name: 'Tus me gusta',
          desc: 'Canciones guardadas en tu biblioteca',
          cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
          trackIds: []
        },
        {
          id: 'pl-cyberpunk',
          name: 'Cyberpunk & REA Mix',
          desc: 'Sintetizadores, Lo-Fi y protocolos de red',
          cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
          trackIds: ['demo-rea-01', 'demo-rea-02', 'demo-rea-04']
        }
      ],

      // Autenticación y Diagnóstico
      auth: {
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: 0,
        userName: 'Modo Libre (SpClient Demo)',
        clientId: CONFIG.DEFAULT_CLIENT_ID
      },

      // Diagnóstico de Red / Protocolos
      networkLogs: [
        { time: '14:20:01', endpoint: 'apresolve.spotify.com', status: 200, proto: 'HTTPS GET', note: 'Access Point asignado: ap-gew4.spotify.com' },
        { time: '14:20:02', endpoint: 'accounts.spotify.com/api/token', status: 200, proto: 'OAuth2 PKCE', note: 'Token verificado sin client_secret' },
        { time: '14:20:03', endpoint: 'spclient.wg.spotify.com/storage-resolve', status: 200, proto: 'Mercury Protobuf', note: 'Resolución de audio interactivo OK' }
      ]
    };
  }

  // Suscripción a cambios de propiedades
  subscribe(property, callback) {
    if (!this.listeners.has(property)) {
      this.listeners.set(property, new Set());
    }
    this.listeners.get(property).add(callback);
    return () => this.listeners.get(property).delete(callback);
  }

  // Notificar a observadores
  notify(property, value) {
    if (this.listeners.has(property)) {
      for (const callback of this.listeners.get(property)) {
        try {
          callback(value, this.state);
        } catch (err) {
          console.error(`Error en listener de ${property}:`, err);
        }
      }
    }
    // Notificador universal
    if (this.listeners.has('*')) {
      for (const callback of this.listeners.get('*')) {
        callback(property, value, this.state);
      }
    }
  }

  // Modificador de estado seguro
  set(property, value) {
    if (this.state[property] === value) return;
    this.state[property] = value;
    this.notify(property, value);
  }

  get(property) {
    return this.state[property];
  }

  // Agregar log al laboratorio REA
  addNetworkLog(endpoint, proto, status, note) {
    const time = new Date().toTimeString().split(' ')[0];
    const newLog = { time, endpoint, status, proto, note };
    this.state.networkLogs.unshift(newLog);
    if (this.state.networkLogs.length > 30) this.state.networkLogs.pop();
    this.notify('networkLogs', this.state.networkLogs);
  }
}

export const state = new AppState();
