/**
 * PUNTO DE ENTRADA PRINCIPAL (MAIN APPLICATION BOOTSTRAP)
 * Orquestador del reproductor, eventos táctiles y de teclado, y enlace reactivo
 */

import { CONFIG } from './core/config.js';
import { state } from './core/state.js';
import { auth } from './api/auth.js';
import { spotifyApi } from './api/spotifyApi.js';
import { audioEngine } from './player/audioEngine.js';
import { SpectrumVisualizer } from './player/visualizer.js';
import { storage } from './library/storage.js';
import { viewRenderer } from './ui/views.js';
import { formatTime, showToast } from './ui/components.js';

class Application {
  constructor() {
    this.visualizer = null;
    this.searchDebounceTimer = null;
  }

  async init() {
    console.log(`Iniciando ${CONFIG.APP_NAME} v${CONFIG.VERSION}...`);

    // 1. Manejar callback de OAuth PKCE si viene redirigido de Spotify
    await auth.handleCallbackIfPresent();

    // 2. Inicializar visualizador de espectro
    this.visualizer = new SpectrumVisualizer('visualizer-canvas');

    // 3. Renderizar vista inicial (Home)
    this.switchView('home');

    // 4. Vincular listeners de UI e interacciones
    this.bindNavigation();
    this.bindPlayerControls();
    this.bindSearch();
    this.bindModals();
    this.bindKeyboardShortcuts();
    this.bindStateObservers();

    // 5. Cargar lista de reproducción lateral
    this.renderSidebarPlaylists();

    // 6. Monitoreo de Red (Detección Offline en Smartphone / Modo Avión)
    this.setupNetworkListeners();

    // 7. Registrar Service Worker para PWA
    this.registerServiceWorker();

    showToast('Bienvenido a Spotify Custom Player (REA Core)', 'success');
  }

  // Monitoreo de conectividad (Modo Online vs Modo Offline para Smartphones)
  setupNetworkListeners() {
    const statusDot = document.getElementById('network-status');
    const offlineBanner = document.getElementById('offline-banner');

    const updateNetwork = () => {
      const isOnline = navigator.onLine;
      if (statusDot) {
        statusDot.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        const text = statusDot.querySelector('.status-text');
        if (text) text.textContent = isOnline ? 'SpClient Live' : 'Modo Offline (Sin Red)';
      }
      if (offlineBanner) {
        offlineBanner.style.display = isOnline ? 'none' : 'flex';
      }
    };

    window.addEventListener('online', () => {
      updateNetwork();
      showToast('🟢 Conexión a internet restablecida', 'success');
    });

    window.addEventListener('offline', () => {
      updateNetwork();
      showToast('📡 Sin conexión a internet. Reproduciendo tus canciones favoritas guardadas en el smartphone 🎧', 'warning', 5000);
    });

    updateNetwork();
  }

