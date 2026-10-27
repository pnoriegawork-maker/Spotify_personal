/**
 * MÓDULO 4: GESTOR DE BIBLIOTECA, PLAYLISTS Y FAVORITOS (LOCAL STORAGE & PERSISTENCIA)
 * Almacena en la caché del dispositivo pistas favoritas y listas creadas por el usuario
 */

import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';

export class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadFavorites();
    this.loadPlaylists();
  }

  loadFavorites() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.FAVORITES);
      if (raw) {
        const favs = JSON.parse(raw);
        state.set('favorites', favs);
      }
    } catch (e) {
      console.warn('Error leyendo favoritos de localStorage:', e);
    }
  }

  saveFavorites(favorites) {
    state.set('favorites', favorites);
    localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }

  toggleFavorite(track) {
    if (!track) return false;
    const favorites = state.get('favorites') || [];
    const exists = favorites.some((f) => f.id === track.id);

    let updated = [];
    if (exists) {
      updated = favorites.filter((f) => f.id !== track.id);
    } else {
      updated = [track, ...favorites];
    }

    this.saveFavorites(updated);
    return !exists;
  }

  isFavorite(trackId) {
    const favorites = state.get('favorites') || [];
    return favorites.some((f) => f.id === trackId);
  }

  loadPlaylists() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_PLAYLISTS);
      if (raw) {
        const playlists = JSON.parse(raw);
        state.set('customPlaylists', playlists);
      }
    } catch (e) {
      console.warn('Error leyendo playlists:', e);
    }
  }

  savePlaylists(playlists) {
    state.set('customPlaylists', playlists);
    localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_PLAYLISTS, JSON.stringify(playlists));
  }

  createPlaylist(name, desc = 'Playlist creada por el usuario') {
    const playlists = state.get('customPlaylists') || [];
    const newPlaylist = {
      id: `pl-${Date.now()}`,
      name: name || `Mi Playlist #${playlists.length + 1}`,
      desc: desc,
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      trackIds: []
    };

    const updated = [...playlists, newPlaylist];
    this.savePlaylists(updated);
    return newPlaylist;
  }

  addTrackToPlaylist(playlistId, trackId) {
    const playlists = state.get('customPlaylists') || [];
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist && !playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId);
      this.savePlaylists([...playlists]);
      return true;
    }
    return false;
  }

  clearAllData() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CUSTOM_PLAYLISTS);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    state.set('favorites', []);
    this.loadPlaylists();
  }
}

export const storage = new StorageManager();
