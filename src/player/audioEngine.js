/**
 * MÓDULO 3: MOTOR DE AUDIO FLOTANTE Y WEB AUDIO API (STREAM ENGINE)
 * Integra HTML5 Audio con cadena de procesamiento de nodos de Web Audio API:
 * MediaElementSource -> BiquadFilter (Equalizer) -> AnalyserNode (FFT) -> GainNode (Volume) -> Destination
 */

import { state } from '../core/state.js';

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

  // Inicialización de la cadena Web Audio API (requiere interacción de usuario por políticas de navegador)
  initWebAudio() {
    if (this.isWebAudioInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.warn('Web Audio API no soportada en este entorno, operando con HTML5 Audio básico');
        return;
      }

      this.audioContext = new AudioCtx();

      // 1. Analizador Espectral FFT
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      // 2. Filtro Biquad para realce de graves (Sub-Bass boost)
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'lowshelf';
      this.filterNode.frequency.setValueAtTime(150, this.audioContext.currentTime);
      this.filterNode.gain.setValueAtTime(3.5, this.audioContext.currentTime); // +3.5dB cálido

      // 3. Control de Ganancia
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(state.get('volume'), this.audioContext.currentTime);

      // Conectar elemento de audio
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.filterNode);
      this.filterNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isWebAudioInitialized = true;
      state.addNetworkLog('webaudio://context', 'Audio Pipeline', 200, 'Cadena Web Audio API configurada (FFT 64 bandas + EQ)');
    } catch (err) {
      console.warn('No se pudo inicializar Web Audio API:', err);
    }
  }

  // Configuración de listeners del elemento HTML5 Audio
  setupMediaListeners() {
    this.audio.addEventListener('play', () => {
      state.set('isPlaying', true);
    });

    this.audio.addEventListener('pause', () => {
      state.set('isPlaying', false);
    });

    this.audio.addEventListener('timeupdate', () => {
      state.set('currentTime', this.audio.currentTime);
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        state.set('duration', this.audio.duration);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Error de carga de audio:', e);
      state.addNetworkLog(this.audio.src, 'Audio Error', 404, 'Stream inaccesible, saltando a siguiente pista');
      setTimeout(() => this.nextTrack(), 1000);
    });
  }

  // Reproducir pista especificada o reanudar actual
  async play(track = null) {
    this.initWebAudio();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (track) {
      state.set('currentTrack', track);
      this.audio.src = track.audioUrl;
      this.audio.load();
      state.addNetworkLog(track.audioUrl, 'Audio Stream', 206, `Cargando buffer de ${track.title}`);
    }

    try {
      await this.audio.play();
      state.set('isPlaying', true);
    } catch (err) {
      console.warn('Reproducción diferida:', err);
    }
  }

  // Pausar
  pause() {
    this.audio.pause();
    state.set('isPlaying', false);
  }

  // Alternar Play / Pause
  togglePlay() {
    if (this.audio.paused) {
      if (!this.audio.src || this.audio.src === '') {
        const current = state.get('currentTrack');
        this.play(current);
      } else {
        this.play();
      }
    } else {
      this.pause();
    }
  }

  // Desplazar reproducción a un segundo específico
  seekTo(seconds) {
    if (isNaN(seconds) || seconds < 0) return;
    this.audio.currentTime = seconds;
    state.set('currentTime', seconds);
  }

  // Ajustar volumen (0.0 a 1.0)
  setVolume(value) {
    const clamped = Math.max(0, Math.min(1, value));
    this.audio.volume = clamped;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime);
    }
    state.set('volume', clamped);
    state.set('isMuted', clamped === 0);
  }

  // Alternar silencio
  toggleMute() {
    const isMuted = state.get('isMuted');
    if (isMuted) {
      this.setVolume(state.get('volume') || 0.8);
      state.set('isMuted', false);
    } else {
      this.audio.volume = 0;
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      }
      state.set('isMuted', true);
    }
  }

  // Pista siguiente
  nextTrack() {
    const queue = state.get('queue');
    if (!queue || queue.length === 0) return;

    let index = state.get('queueIndex');
    const isShuffle = state.get('isShuffle');

    if (isShuffle) {
      index = Math.floor(Math.random() * queue.length);
    } else {
      index = (index + 1) % queue.length;
    }

    state.set('queueIndex', index);
    this.play(queue[index]);
  }

  // Pista anterior
  prevTrack() {
    // Si ya lleva más de 3 segundos, reiniciar la pista actual
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

  // Gestión de finalización de pista según modo de repetición
  handleTrackEnded() {
    const repeatMode = state.get('repeatMode');

    if (repeatMode === 'one') {
      this.seekTo(0);
      this.play();
    } else if (repeatMode === 'all') {
      this.nextTrack();
    } else {
      // 'none'
      const index = state.get('queueIndex');
      const queue = state.get('queue');
      if (index < queue.length - 1) {
        this.nextTrack();
      } else {
        this.pause();
        this.seekTo(0);
      }
    }
  }

  // Alternar modo aleatorio (Shuffle)
  toggleShuffle() {
    const nextState = !state.get('isShuffle');
    state.set('isShuffle', nextState);
  }

  // Alternar repetición (none -> all -> one -> none)
  cycleRepeatMode() {
    const current = state.get('repeatMode');
    let nextMode = 'all';
    if (current === 'all') nextMode = 'one';
    else if (current === 'one') nextMode = 'none';
    else nextMode = 'all';

    state.set('repeatMode', nextMode);
  }

  // Obtener datos de frecuencia FFT para el visualizador
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const audioEngine = new AudioEngine();