  // Registro de PWA Service Worker
  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker PWA registrado'))
        .catch((err) => console.log('SW no registrado (entorno local):', err));
    }
  }

  // Cambio de vista (Home, Search, Library, Inspector)
  switchView(viewName) {
    state.set('activeView', viewName);

    // Ocultar todas las páginas
    document.querySelectorAll('.page-view').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-btn').forEach((el) => el.classList.remove('active'));

    // Activar elemento correspondiente
    const pageEl = document.getElementById(`view-${viewName}`);
    if (pageEl) pageEl.classList.add('active');

    const navBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navBtn) navBtn.classList.add('active');

    const mobileBtn = document.querySelector(`.mobile-nav-btn[data-view="${viewName}"]`);
    if (mobileBtn) mobileBtn.classList.add('active');

    // Renderizar contenido
    if (viewName === 'home') viewRenderer.renderHome();
    else if (viewName === 'search') viewRenderer.renderSearch(state.get('searchResults'));
    else if (viewName === 'library') viewRenderer.renderLibrary();
    else if (viewName === 'inspector') viewRenderer.renderInspector();
  }

  // Enlace de botones de navegación
  bindNavigation() {
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // Botones Atrás / Adelante de la cabecera
    const btnBack = document.getElementById('topbar-btn-back');
    const btnForward = document.getElementById('topbar-btn-forward');
    if (btnBack) btnBack.addEventListener('click', () => history.back());
    if (btnForward) btnForward.addEventListener('click', () => history.forward());

    // Crear Playlist
    const btnCreatePlaylist = document.getElementById('btn-create-playlist');
    if (btnCreatePlaylist) {
      btnCreatePlaylist.addEventListener('click', () => {
        const name = prompt('Nombre de la nueva Playlist:');
        if (name && name.trim()) {
          storage.createPlaylist(name.trim());
          this.renderSidebarPlaylists();
          showToast(`Playlist "${name}" creada`, 'success');
        }
      });
    }
  }

  // Enlace del buscador con debounce y tecla Enter
  bindSearch() {
    const searchInput = document.getElementById('global-search-input');
    const clearBtn = document.getElementById('clear-search-btn');

    const executeSearch = async (query) => {
      if (!query || query.trim() === '') return;
      this.switchView('search');
      showToast(`Buscando discografía de "${query}"...`, 'info', 1500);
      const results = await spotifyApi.search(query);
      state.set('searchResults', results);
      viewRenderer.renderSearch(results);
    };

    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        if (state.get('activeView') !== 'search') {
          this.switchView('search');
          viewRenderer.renderSearch(state.get('searchResults') || []);
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(this.searchDebounceTimer);
          executeSearch(e.target.value);
        }
      });

      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        state.set('searchQuery', query);

        if (clearBtn) clearBtn.style.display = query.length > 0 ? 'block' : 'none';

        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          executeSearch(query);
        }, 400);
      });

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          state.set('searchQuery', '');
          clearBtn.style.display = 'none';
          this.switchView('search');
          viewRenderer.renderSearch([]);
        });
      }
    }
  }

  // Enlace de controles del reproductor
  bindPlayerControls() {
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnRepeat = document.getElementById('btn-repeat');
    const btnFav = document.getElementById('btn-toggle-favorite');

    // Reproducción básica
    if (btnPlayPause) btnPlayPause.addEventListener('click', () => audioEngine.togglePlay());
    if (btnNext) btnNext.addEventListener('click', () => audioEngine.nextTrack());
    if (btnPrev) btnPrev.addEventListener('click', () => audioEngine.prevTrack());
    if (btnShuffle) btnShuffle.addEventListener('click', () => audioEngine.toggleShuffle());
    if (btnRepeat) btnRepeat.addEventListener('click', () => audioEngine.cycleRepeatMode());

    // Favoritos (Descarga y Almacenamiento Offline en Memoria Física del Móvil)
    if (btnFav) {
      btnFav.addEventListener('click', async () => {
        const track = state.get('currentTrack');
        if (!track) return;
        const willBeFav = !storage.isFavorite(track.id);

        showToast(
          willBeFav
            ? `⬇️ Descargando "${track.title}" a la memoria interna...`
            : `"${track.title}" eliminada de favoritos`,
          'info'
        );

        const res = await storage.toggleFavorite(track);
        const isNowFav = res.isFav;
        this.updateFavoriteUI(isNowFav);

        if (isNowFav) {
          showToast(`✅ "${track.title}" guardada. ¡Lista para escuchar sin conexión o en modo avión! 🎧`, 'success', 4000);
        }

        if (state.get('activeView') === 'library') {
          viewRenderer.renderLibrary();
        }
      });
    }

    // Seek Slider (Progreso de la canción)
    const seekTrack = document.getElementById('seek-slider-track');
    if (seekTrack) {
      const handleSeek = (e) => {
        const rect = seekTrack.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const duration = state.get('duration') || 180;
        audioEngine.seekTo(duration * percent);
      };

      seekTrack.addEventListener('click', handleSeek);
    }

    // Volumen
    const volumeTrack = document.getElementById('volume-slider-track');
    const btnVolumeIcon = document.getElementById('btn-volume-icon');

    if (volumeTrack) {
      const handleVolume = (e) => {
        const rect = volumeTrack.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        audioEngine.setVolume(percent);
      };

      volumeTrack.addEventListener('click', handleVolume);
    }

    if (btnVolumeIcon) {
      btnVolumeIcon.addEventListener('click', () => audioEngine.toggleMute());
    }

    // Modal Móvil Full-Screen
    const btnExpandMobile = document.getElementById('btn-expand-mobile');
    const playerCoverContainer = document.getElementById('player-cover-container');
    const mobileModal = document.getElementById('mobile-player-modal');
    const btnCloseMobile = document.getElementById('btn-close-mobile-player');

    const openMobileModal = () => {
      if (window.innerWidth <= 768) {
        mobileModal.classList.add('open');
        this.updateMobileModalData();
      }
    };

    if (btnExpandMobile) btnExpandMobile.addEventListener('click', openMobileModal);
    if (playerCoverContainer) playerCoverContainer.addEventListener('click', openMobileModal);
    if (btnCloseMobile) btnCloseMobile.addEventListener('click', () => mobileModal.classList.remove('open'));

    // Controles táctiles del modal móvil
    const mobileBtnPlay = document.getElementById('mobile-btn-play-pause');
    const mobileBtnNext = document.getElementById('mobile-btn-next');
    const mobileBtnPrev = document.getElementById('mobile-btn-prev');
    const mobileBtnFav = document.getElementById('mobile-btn-favorite');
    const mobileSeek = document.getElementById('mobile-seek-track');

    if (mobileBtnPlay) mobileBtnPlay.addEventListener('click', () => audioEngine.togglePlay());
    if (mobileBtnNext) mobileBtnNext.addEventListener('click', () => audioEngine.nextTrack());
    if (mobileBtnPrev) mobileBtnPrev.addEventListener('click', () => audioEngine.prevTrack());
    if (mobileBtnFav) {
      mobileBtnFav.addEventListener('click', async () => {
        const track = state.get('currentTrack');
        if (!track) return;
        const willBeFav = !storage.isFavorite(track.id);

        showToast(
          willBeFav
            ? `⬇️ Descargando "${track.title}" al smartphone...`
            : `"${track.title}" eliminada de favoritos`,
          'info'
        );

        const res = await storage.toggleFavorite(track);
        const isNowFav = res.isFav;
        this.updateFavoriteUI(isNowFav);

        if (isNowFav) {
          showToast(`✅ "${track.title}" disponible 100% sin internet 🎧`, 'success', 4000);
        }

        if (state.get('activeView') === 'library') {
          viewRenderer.renderLibrary();
        }
      });
    }
    if (mobileSeek) {
      mobileSeek.addEventListener('click', (e) => {
        const rect = mobileSeek.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const duration = state.get('duration') || 180;
        audioEngine.seekTo(duration * percent);
      });
    }
  }

  // Modales de Configuración y Cola
  bindModals() {
    // Configuración
    const btnSettings = document.getElementById('btn-open-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnResetCache = document.getElementById('btn-reset-cache');
    const inputClientId = document.getElementById('input-client-id');
    const btnAuthProfile = document.getElementById('btn-auth-profile');

    if (btnSettings) btnSettings.addEventListener('click', () => modalSettings.classList.add('open'));
    if (btnAuthProfile) btnAuthProfile.addEventListener('click', () => modalSettings.classList.add('open'));
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => modalSettings.classList.remove('open'));

    if (inputClientId) {
      inputClientId.value = localStorage.getItem(CONFIG.STORAGE_KEYS.CLIENT_ID) || CONFIG.DEFAULT_CLIENT_ID;
    }

    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const customId = inputClientId.value.trim();
        if (customId) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.CLIENT_ID, customId);
          auth.clientId = customId;
        }
        modalSettings.classList.remove('open');
        showToast('Configuración guardada correctamente', 'success');
      });
    }

    if (btnResetCache) {
      btnResetCache.addEventListener('click', () => {
        if (confirm('¿Restablecer toda la biblioteca local y la caché de streaming?')) {
          storage.clearAllData();
          modalSettings.classList.remove('open');
          this.renderSidebarPlaylists();
          viewRenderer.renderHome();
          showToast('Caché restablecida', 'info');
        }
      });
    }

    // Cola de Reproducción
    const btnOpenQueue = document.getElementById('btn-open-queue');
    const modalQueue = document.getElementById('modal-queue');
    const btnCloseQueue = document.getElementById('btn-close-queue');

    if (btnOpenQueue) {
      btnOpenQueue.addEventListener('click', () => {
        modalQueue.classList.toggle('open');
        this.renderQueueDrawer();
      });
    }
    if (btnCloseQueue) {
      btnCloseQueue.addEventListener('click', () => modalQueue.classList.remove('open'));
    }
  }

  // Renderizar contenido de la cola en el drawer lateral
  renderQueueDrawer() {
    const container = document.getElementById('queue-list-container');
    if (!container) return;

    const queue = state.get('queue') || [];
    const currentIndex = state.get('queueIndex');

    container.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; color: var(--color-text-sub); margin-bottom: 8px;">EN REPRODUCCIÓN</div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <img src="${queue[currentIndex]?.coverUrl}" style="width: 44px; height: 44px; border-radius: 4px; object-fit: cover;">
        <div>
          <div style="font-weight: 700; color: var(--color-green);">${queue[currentIndex]?.title}</div>
          <div style="font-size: 12px; color: var(--color-text-sub);">${queue[currentIndex]?.artist}</div>
        </div>
      </div>

      <div style="font-size: 11px; font-weight: 700; color: var(--color-text-sub); margin-bottom: 8px;">A CONTINUACIÓN</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${queue.slice(currentIndex + 1).map((t, i) => `
          <div style="display: flex; align-items: center; gap: 10px; padding: 6px; border-radius: 4px; cursor: pointer; background: rgba(255,255,255,0.03);" class="queue-row-item" data-qidx="${currentIndex + 1 + i}">
            <img src="${t.coverUrl}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;">
            <div style="overflow: hidden;">
              <div style="font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.title}</div>
              <div style="font-size: 11px; color: var(--color-text-sub);">${t.artist}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.queue-row-item').forEach((row) => {
      row.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-qidx'), 10);
        state.set('queueIndex', idx);
        audioEngine.play(queue[idx]);
        this.renderQueueDrawer();
      });
    });
  }

  // Atajos de Teclado
  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        audioEngine.togglePlay();
      } else if (e.code === 'ArrowRight') {
        audioEngine.seekTo(state.get('currentTime') + 5);
      } else if (e.code === 'ArrowLeft') {
        audioEngine.seekTo(state.get('currentTime') - 5);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        audioEngine.setVolume(state.get('volume') + 0.05);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        audioEngine.setVolume(state.get('volume') - 0.05);
      } else if (e.code === 'KeyM') {
        audioEngine.toggleMute();
      }
    });
  }

  // Observadores del estado reactivo
  bindStateObservers() {
    // 1. Cambio de pista actual
    state.subscribe('currentTrack', (track) => {
      this.updateTrackInfoUI(track);
      this.updateMobileModalData();
    });

    // 2. Play / Pause
    state.subscribe('isPlaying', (isPlaying) => {
      this.updatePlayPauseUI(isPlaying);
    });

    // 3. Tiempo y Progreso
    state.subscribe('currentTime', (currentTime) => {
      this.updateProgressUI(currentTime, state.get('duration'));
    });

    // 4. Duración
    state.subscribe('duration', (duration) => {
      const timeDur = document.getElementById('time-duration');
      if (timeDur) timeDur.textContent = formatTime(duration);
    });

    // 5. Volumen
    state.subscribe('volume', (vol) => {
      const volFill = document.getElementById('volume-progress');
      const volThumb = document.getElementById('volume-thumb');
      if (volFill) volFill.style.width = `${vol * 100}%`;
      if (volThumb) volThumb.style.left = `${vol * 100}%`;
    });

    // 6. Aleatorio y Repetición
    state.subscribe('isShuffle', (isShuffle) => {
      const btnShuffle = document.getElementById('btn-shuffle');
      if (btnShuffle) btnShuffle.classList.toggle('active', isShuffle);
    });

    state.subscribe('repeatMode', (mode) => {
      const btnRepeat = document.getElementById('btn-repeat');
      if (btnRepeat) btnRepeat.classList.toggle('active', mode !== 'none');
    });

    // 7. Actualización de Logs en tiempo real en Inspector
    state.subscribe('networkLogs', () => {
      if (state.get('activeView') === 'inspector') {
        viewRenderer.renderInspector();
      }
    });
  }

  // Actualizar datos de pista en el footer
  updateTrackInfoUI(track) {
    if (!track) return;
    const nameEl = document.getElementById('player-track-name');
    const artistEl = document.getElementById('player-artist-name');
    const coverEl = document.getElementById('player-cover-art');

    if (nameEl) nameEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
    if (coverEl) coverEl.src = track.coverUrl;

    const isFav = storage.isFavorite(track.id);
    this.updateFavoriteUI(isFav);
  }

  // Actualizar icono Play / Pause
  updatePlayPauseUI(isPlaying) {
    const icon = document.getElementById('play-pause-icon');
    const mobilePlay = document.querySelector('#mobile-btn-play-pause svg');

    const playSvg = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
    const pauseSvg = '<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

    if (icon) icon.innerHTML = isPlaying ? pauseSvg : playSvg;
    if (mobilePlay) mobilePlay.innerHTML = isPlaying ? pauseSvg : playSvg;
  }

  // Actualizar barra de progreso y etiquetas de tiempo
  updateProgressUI(currentTime, duration) {
    const timeCurr = document.getElementById('time-current');
    const seekFill = document.getElementById('seek-progress');
    const seekThumb = document.getElementById('seek-thumb');

    const mobileCurr = document.getElementById('mobile-time-current');
    const mobileDur = document.getElementById('mobile-time-duration');
    const mobileFill = document.getElementById('mobile-seek-fill');

    if (timeCurr) timeCurr.textContent = formatTime(currentTime);

    const safeDuration = duration > 0 ? duration : 180;
    const percent = Math.min(100, (currentTime / safeDuration) * 100);

    if (seekFill) seekFill.style.width = `${percent}%`;
    if (seekThumb) seekThumb.style.left = `${percent}%`;

    if (mobileCurr) mobileCurr.textContent = formatTime(currentTime);
    if (mobileDur) mobileDur.textContent = formatTime(safeDuration);
    if (mobileFill) mobileFill.style.width = `${percent}%`;
  }

  // Actualizar estado del botón Me Gusta (Corazón)
  updateFavoriteUI(isFav) {
    const favBtn = document.getElementById('btn-toggle-favorite');
    const mobileFavBtn = document.getElementById('mobile-btn-favorite');

    const filledHeart = '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';
    const outlineHeart = '<path fill="currentColor" d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>';

    if (favBtn) {
      favBtn.classList.toggle('active', isFav);
      favBtn.querySelector('svg').innerHTML = isFav ? filledHeart : outlineHeart;
    }
    if (mobileFavBtn) {
      mobileFavBtn.classList.toggle('active', isFav);
      mobileFavBtn.querySelector('svg').innerHTML = isFav ? filledHeart : outlineHeart;
    }
  }

  // Actualizar datos del modal expandido móvil
  async updateMobileModalData() {
    const track = state.get('currentTrack');
    if (!track) return;

    const cover = document.getElementById('mobile-large-cover');
    const title = document.getElementById('mobile-track-title');
    const artist = document.getElementById('mobile-track-artist');
    const lyricsSnippet = document.getElementById('mobile-lyrics-text');

    if (cover) cover.src = track.coverUrl;
    if (title) title.textContent = track.title;
    if (artist) artist.textContent = track.artist;

    if (lyricsSnippet) {
      const rawLyrics = await spotifyApi.getLyrics(track.id);
      const parsed = spotifyApi.parseLrc(rawLyrics);
      if (parsed.length > 0) {
        lyricsSnippet.textContent = parsed[0].text || parsed[1]?.text || 'Lírica sincronizada con SpClient';
      }
    }
  }

  // Renderizar playlists creadas en el sidebar
  renderSidebarPlaylists() {
    const container = document.getElementById('sidebar-playlists');
    if (!container) return;

    const playlists = state.get('customPlaylists') || [];

    container.innerHTML = playlists.map((pl) => `
      <div class="playlist-link" data-plid="${pl.id}">
        <div class="playlist-thumb-icon">🎵</div>
        <span>${pl.name}</span>
      </div>
    `).join('');

    container.querySelectorAll('.playlist-link').forEach((el) => {
      el.addEventListener('click', () => {
        this.switchView('library');
      });
    });
  }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.init();
});
