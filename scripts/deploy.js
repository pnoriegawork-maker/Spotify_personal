/**
 * SCRIPT AUTÓNOMO DE DESPLIEGUE A GITHUB PAGES
 * Ejecuta: npm run deploy:pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando compilación y despliegue a GitHub Pages...');

// 1. Compilar frontend de producción
console.log('📦 Compilando frontend...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Obtener Token de despliegue desde .env.local o entorno
let token = process.env.GH_TOKEN;
const envPath = path.join(__dirname, '..', '.env.local');

if (!token && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GH_TOKEN=(.+)/);
  if (match) token = match[1].trim();
}

if (!token) {
  console.error('❌ Error: No se encontró GH_TOKEN en el entorno ni en .env.local');
  process.exit(1);
}

const remoteUrl = `https://pnoriegawork-maker:${token}@github.com/pnoriegawork-maker/Spotify_personal.git`;
const distPath = path.join(__dirname, '..', 'dist');

console.log('🌐 Desplegando en la rama gh-pages...');
execSync('git init', { cwd: distPath, stdio: 'inherit' });
execSync('git config user.name "pnoriegawork-maker"', { cwd: distPath });
execSync('git config user.email "pnoriegawork-maker@users.noreply.github.com"', { cwd: distPath });
execSync('git add -A', { cwd: distPath, stdio: 'inherit' });
execSync('git commit -m "deploy: update pwa build"', { cwd: distPath, stdio: 'inherit' });
execSync(`git push -f "${remoteUrl}" HEAD:gh-pages`, { cwd: distPath, stdio: 'inherit' });

// Limpiar .git de dist
const gitDir = path.join(distPath, '.git');
if (fs.existsSync(gitDir)) {
  fs.rmSync(gitDir, { recursive: true, force: true });
}

console.log('✅ ¡Despliegue completado con éxito!');
console.log('👉 URL en vivo: https://pnoriegawork-maker.github.io/Spotify_personal/');
