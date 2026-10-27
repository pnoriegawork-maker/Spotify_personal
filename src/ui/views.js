/**
 * VISTAS PRINCIPALES DE LA APLICACIÓN
 * Renderiza dinámicamente Inicio, Búsqueda Universal Categorizada (Canciones, Artistas, Álbumes),
 * Perfil de Artista, Detalle de Álbum, Biblioteca y Laboratorio REA
 */

import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';
import { spotifyApi } from '../api/spotifyApi.js';
import { audioEngine } from '../player/audioEngine.js';
import { 
  createTrackCard, 
  createTrackRow, 
  createArtistCard, 
  createAlbumCard, 
  showToast 
} from './components.js';

export class ViewRenderer {
  constructor() {
    this.homeEl = document.getElementById('view-home');
    this.searchEl = document.getElementById('view-search');
    this.libraryEl = document.getElementById('view-library');
    this.inspectorEl = document.getElementById('view-inspector');
  }

  extractArtistsFromCatalog(catalog) {
    const map = new Map();
    catalog.forEach((t) => {
      if (t.artist && !map.has(t.artist)) {
        map.set(t.artist, {
          id: `artist-${t.artist.toLowerCase().replace(/\s+/g, '-')}`,
          name: t.artist,
          avatarUrl: t.coverUrl,
          genre: t.genre || 'Rock'
        });
      }
    });
    return Array.from(map.values());
  }

  extractAlbumsFromCatalog(catalog) {
    const map = new Map();
    catalog.forEach((t) => {
      if (t.album && !map.has(t.album)) {
        map.set(t.album, {
          id: `album-${t.album.toLowerCase().replace(/\s+/g, '-')}`,
          title: t.album,
          artist: t.artist,
          coverUrl: t.coverUrl,
          year: t.year || 2024,
          trackCount: 1
        });
      }
    });
    return Array.from(map.values());
  }

  // Renderizar Vista Inicio (Home)
  renderHome() {
    if (!this.homeEl) return;

    this.homeEl.innerHTML = `
      <div class="hero-banner">
        <div class="hero-content">
          <span class="hero-tag">DISCOGRAFÍA MUNDIAL COMPLETA & REA AUDIO ENGINE 320 KBPS</span>
          <h1 class="hero-title">Spotify Custom Player</h1>
          <p class="hero-desc">
            Acceso libre a canciones completas sin restricciones de 30 segundos. Guarda tus temas favoritos en la memoria del dispositivo y escúchalos sin conexión o en modo avión.
          </p>
        </div>
      </div>

      <section class="section-container">
        <div class="section-header">
          <h2 class="section-title">Grandes Éxitos & Leyendas Mundiales</h2>
          <span class="see-all-link">Pistas Completas 320 kbps</span>
        </div>
        <div class="tracks-grid" id="home-featured-grid"></div>
      </section>

      <section class="section-container">
        <div class="section-header">
          <h2 class="section-title">Artistas Destacados</h2>
        </div>
        <div class="tracks-grid" id="home-artists-grid"></div>
      </section>

      <section class="section-container">
        <div class="section-header">
          <h2 class="section-title">Recomendados para ti (SpClient Core)</h2>
        </div>
        <div class="tracks-grid" id="home-recommended-grid"></div>
      </section>
    `;

    const featuredGrid = document.getElementById('home-featured-grid');
    const artistsGrid = document.getElementById('home-artists-grid');
    const recGrid = document.getElementById('home-recommended-grid');

    const tracks = CONFIG.DEMO_CATALOG;
    const artists = this.extractArtistsFromCatalog(tracks);

    tracks.forEach((track) => {
      featuredGrid.appendChild(
        createTrackCard(
          track,
          (t) => {
            state.set('queue', tracks);
            const idx = tracks.findIndex((item) => item.id === t.id);
            state.set('queueIndex', idx >= 0 ? idx : 0);
            audioEngine.play(t);
          },
          null,
          (artName) => this.renderArtistDetail(artName),
          (albName) => this.renderAlbumDetail(albName, { title: albName, artist: track.artist })
        )
      );
    });

    artists.forEach((art) => {
      artistsGrid.appendChild(
        createArtistCard(art, (name, obj) => {
          this.renderArtistDetail(name, obj);
        })
      );
    });

    tracks.slice().reverse().forEach((track) => {
      recGrid.appendChild(
        createTrackCard(
          track,
          (t) => {
            state.set('queue', tracks);
            const idx = tracks.findIndex((item) => item.id === t.id);
            state.set('queueIndex', idx >= 0 ? idx : 0);
            audioEngine.play(t);
          },
          null,
          (artName) => this.renderArtistDetail(artName),
          (albName) => this.renderAlbumDetail(albName, { title: albName, artist: track.artist })
        )
      );
    });
  }

