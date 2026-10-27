/**
 * COMPONENTES UI REUTILIZABLES
 * Generadores de tarjetas de pistas, filas de listas, modales y toasts
 */

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function showToast(message, type = 'info', duration = 3000) {
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

export function createTrackCard(track, onPlay) {
  const card = document.createElement('div');
  card.className = 'card-item';
  card.dataset.id = track.id;

  card.innerHTML = `
    <div class="card-thumb-wrapper">
      <img src="${track.coverUrl}" alt="${track.title}" class="card-thumb-img" loading="lazy">
      <button class="floating-play-btn" title="Reproducir">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <div class="card-title" title="${track.title}">${track.title}</div>
    <div class="card-subtitle" title="${track.artist}">${track.artist}</div>
  `;

  card.addEventListener('click', () => {
    if (onPlay) onPlay(track);
  });

  return card;
}

export function createTrackRow(track, index, isActive, onPlay) {
  const tr = document.createElement('tr');
  tr.className = `track-row ${isActive ? 'active' : ''}`;
  tr.dataset.id = track.id;

  tr.innerHTML = `
    <td class="track-col-num">${isActive ? '▶' : index + 1}</td>
    <td>
      <div class="track-col-main">
        <img src="${track.coverUrl}" alt="Thumb" class="track-row-thumb">
        <div class="track-col-info">
          <span class="track-row-title">${track.title}</span>
          <span class="track-row-artist">${track.artist}</span>
        </div>
      </div>
    </td>
    <td class="track-col-album">${track.album || 'Single'}</td>
    <td class="track-col-time">${track.durationFormatted || formatTime(track.duration)}</td>
  `;

  tr.addEventListener('click', () => {
    if (onPlay) onPlay(track);
  });

  return tr;
}
