/**
 * VISTAS PRINCIPALES DE LA APLICACIÓN
 * Renderiza dinámicamente Inicio, Búsqueda Universal, Biblioteca y Laboratorio REA
 */

import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';
import { audioEngine } from '../player/audioEngine.js';
import { createTrackCard, createTrackRow } from './components.js';

export class ViewRenderer {
  constructor() {
    this.homeEl = document.getElementById('view-home');
    this.searchEl = document.getElementById('view-search');
    this.libraryEl = document.getElementById('view-library');
    this.inspectorEl = document.getElementById('view-inspector');
  }

  // Renderizar Vista Inicio (Home)
  renderHome() {
    if (!this.homeEl) return;

    this.homeEl.innerHTML = `
      <div class="hero-banner">
        <div class="hero-content">
          <span class="hero-tag">DISCOGRAFÍA MUNDIAL ILIMITADA & WEB AUDIO API</span>
          <h1 class="hero-title">Spotify Custom Player</h1>
          <p class="hero-desc">
            Acceso universal al material discográfico global de todas las bandas y artistas del mundo. Decodificación de audio a 60 FPS sin restricciones.
          </p>
        </div>
      </div>

      <section class="section-container">
        <div class="section-header">
          <h2 class="section-title">Grandes Éxitos & Leyendas Mundiales</h2>
          <span class="see-all-link">Calidad Máxima 320 kbps</span>
        </div>
        <div class="tracks-grid" id="home-featured-grid"></div>
      </section>

      <section class="section-container">
        <div class="section-header">
          <h2 class="section-title">Recomendados para ti (SpClient Core)</h2>
        </div>
        <div class="tracks-grid" id="home-recommended-grid"></div>
      </section>
    `;

    const featuredGrid = document.getElementById('home-featured-grid');
    const recGrid = document.getElementById('home-recommended-grid');

    const tracks = CONFIG.DEMO_CATALOG;

    tracks.forEach((track) => {
      featuredGrid.appendChild(
        createTrackCard(track, (t) => {
          state.set('queue', tracks);
          const idx = tracks.findIndex(item => item.id === t.id);
          state.set('queueIndex', idx >= 0 ? idx : 0);
          audioEngine.play(t);
        })
      );
    });

    tracks.slice().reverse().forEach((track) => {
      recGrid.appendChild(
        createTrackCard(track, (t) => {
          state.set('queue', tracks);
          const idx = tracks.findIndex(item => item.id === t.id);
          state.set('queueIndex', idx >= 0 ? idx : 0);
          audioEngine.play(t);
        })
      );
    });
  }