  // Renderizar Vista de Búsqueda con selector de categorías funcional
  renderSearch(results = [], activeCat = 'all') {
    if (!this.searchEl) return;

    let tracks = [];
    let artists = [];
    let albums = [];

    if (Array.isArray(results)) {
      tracks = results;
      const artistMap = new Map();
      const albumMap = new Map();
      tracks.forEach((t) => {
        if (t.artist && !artistMap.has(t.artist)) {
          artistMap.set(t.artist, {
            id: `artist-${t.artist.toLowerCase().replace(/\s+/g, '-')}`,
            name: t.artist,
            avatarUrl: t.coverUrl,
            genre: t.genre || 'Rock'
          });
        }
        if (t.album && !albumMap.has(t.album)) {
          albumMap.set(t.album, {
            id: `album-${t.album.toLowerCase().replace(/\s+/g, '-')}`,
            title: t.album,
            artist: t.artist,
            coverUrl: t.coverUrl,
            year: t.year || 2024
          });
        }
      });
      artists = Array.from(artistMap.values());
      albums = Array.from(albumMap.values());
    } else if (results && typeof results === 'object') {
      tracks = results.tracks || [];
      artists = results.artists || [];
      albums = results.albums || [];
    }

    const query = state.get('searchQuery');
    const displayTracks = tracks.length > 0 ? tracks : CONFIG.DEMO_CATALOG;
    const displayArtists = artists.length > 0 ? artists : this.extractArtistsFromCatalog(CONFIG.DEMO_CATALOG);
    const displayAlbums = albums.length > 0 ? albums : this.extractAlbumsFromCatalog(CONFIG.DEMO_CATALOG);

    this.searchEl.innerHTML = `
      <div class="search-categories">
        <button class="chip-btn ${activeCat === 'all' ? 'active' : ''}" data-cat="all">Todos</button>
        <button class="chip-btn ${activeCat === 'tracks' ? 'active' : ''}" data-cat="tracks">Canciones (${displayTracks.length})</button>
        <button class="chip-btn ${activeCat === 'artists' ? 'active' : ''}" data-cat="artists">Artistas (${displayArtists.length})</button>
        <button class="chip-btn ${activeCat === 'albums' ? 'active' : ''}" data-cat="albums">Álbumes (${displayAlbums.length})</button>
      </div>

      <div class="section-header">
        <h2 class="section-title">
          ${query ? `Resultados para "${query}"` : 'Explorar Todo el Catálogo Discográfico'}
        </h2>
      </div>

      <div id="search-content-area"></div>
    `;

    // Vincular selectores de categorías (Todos, Canciones, Artistas, Álbumes)
    this.searchEl.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-cat');
        this.renderSearch(results, cat);
      });
    });

    const contentArea = document.getElementById('search-content-area');

    if (activeCat === 'all') {
      // 1. Sección Canciones
      const trackSection = document.createElement('section');
      trackSection.className = 'section-container';
      trackSection.innerHTML = `
        <div class="section-header">
          <h3 class="section-title" style="font-size: 18px;">Canciones</h3>
          <span class="see-all-link" id="see-all-tracks" style="cursor: pointer; color: #1DB954;">Ver todas (${displayTracks.length})</span>
        </div>
        <div class="tracks-grid" id="search-tracks-grid"></div>
      `;
      contentArea.appendChild(trackSection);
      trackSection.querySelector('#see-all-tracks')?.addEventListener('click', () => {
        this.renderSearch(results, 'tracks');
      });

      const trackGrid = trackSection.querySelector('#search-tracks-grid');
      displayTracks.slice(0, 8).forEach((t) => {
        trackGrid.appendChild(
          createTrackCard(
            t,
            (track) => {
              state.set('queue', displayTracks);
              const idx = displayTracks.findIndex((item) => item.id === track.id);
              state.set('queueIndex', idx >= 0 ? idx : 0);
              audioEngine.play(track);
            },
            null,
            (art) => this.renderArtistDetail(art),
            (alb) => this.renderAlbumDetail(alb, { title: alb, artist: t.artist })
          )
        );
      });

      // 2. Sección Artistas
      if (displayArtists.length > 0) {
        const artistSection = document.createElement('section');
        artistSection.className = 'section-container';
        artistSection.innerHTML = `
          <div class="section-header">
            <h3 class="section-title" style="font-size: 18px;">Artistas</h3>
            <span class="see-all-link" id="see-all-artists" style="cursor: pointer; color: #1DB954;">Ver todos (${displayArtists.length})</span>
          </div>
          <div class="tracks-grid" id="search-artists-grid"></div>
        `;
        contentArea.appendChild(artistSection);
        artistSection.querySelector('#see-all-artists')?.addEventListener('click', () => {
          this.renderSearch(results, 'artists');
        });

        const artistGrid = artistSection.querySelector('#search-artists-grid');
        displayArtists.slice(0, 6).forEach((a) => {
          artistGrid.appendChild(
            createArtistCard(a, (name, obj) => {
              this.renderArtistDetail(name, obj);
            })
          );
        });
      }

      // 3. Sección Álbumes
      if (displayAlbums.length > 0) {
        const albumSection = document.createElement('section');
        albumSection.className = 'section-container';
        albumSection.innerHTML = `
          <div class="section-header">
            <h3 class="section-title" style="font-size: 18px;">Álbumes</h3>
            <span class="see-all-link" id="see-all-albums" style="cursor: pointer; color: #1DB954;">Ver todos (${displayAlbums.length})</span>
          </div>
          <div class="tracks-grid" id="search-albums-grid"></div>
        `;
        contentArea.appendChild(albumSection);
        albumSection.querySelector('#see-all-albums')?.addEventListener('click', () => {
          this.renderSearch(results, 'albums');
        });

        const albumGrid = albumSection.querySelector('#search-albums-grid');
        displayAlbums.slice(0, 6).forEach((alb) => {
          albumGrid.appendChild(
            createAlbumCard(alb, (title, obj) => {
              this.renderAlbumDetail(title, obj);
            })
          );
        });
      }
    } else if (activeCat === 'tracks') {
      const trackGrid = document.createElement('div');
      trackGrid.className = 'tracks-grid';
      displayTracks.forEach((t) => {
        trackGrid.appendChild(
          createTrackCard(
            t,
            (track) => {
              state.set('queue', displayTracks);
              const idx = displayTracks.findIndex((item) => item.id === track.id);
              state.set('queueIndex', idx >= 0 ? idx : 0);
              audioEngine.play(track);
            },
            null,
            (art) => this.renderArtistDetail(art),
            (alb) => this.renderAlbumDetail(alb, { title: alb, artist: t.artist })
          )
        );
      });
      contentArea.appendChild(trackGrid);
    } else if (activeCat === 'artists') {
      const artistGrid = document.createElement('div');
      artistGrid.className = 'tracks-grid';
      displayArtists.forEach((a) => {
        artistGrid.appendChild(
          createArtistCard(a, (name, obj) => {
            this.renderArtistDetail(name, obj);
          })
        );
      });
      contentArea.appendChild(artistGrid);
    } else if (activeCat === 'albums') {
      const albumGrid = document.createElement('div');
      albumGrid.className = 'tracks-grid';
      displayAlbums.forEach((alb) => {
        albumGrid.appendChild(
          createAlbumCard(alb, (title, obj) => {
            this.renderAlbumDetail(title, obj);
          })
        );
      });
      contentArea.appendChild(albumGrid);
    }
  }

  // Renderizar Vista Detallada de Artista
  async renderArtistDetail(artistName, artistObj = null) {
    if (!this.searchEl) return;

    // Asegurar que la vista activa sea search para visualizar
    state.set('activeView', 'search');
    document.querySelectorAll('.page-view').forEach((el) => el.classList.remove('active'));
    this.searchEl.classList.add('active');

    this.searchEl.innerHTML = `
      <div class="detail-container">
        <button class="btn-back-view" id="btn-back-to-search">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Volver
        </button>
        <div style="padding: 60px 20px; text-align: center; color: var(--color-text-sub);">
          <div class="spinner-circle" style="width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #1DB954; border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite;"></div>
          <p style="font-size: 15px; font-weight: 600; color: #fff;">Explorando discografía de <strong>${artistName}</strong>...</p>
        </div>
      </div>
    `;

    document.getElementById('btn-back-to-search')?.addEventListener('click', () => {
      this.renderSearch(state.get('searchResults') || []);
    });

    const artistId = artistObj?.artistId || null;
    const data = await spotifyApi.getArtistDetails(artistId, artistName);
    const { artist, topTracks, albums } = data;

    this.searchEl.innerHTML = `
      <div class="detail-container">
        <button class="btn-back-view" id="btn-back-to-search">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Volver a la búsqueda
        </button>

        <div class="artist-hero-banner">
          <img 
            src="${artist.avatarUrl}" 
            alt="${artist.name}" 
            class="artist-hero-avatar"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80';"
          >
          <div class="artist-hero-meta">
            <span class="badge-tag get">Artista Verificado</span>
            <h1 class="artist-hero-name">${artist.name}</h1>
            <p class="artist-hero-genre">${artist.genre} • Discografía Global</p>
            <div class="detail-actions">
              <button class="btn-primary" id="btn-play-artist-all">
                <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; margin-right: 6px;"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                Reproducir Discografía Completa
              </button>
            </div>
          </div>
        </div>

        <section class="section-container">
          <div class="section-header">
            <h2 class="section-title">Canciones de ${artist.name}</h2>
            <span class="sub-heading">${topTracks.length} PISTAS COMPLETAS</span>
          </div>
          <table class="tracklist-table">
            <thead>
              <tr class="tracklist-header">
                <th>#</th>
                <th>Título</th>
                <th>Álbum</th>
                <th style="text-align: right;">Duración</th>
              </tr>
            </thead>
            <tbody id="artist-tracks-table"></tbody>
          </table>
        </section>

        ${
          albums.length > 0
            ? `
          <section class="section-container">
            <div class="section-header">
              <h2 class="section-title">Álbumes y Discografía</h2>
              <span class="sub-heading">${albums.length} ÁLBUMES</span>
            </div>
            <div class="tracks-grid" id="artist-albums-grid"></div>
          </section>
        `
            : ''
        }
      </div>
    `;

    document.getElementById('btn-back-to-search')?.addEventListener('click', () => {
      this.renderSearch(state.get('searchResults') || []);
    });

    document.getElementById('btn-play-artist-all')?.addEventListener('click', () => {
      if (topTracks.length > 0) {
        state.set('queue', topTracks);
        state.set('queueIndex', 0);
        audioEngine.play(topTracks[0]);
        showToast(`Reproduciendo discografía completa de ${artist.name}`, 'success');
      }
    });

    const tbody = document.getElementById('artist-tracks-table');
    if (tbody) {
      topTracks.forEach((t, idx) => {
        tbody.appendChild(
          createTrackRow(
            t,
            idx,
            state.get('currentTrack')?.id === t.id,
            (track) => {
              state.set('queue', topTracks);
              state.set('queueIndex', idx);
              audioEngine.play(track);
            },
            null,
            (art) => this.renderArtistDetail(art),
            (alb) => this.renderAlbumDetail(alb, { title: alb, artist: t.artist })
          )
        );
      });
    }

    const albGrid = document.getElementById('artist-albums-grid');
    if (albGrid) {
      albums.forEach((alb) => {
        albGrid.appendChild(
          createAlbumCard(alb, (title, obj) => {
            this.renderAlbumDetail(title, obj);
          })
        );
      });
    }
  }

  // Renderizar Vista Detallada de Álbum
  async renderAlbumDetail(albumTitle, albumObj = null) {
    if (!this.searchEl) return;

    state.set('activeView', 'search');
    document.querySelectorAll('.page-view').forEach((el) => el.classList.remove('active'));
    this.searchEl.classList.add('active');

    this.searchEl.innerHTML = `
      <div class="detail-container">
        <button class="btn-back-view" id="btn-back-to-search">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Volver
        </button>
        <div style="padding: 60px 20px; text-align: center; color: var(--color-text-sub);">
          <div class="spinner-circle" style="width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #1DB954; border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite;"></div>
          <p style="font-size: 15px; font-weight: 600; color: #fff;">Cargando álbum <strong>${albumTitle}</strong>...</p>
        </div>
      </div>
    `;

    document.getElementById('btn-back-to-search')?.addEventListener('click', () => {
      this.renderSearch(state.get('searchResults') || []);
    });

    const collectionId = albumObj?.collectionId || null;
    const artistName = albumObj?.artist || '';
    const data = await spotifyApi.getAlbumDetails(collectionId, albumTitle, artistName);
    const { album, tracks } = data;

    this.searchEl.innerHTML = `
      <div class="detail-container">
        <button class="btn-back-view" id="btn-back-to-search">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Volver a la búsqueda
        </button>

        <div class="album-hero-banner">
          <img 
            src="${album.coverUrl}" 
            alt="${album.title}" 
            class="album-hero-cover"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';"
          >
          <div class="album-hero-meta">
            <span class="badge-tag get">Álbum Discográfico</span>
            <h1 class="album-hero-title">${album.title}</h1>
            <p class="album-hero-artist">
              Por <strong class="clickable-artist" style="color: #1DB954; cursor: pointer;">${album.artist}</strong> • ${album.year || 2024} • ${tracks.length} canciones
            </p>
            <div class="detail-actions">
              <button class="btn-primary" id="btn-play-album-all">
                <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; margin-right: 6px;"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                Reproducir Álbum Completo
              </button>
            </div>
          </div>
        </div>

        <section class="section-container">
          <div class="section-header">
            <h2 class="section-title">Lista de Canciones</h2>
            <span class="sub-heading">${tracks.length} TEMAS</span>
          </div>
          <table class="tracklist-table">
            <thead>
              <tr class="tracklist-header">
                <th>#</th>
                <th>Título</th>
                <th>Álbum</th>
                <th style="text-align: right;">Duración</th>
              </tr>
            </thead>
            <tbody id="album-tracks-table"></tbody>
          </table>
        </section>
      </div>
    `;

    document.getElementById('btn-back-to-search')?.addEventListener('click', () => {
      this.renderSearch(state.get('searchResults') || []);
    });

    document.querySelector('.album-hero-artist .clickable-artist')?.addEventListener('click', () => {
      this.renderArtistDetail(album.artist);
    });

    document.getElementById('btn-play-album-all')?.addEventListener('click', () => {
      if (tracks.length > 0) {
        state.set('queue', tracks);
        state.set('queueIndex', 0);
        audioEngine.play(tracks[0]);
        showToast(`Reproduciendo álbum "${album.title}"`, 'success');
      }
    });

    const tbody = document.getElementById('album-tracks-table');
    if (tbody) {
      tracks.forEach((t, idx) => {
        tbody.appendChild(
          createTrackRow(
            t,
            idx,
            state.get('currentTrack')?.id === t.id,
            (track) => {
              state.set('queue', tracks);
              state.set('queueIndex', idx);
              audioEngine.play(track);
            },
            null,
            (art) => this.renderArtistDetail(art),
            null
          )
        );
      });
    }
  }

  // Renderizar Vista de Biblioteca
  renderLibrary() {
    if (!this.libraryEl) return;

    const favorites = state.get('favorites') || [];
    const currentTrack = state.get('currentTrack');

    this.libraryEl.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Tu Colección Local y Favoritos</h2>
        <span class="sub-heading">${favorites.length} PISTAS COMPLETAS GUARDADAS</span>
      </div>

      <div class="offline-storage-card">
        <div class="storage-card-icon">💾</div>
        <div class="storage-card-info">
          <div class="storage-card-title">Almacenamiento Físico Local (Modo Sin Conexión)</div>
          <div class="storage-card-desc">
            ${
              favorites.length > 0
                ? `Tienes <strong>${favorites.length} canciones completas descargadas</strong> en la memoria flash de tu dispositivo. Puedes escucharlas íntegras en modo avión, sin datos o con señal baja sin interrupciones.`
                : 'Marca cualquier canción con el icono de corazón (❤️) para descargarla completa físicamente en tu teléfono o laptop.'
            }
          </div>
        </div>
        <div class="storage-badge-status ${favorites.length > 0 ? 'active' : ''}">
          ${favorites.length > 0 ? '🟢 100% Offline Listo' : '⚪ Sin Descargas'}
        </div>
      </div>

      ${
        favorites.length === 0
          ? `
        <div style="padding: 40px 0; text-align: center; color: var(--color-text-sub);">
          <svg style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-text-muted);" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <p style="font-weight: 600; color: #fff; margin-bottom: 6px;">Aún no tienes canciones guardadas sin conexión</p>
          <p style="font-size: 13px;">Toca el icono ❤️ en cualquier canción completa para almacenarla en el dispositivo y escucharla sin gastar datos.</p>
        </div>
      `
          : `
        <table class="tracklist-table">
          <thead class="tracklist-header">
            <tr>
              <th>#</th>
              <th>Título y Estado</th>
              <th>Álbum</th>
              <th style="text-align: right;">Duración</th>
            </tr>
          </thead>
          <tbody id="library-table-body"></tbody>
        </table>
      `
      }
    `;

    const tbody = document.getElementById('library-table-body');
    if (tbody) {
      favorites.forEach((track, idx) => {
        const isActive = currentTrack && currentTrack.id === track.id;
        tbody.appendChild(
          createTrackRow(
            track,
            idx,
            isActive,
            (t) => {
              state.set('queue', favorites);
              state.set('queueIndex', idx);
              audioEngine.play(t);
            },
            () => {
              this.renderLibrary();
            },
            (art) => this.renderArtistDetail(art),
            (alb) => this.renderAlbumDetail(alb, { title: alb, artist: track.artist })
          )
        );
      });
    }
  }

  // Renderizar Vista Laboratorio REA (Inspector de Protocolos)
  renderInspector() {
    if (!this.inspectorEl) return;

    const logs = state.get('networkLogs') || [];

    this.inspectorEl.innerHTML = `
      <div class="inspector-layout">
        <div class="section-header">
          <h2 class="section-title">Laboratorio REA: Inspector de Protocolos y Catálogo Global</h2>
          <span class="badge-tag get">320 kbps Activo</span>
        </div>

        <div class="inspector-grid">
          <div class="inspector-panel">
            <h3 class="panel-title">Motor de Búsqueda Discográfica</h3>
            <div class="code-block">
              <strong>Proveedor Primario:</strong> JioSaavn 320kbps DES Core (CORS *)<br>
              <strong>Catálogo Global:</strong> Apple / Deezer Discography Index<br>
              <strong>Proveedor de Letras:</strong> LRCLIB API (Sincronización milimétrica)<br>
              <strong>Resolución:</strong> Canciones Completas, Artistas y Álbumes<br>
              <strong>Bitrate de Audio:</strong> 320 kbps AAC/MP4 sin recortes
            </div>
          </div>

          <div class="inspector-panel">
            <h3 class="panel-title">Pipeline Acústico Web Audio API</h3>
            <div class="code-block">
              <strong>Audio Engine:</strong> HTML5 Audio + Web Audio API 60 FPS<br>
              <strong>Filtro Biquad:</strong> Low-shelf a 150 Hz (+3.5 dB)<br>
              <strong>Visualizador:</strong> AnalyserNode 64 bandas FFT en tiempo real<br>
              <strong>Almacenamiento:</strong> IndexedDB (Blobs binarios sin conexión)
            </div>
          </div>
        </div>

        <div class="inspector-panel">
          <h3 class="panel-title">Registro de Peticiones y Handshakes de Red</h3>
          <table class="tracklist-table">
            <thead>
              <tr class="tracklist-header">
                <th>Hora</th>
                <th>Protocolo</th>
                <th>Endpoint</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              ${
                logs.length === 0
                  ? '<tr><td colspan="5" style="text-align: center; color: var(--color-text-sub); padding: 20px;">Sin peticiones registradas aún</td></tr>'
                  : logs
                      .slice(0, 30)
                      .map(
                        (log) => `
                <tr class="track-row">
                  <td style="color: var(--color-text-sub); font-family: monospace;">${log.time}</td>
                  <td><span class="badge-tag get">${log.type}</span></td>
                  <td style="font-family: monospace; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${log.url}</td>
                  <td><span style="color: #1DB954; font-weight: 600;">${log.status}</span></td>
                  <td style="color: var(--color-text-sub); font-size: 12px;">${log.detail || '-'}</td>
                </tr>
              `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

export const viewRenderer = new ViewRenderer();
