/**
 * MÓDULO 3: MOTOR DE AUDIO FLOTANTE Y REPRODUCCIÓN OFFLINE
 * Integra Web Audio API con reproducción inteligente desde almacenamiento interno (IndexedDB)
 * si no hay señal de red o la conexión es inestable.
 */

import { state } from '../core/state.js';
import { storage } from '../library/storage.js';

export class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    this.audioContext = null;
    this.sourceNode = null;
    this.analyser = null;
    this.gainNode = null;
    this.filterNode = null;
    this.isWebAudioInitialized = false;

    this.setupMediaListeners();
  }

  initWebAudio() {
    if (this.isWebAudioInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();

      // Analizador FFT de 64 bandas
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      // Filtro Biquad para realce acústico de frecuencias bajas
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'lowshelf';
      this.filterNode.frequency.setValueAtTime(150, this.audioContext.currentTime);
      this.filterNode.gain.setValueAtTime(3.5, this.audioContext.currentTime);

      // Control de Ganancia
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(state.get('volume'), this.audioContext.currentTime);

      // Conexión del grafo de audio
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.filterNode);
      this.filterNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isWebAudioInitialized = true;
    } catch (err) {
      console.warn('Error al iniciar Web Audio API:', err);
    }
  }

  setupMediaListeners() {
    this.audio.addEventListener('play', () => state.set('isPlaying', true));
    this.audio.addEventListener('pause', () => state.set('isPlaying', false));
    this.audio.addEventListener('timeupdate', () => state.set('currentTime', this.audio.currentTime));
    this.audio.addEventListener('durationchange', () => {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        state.set('duration', this.audio.duration);
      }
    });
    this.audio.addEventListener('ended', () => this.handleTrackEnded());
    this.audio.addEventListener('error', async (e) => {
      console.warn('Error en buffer de audio:', e);
      const current = state.get('currentTrack');
      
      // Si falló y no estábamos usando el blob offline, intentar recuperar desde IndexedDB
      if (current && !this.audio.src.startsWith('blob:')) {
        const offlineUrl = await storage.getAudioUrlForPlayback(current);
        if (offlineUrl && offlineUrl.startsWith('blob:')) {
          this.audio.src = offlineUrl;
          this.audio.load();
          this.audio.play().catch(() => {});
          state.addNetworkLog('device://storage', 'Recuperación Offline', 200, `Rescatada "${current.title}" desde memoria interna tras error de red`);
          return;
        }
      }

      setTimeout(() => this.nextTrack(), 1200);
    });
  }

  // Reproducir pista (Prioriza memoria interna si está descargada o si no hay internet)
  async play(track = null) {
    this.initWebAudio();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (track) {
      state.set('currentTrack', track);

      // OBTENER AUDIO: Verifica si está guardado en la memoria del teléfono
      const effectiveUrl = await storage.getAudioUrlForPlayback(track);

      this.audio.src = effectiveUrl;
      this.audio.load();

      if (effectiveUrl.startsWith('blob:')) {
        state.addNetworkLog('device://storage', 'Modo Offline', 200, `Reproduciendo "${track.title}" 100% sin conexión a internet`);
        state.set('isCurrentTrackOffline', true);
      } else {
        state.addNetworkLog(effectiveUrl, 'Audio Stream', 206, `Streaming remoto de "${track.title}"`);
        state.set('isCurrentTrackOffline', false);
      }
    }

    try {
      await this.audio.play();
      state.set('isPlaying', true);
    } catch (err) {
      console.warn('Playback deferred:', err);
    }
  }

  pause() {
    this.audio.pause();
    state.set('isPlaying', false);
  }

  togglePlay() {
    if (this.audio.paused) {
      if (!this.audio.src || this.audio.src === '') {
        this.play(state.get('currentTrack'));
      } else {
        this.play();
      }
    } else {
      this.pause();
    }
  }

  seekTo(seconds) {
    if (isNaN(seconds) || seconds < 0) return;
    this.audio.currentTime = seconds;
    state.set('currentTime', seconds);
  }

  setVolume(value) {
    const clamped = Math.max(0, Math.min(1, value));
    this.audio.volume = clamped;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    }
    state.set('volume', clamped);
    state.set('isMuted', clamped === 0);
  }

  toggleMute() {
    const isMuted = state.get('isMuted');
    if (isMuted) {
      this.setVolume(state.get('volume') || 0.8);
    } else {
      this.audio.volume = 0;
      if (this.gainNode) this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      state.set('isMuted', true);
    }
  }

  nextTrack() {
    const queue = state.get('queue');
    if (!queue || queue.length === 0) return;

    let index = state.get('queueIndex');
    if (state.get('isShuffle')) {
      index = Math.floor(Math.random() * queue.length);
    } else {
      index = (index + 1) % queue.length;
    }

    state.set('queueIndex', index);
    this.play(queue[index]);
  }

  prevTrack() {
    if (this.audio.currentTime > 3) {
      this.seekTo(0);
      return;
    }
    const queue = state.get('queue');
    if (!queue || queue.length === 0) return;

    let index = state.get('queueIndex');
    index = (index - 1 + queue.length) % queue.length;

    state.set('queueIndex', index);
    this.play(queue[index]);
  }

  handleTrackEnded() {
    const repeatMode = state.get('repeatMode');
    if (repeatMode === 'one') {
      this.seekTo(0);
      this.play();
    } else if (repeatMode === 'all') {
      this.nextTrack();
    } else {
      const index = state.get('queueIndex');
      const queue = state.get('queue');
      if (index < queue.length - 1) this.nextTrack();
      else {
        this.pause();
        this.seekTo(0);
      }
    }
  }

  toggleShuffle() {
    state.set('isShuffle', !state.get('isShuffle'));
  }

  cycleRepeatMode() {
    const current = state.get('repeatMode');
    const nextMode = current === 'all' ? 'one' : current === 'one' ? 'none' : 'all';
    state.set('repeatMode', nextMode);
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const audioEngine = new AudioEngine();
