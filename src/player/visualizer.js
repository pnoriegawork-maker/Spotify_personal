/**
 * VISUALIZADOR DE ESPECTRO FFT A 60 FPS (WEB AUDIO API + HTML5 CANVAS)
 * Dibuja barras reactivas de audio con estética neón verde Spotify #1DB954
 */

import { audioEngine } from './audioEngine.js';
import { state } from '../core/state.js';

export class SpectrumVisualizer {
  constructor(canvasId = 'visualizer-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.animationId = null;
    this.barCount = 18;
    this.simulatedPhase = 0;

    if (this.canvas) {
      this.start();
    }
  }

  start() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const isPlaying = state.get('isPlaying');

    this.ctx.clearRect(0, 0, width, height);

    const freqData = audioEngine.getFrequencyData();
    const barWidth = (width / this.barCount) - 2;
    const step = Math.floor(freqData.length / this.barCount) || 1;

    this.simulatedPhase += 0.05;

    for (let i = 0; i < this.barCount; i++) {
      let val = 0;

      if (isPlaying && freqData.length > 0) {
        val = freqData[i * step] || 0;
      } else {
        // Onda suave en estado reposo
        val = (Math.sin(this.simulatedPhase + (i * 0.4)) + 1) * 20;
      }

      // Normalizar altura
      const barHeight = Math.max(3, (val / 255) * height);
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      // Gradiente verde Spotify
      const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#10843a');
      gradient.addColorStop(0.6, '#1db954');
      gradient.addColorStop(1, '#1ed760');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      } else {
        this.ctx.rect(x, y, barWidth, barHeight);
      }
      this.ctx.fill();
    }
  }
}
