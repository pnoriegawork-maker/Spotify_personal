/**
 * MÓDULO 4: GESTOR DE BIBLIOTECA, PERSISTENCIA Y MOTOR DE DESCARGA OFFLINE (INDEXEDDB)
 * Permite almacenar físicamente los archivos binarios de audio (Blobs) en la memoria interna
 * del smartphone/laptop para reproducción fluida sin conexión, con señal baja o en modo avión.
 */

import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';

export class StorageManager {
  constructor() {
    this.dbName = 'SpotifyOfflineAudioDB';
    this.dbVersion = 1;
    this.storeName = 'audio_blobs';
    this.db = null;
    this.activeObjectUrls = new Map();

    this.initDB();
    this.loadFavorites();
    this.loadPlaylists();
  }

  // Inicializar base de datos IndexedDB en el dispositivo
  async initDB() {
    if (this.db) return this.db;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };

        request.onsuccess = (e) => {
          this.db = e.target.result;
          resolve(this.db);
        };

        request.onerror = (e) => {
          console.warn('IndexedDB no disponible, se usará memoria volátil:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('Excepción abriendo IndexedDB:', err);
        resolve(null);
      }
    });
  }

  // Cargar lista de favoritos desde localStorage
  loadFavorites() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.FAVORITES);
      if (raw) {
        const favs = JSON.parse(raw);
        state.set('favorites', favs);
      }
    } catch (e) {
      console.warn('Error leyendo favoritos:', e);
    }
  }

  // Guardar favoritos
  saveFavorites(favorites) {
    state.set('favorites', favorites);
    localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }

  // Alternar favorito y descargar/eliminar audio físico
  async toggleFavorite(track) {
    if (!track) return { isFav: false, isOffline: false };
    const favorites = state.get('favorites') || [];
    const exists = favorites.some((f) => f.id === track.id);

    if (exists) {
      const updated = favorites.filter((f) => f.id !== track.id);
      this.saveFavorites(updated);
      await this.deleteAudioOffline(track.id);
      return { isFav: false, isOffline: false, track };
    } else {
      // Agregar temporalmente en estado descargando
      const newFavTrack = {
        ...track,
        isOffline: false,
        isDownloading: true,
        addedAt: Date.now()
      };
      const updated = [newFavTrack, ...favorites];
      this.saveFavorites(updated);

      // Iniciar descarga binaria a IndexedDB
      const success = await this.downloadAudioOffline(track);

      // Actualizar a estado listo y disponible offline
      const currentFavs = state.get('favorites') || [];
      const finalized = currentFavs.map((f) =>
        f.id === track.id ? { ...f, isOffline: success, isDownloading: false } : f
      );
      this.saveFavorites(finalized);

      return { isFav: true, isOffline: success, track };
    }
  }

  isFavorite(trackId) {
    const favorites = state.get('favorites') || [];
    return favorites.some((f) => f.id === trackId);
  }

  // DESCARGA FÍSICA DEL ARCHIVO DE AUDIO EN INDEXEDDB
  async downloadAudioOffline(track) {
    if (!this.db) await this.initDB();
    if (!this.db || !track || !track.audioUrl) return false;

    try {
      state.addNetworkLog(track.audioUrl, 'Offline Storage', 200, `Descargando "${track.title}" a la memoria interna`);
      
      // 1. Descargar audio binario con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(track.audioUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const audioBlob = await response.blob();

      // 2. Descargar carátula para visualización sin conexión
      let coverBlob = null;
      if (track.coverUrl && !track.coverUrl.startsWith('data:')) {
        try {
          const coverRes = await fetch(track.coverUrl);
          if (coverRes.ok) coverBlob = await coverRes.blob();
        } catch (e) {
          // Omitir si la carátula no puede ser obtenida
        }
      }

      // 3. Guardar registro en IndexedDB
      return new Promise((resolve) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const record = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album || 'Single',
          duration: track.duration || 180,
          durationFormatted: track.durationFormatted || '3:00',
          audioUrl: track.audioUrl,
          coverUrl: track.coverUrl,
          blob: audioBlob,
          coverBlob: coverBlob,
          size: audioBlob.size,
          savedAt: Date.now()
        };

        const putReq = store.put(record);

        transaction.oncomplete = () => {
          const mb = (audioBlob.size / (1024 * 1024)).toFixed(2);
          state.addNetworkLog(`idb://${track.id}`, 'Storage OK', 200, `"${track.title}" guardada (${mb} MB) para escuchar sin conexión`);
          resolve(true);
        };

        transaction.onerror = (e) => {
          console.warn('Error al guardar en IndexedDB:', e);
          resolve(false);
        };
      });
    } catch (err) {
      console.warn(`Error al descargar audio para ${track.title}:`, err);
      return false;
    }
  }

  // OBTENER URL DE REPRODUCCIÓN LOCAL (BLOB URL) SIN USAR INTERNET
  async getAudioUrlForPlayback(track) {
    if (!track) return '';
    if (!this.db) await this.initDB();
    if (!this.db) return track.audioUrl;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const req = store.get(track.id);

        req.onsuccess = (e) => {
          const record = e.target.result;
          if (record && record.blob) {
            // Si ya teníamos una URL previa de este track, revocar para liberar RAM
            if (this.activeObjectUrls.has(track.id)) {
              try { URL.revokeObjectURL(this.activeObjectUrls.get(track.id)); } catch (_) {}
            }

            const localUrl = URL.createObjectURL(record.blob);
            this.activeObjectUrls.set(track.id, localUrl);

            // Carátula local si está guardada
            if (record.coverBlob) {
              track.localCoverUrl = URL.createObjectURL(record.coverBlob);
            }

            state.addNetworkLog(`idb://${track.id}`, 'Audio Offline', 200, `Reproduciendo "${track.title}" desde memoria interna (Sin conexión)`);
            resolve(localUrl);
          } else {
            // No está en la memoria interna, usar streaming de internet
            resolve(track.audioUrl);
          }
        };

        req.onerror = () => {
          resolve(track.audioUrl);
        };
      } catch (err) {
        resolve(track.audioUrl);
      }
    });
  }

  // Eliminar audio físico de la memoria
  async deleteAudioOffline(trackId) {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    if (this.activeObjectUrls.has(trackId)) {
      try { URL.revokeObjectURL(this.activeObjectUrls.get(trackId)); } catch (_) {}
      this.activeObjectUrls.delete(trackId);
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.delete(trackId);
    } catch (err) {
      console.warn('Error eliminando audio de IndexedDB:', err);
    }
  }

  // Verificar si una canción está almacenada en la memoria física
  async isTrackDownloaded(trackId) {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const req = store.get(trackId);

        req.onsuccess = (e) => {
          resolve(Boolean(e.target.result && e.target.result.blob));
        };

        req.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  // Estadísticas del almacenamiento offline
  async getStorageStats() {
    if (!this.db) await this.initDB();
    if (!this.db) return { count: 0, totalBytes: 0, totalMB: '0.0' };

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const req = store.getAll();

        req.onsuccess = (e) => {
          const records = e.target.result || [];
          let totalBytes = 0;
          records.forEach((r) => {
            if (r.blob) totalBytes += r.blob.size;
          });
          resolve({
            count: records.length,
            totalBytes,
            totalMB: (totalBytes / (1024 * 1024)).toFixed(1)
          });
        };

        req.onerror = () => resolve({ count: 0, totalBytes: 0, totalMB: '0.0' });
      } catch (err) {
        resolve({ count: 0, totalBytes: 0, totalMB: '0.0' });
      }
    });
  }

  // Playlists
  loadPlaylists() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_PLAYLISTS);
      if (raw) {
        state.set('customPlaylists', JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Error leyendo playlists:', e);
    }
  }

  savePlaylists(playlists) {
    state.set('customPlaylists', playlists);
    localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_PLAYLISTS, JSON.stringify(playlists));
  }

  createPlaylist(name, desc = 'Playlist personalizada') {
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

  clearAllData() {
    localStorage.clear();
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        transaction.objectStore(this.storeName).clear();
      } catch (err) {}
    }
    state.set('favorites', []);
    this.loadPlaylists();
  }
}

export const storage = new StorageManager();