  // Renderizar Vista de Búsqueda
  renderSearch(results = []) {
    if (!this.searchEl) return;

    const query = state.get('searchQuery');

    this.searchEl.innerHTML = `
      <div class="search-categories">
        <button class="chip-btn active" data-cat="all">Todos</button>
        <button class="chip-btn" data-cat="tracks">Canciones</button>
        <button class="chip-btn" data-cat="artists">Artistas</button>
        <button class="chip-btn" data-cat="albums">Álbumes</button>
      </div>

      <div class="section-header">
        <h2 class="section-title">
          ${query ? `Resultados para "${query}" (${results.length} temas encontrados)` : 'Explorar Todo el Catálogo Discográfico'}
        </h2>
      </div>

      <div class="tracks-grid" id="search-results-grid"></div>
    `;

    const grid = document.getElementById('search-results-grid');

    if (results.length === 0 && query) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--color-text-sub);">
          <svg style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-text-muted);" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <p style="font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 6px;">Buscando en la discografía mundial...</p>
          <p style="font-size: 13px;">Escribe el nombre de tu banda favorita para cargar su discografía completa.</p>
        </div>
      `;
      return;
    }

    const displayTracks = results.length > 0 ? results : CONFIG.DEMO_CATALOG;

    displayTracks.forEach((track) => {
      grid.appendChild(
        createTrackCard(track, (t) => {
          state.set('queue', displayTracks);
          const idx = displayTracks.findIndex(item => item.id === t.id);
          state.set('queueIndex', idx >= 0 ? idx : 0);
          audioEngine.play(t);
        })
      );
    });
  }

  // Renderizar Vista de Biblioteca
  renderLibrary() {
    if (!this.libraryEl) return;

    const favorites = state.get('favorites') || [];
    const currentTrack = state.get('currentTrack');

    this.libraryEl.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">Tu Colección Local y Favoritos</h2>
        <span class="sub-heading">${favorites.length} PISTAS GUARDADAS</span>
      </div>

      <div class="offline-storage-card">
        <div class="storage-card-icon">💾</div>
        <div class="storage-card-info">
          <div class="storage-card-title">Almacenamiento Local Físico (Modo Sin Conexión)</div>
          <div class="storage-card-desc">
            ${favorites.length > 0 
              ? `Tienes <strong>${favorites.length} canciones descargadas</strong> directamente en la memoria interna de tu dispositivo. Puedes escucharlas sin internet, en modo avión o con señal baja sin cortes.`
              : 'Marca cualquier canción con el icono de corazón (❤️) para descargarla automáticamente en tu teléfono y escucharla sin conexión.'}
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
          <p style="font-size: 13px;">Toca el icono ❤️ en cualquier canción para guardarla físicamente en tu móvil y escucharla en cualquier lugar.</p>
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
              // Re-renderizar si se elimina de la biblioteca
              this.renderLibrary();
            }
          )
        );
      });
    }
  }

  // Renderizar Vista Laboratorio REA (Inspector de Protocolos)
  renderInspector() {
    if (!this.inspectorEl) return;

    const logs = state.get('networkLogs') || [];
    const authState = state.get('auth');

    this.inspectorEl.innerHTML = `
      <div class="inspector-layout">
        <div class="section-header">
          <h2 class="section-title">Laboratorio REA: Inspector de Protocolos y Catálogo Global</h2>
          <span class="badge-tag get">Resolver Activo</span>
        </div>

        <div class="inspector-grid">
          <div class="inspector-panel">
            <h3 class="panel-title">Motor de Búsqueda Discográfica</h3>
            <div class="code-block">
              <strong>Proveedor Primario:</strong> Spotify SpClient & Web API (OAuth PKCE)<br>
              <strong>Resolver Secundario:</strong> Universal Global Music Index (CORS *)<br>
              <strong>Proveedor de Letras:</strong> LRCLIB API (Sincronización milimétrica)<br>
              <strong>Tasa de Cobertura:</strong> Millones de álbumes y artistas mundiales<br>
              <strong>Buffer de Decodificación:</strong> AAC-LC & Ogg Vorbis
            </div>
          </div>

          <div class="inspector-panel">
            <h3 class="panel-title">Pipeline de Audio</h3>
            <div class="code-block">
              <strong>Audio Engine:</strong> Web Audio API + HTML5 Media Source<br>
              <strong>Filtro Biquad:</strong> Graves a 150 Hz (+3.5 dB)<br>
              <strong>Visualizador:</strong> AnalyserNode 64 bandas FFT a 60 FPS<br>
              <strong>Atenuación:</strong> GainNode digital sin clipping
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
                <th>Detalle Técnico</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map((log) => `
                <tr class="track-row">
                  <td style="font-family: var(--font-mono); font-size: 11px;">${log.time}</td>
                  <td><span class="badge-tag ${log.proto.includes('GET') ? 'get' : log.proto.includes('WS') ? 'ws' : 'post'}">${log.proto}</span></td>
                  <td style="font-family: var(--font-mono); font-size: 12px; color: #fff;">${log.endpoint}</td>
                  <td><span style="color: ${log.status === 200 ? 'var(--color-green)' : '#facc15'}; font-weight: bold;">${log.status}</span></td>
                  <td style="color: var(--color-text-sub); font-size: 12px;">${log.note}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

export const viewRenderer = new ViewRenderer();
