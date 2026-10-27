/**
 * COMPONENTES UI REUTILIZABLES
 * Generadores de tarjetas de pistas, filas de listas, modales, toasts e indicadores offline
 */

import { storage } from '../library/storage.js';

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function createTrackCard(track, onPlay, onFavChange) {
  const card = document.createElement('div');
  card.className = 'card-item';
  card.dataset.id = track.id;

  const isFav = storage.isFavorite(track.id);

  card.innerHTML = `
    <div class="card-thumb-wrapper">
      <img src="${track.localCoverUrl || track.coverUrl}" alt="${track.title}" class="card-thumb-img" loading="lazy">
      <button class="floating-play-btn" title="Reproducir">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
      </button>
      <button class="card-fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Guardada sin conexión' : 'Guardar para escuchar sin conexión'}">
        <svg viewBox="0 0 24 24">
          <path fill="currentColor" d="${isFav 
            ? 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' 
            : 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'}"/>
        </svg>
      </button>
    </div>
    <div class="card-title" title="${track.title}">
      ${track.title}
    </div>
    <div class="card-subtitle-row">
      <span class="card-subtitle" title="${track.artist}">${track.artist}</span>
      ${isFav ? '<span class="badge-offline-mini" title="Guardada en memoria local">💾 Offline</span>' : ''}
    </div>
  `;

  card.addEventListener('click', (e) => {
    // Si hizo clic en el botón de favorito, no reproducir
    if (e.target.closest('.card-fav-btn')) return;
    if (onPlay) onPlay(track);
  });

  const favBtn = card.querySelector('.card-fav-btn');
  if (favBtn) {
    favBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const res = await storage.toggleFavorite(track);
      const isNowFav = res.isFav;
      
      favBtn.classList.toggle('active', isNowFav);
      favBtn.querySelector('svg path').setAttribute('d', isNowFav
        ? 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
        : 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
      );

      // Actualizar badge offline mini
      const subRow = card.querySelector('.card-subtitle-row');
      const existingBadge = card.querySelector('.badge-offline-mini');
      if (isNowFav && !existingBadge && subRow) {
        const b = document.createElement('span');
        b.className = 'badge-offline-mini';
        b.title = 'Guardada en memoria local';
        b.textContent = '💾 Offline';
        subRow.appendChild(b);
      } else if (!isNowFav && existingBadge) {
        existingBadge.remove();
      }

      showToast(
        isNowFav
          ? `❤️ "${track.title}" guardada en la memoria del teléfono (Modo Sin Conexión Activo ⬇️)`
          : `"${track.title}" eliminada de tus favoritos`,
        isNowFav ? 'success' : 'info'
      );

      if (onFavChange) onFavChange(isNowFav, track);
    });
  }

  return card;
}

export function createTrackRow(track, index, isActive, onPlay, onFavChange) {
  const tr = document.createElement('tr');
  tr.className = `track-row ${isActive ? 'active' : ''}`;
  tr.dataset.id = track.id;

  const isFav = storage.isFavorite(track.id);

  tr.innerHTML = `
    <td class="track-col-num">${isActive ? '▶' : index + 1}</td>
    <td>
      <div class="track-col-main">
        <img src="${track.localCoverUrl || track.coverUrl}" alt="Thumb" class="track-row-thumb">
        <div class="track-col-info">
          <div class="track-row-title-wrap">
            <span class="track-row-title">${track.title}</span>
            ${isFav ? '<span class="badge-offline-tag" title="Almacenada físicamente en el dispositivo">💾 Sin Conexión</span>' : ''}
          </div>
          <span class="track-row-artist">${track.artist}</span>
        </div>
      </div>
    </td>
    <td class="track-col-album">${track.album || 'Single'}</td>
    <td class="track-col-time">
      <div class="track-row-time-actions">
        <button class="row-fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Eliminar de favoritos' : 'Guardar sin conexión'}">
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="${isFav 
              ? 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' 
              : 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'}"/>
          </svg>
        </button>
        <span>${track.durationFormatted || formatTime(track.duration)}</span>
      </div>
    </td>
  `;

  tr.addEventListener('click', (e) => {
    if (e.target.closest('.row-fav-btn')) return;
    if (onPlay) onPlay(track);
  });

  const rowFavBtn = tr.querySelector('.row-fav-btn');
  if (rowFavBtn) {
    rowFavBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const res = await storage.toggleFavorite(track);
      const isNowFav = res.isFav;

      rowFavBtn.classList.toggle('active', isNowFav);
      rowFavBtn.querySelector('svg path').setAttribute('d', isNowFav
        ? 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
        : 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'
      );

      showToast(
        isNowFav
          ? `❤️ "${track.title}" guardada físicamente sin conexión ⬇️`
          : `"${track.title}" eliminada de tus favoritos`,
        isNowFav ? 'success' : 'info'
      );

      if (onFavChange) onFavChange(isNowFav, track);
    });
  }

  return tr;
}
