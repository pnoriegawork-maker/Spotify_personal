# 🎵 Spotify Custom Player (Reverse Engineering Edition)

Cliente multiplataforma de streaming y reproducción de audio de alto rendimiento (<80 MB RAM) basado en la deconstrucción de protocolos propietarios de Spotify (**SpClient**, **Mercury Protocol**, **APResolve** y **Web Audio API**) mediante la metodología del framework **REA** ([morluto/rea](https://github.com/morluto/rea.git)).

---

## ⚡ Características Principales

- **Arquitectura de Bucle Cerrado MAPE-K**: Monitorización de red, análisis espectral, planificación modular, ejecución limpia y base de conocimiento.
- **Audio de Alta Fidelidad**: Motor de audio híbrido HTML5 + Web Audio API con ecualizador *Biquad* de graves y visualizador espectral FFT de 64 bandas en tiempo real a 60 FPS.
- **Autenticación Segura OAuth 2.0 PKCE (RFC 7636)**: Flujo criptográfico completo con generación de `code_verifier` y `code_challenge` SHA-256 sin exponer secretos.
- **Buscador Reactivo & Caché Offline**: Búsqueda con debounce e indexación local de pistas, álbumes y artistas con recuperación ante fallos de red.
- **Spotify Dark Theme Pixel-Perfect**: Interfaz inmersiva (#121212 / #1DB954) 100% responsiva para pantallas panorámicas (Desktop) y táctiles (Smartphones).
- **Multiplataforma Real**:
  - **Laptop / Desktop**: Empaquetable mediante **Electron** o **Tauri (Rust)** en `.exe` (Windows), `.dmg` (macOS) y `.AppImage` / `.deb` (Linux).
  - **Smartphone / Mobile**: Empaquetable mediante **Capacitor** en `.apk` (Android) o ejecutable directamente como **PWA** (iOS / Android) con Service Worker y Web App Manifest.

---

## 🛠️ Requisitos Previos

- **Node.js**: v18.0.0 o superior (Recomendado v20+ / v24).
- **npm**: v9.0.0 o superior.
- *(Opcional para Android .apk)*: Android Studio / SDK y JDK 17+.
- *(Opcional para Tauri .exe ultra-ligero)*: Rust y Cargo.

---

## 🚀 Comandos de Ejecución y Desarrollo

### 1. Servidor de Desarrollo Web / PWA
```bash
npm run dev
```
Abre la aplicación en `http://localhost:5173`.

### 2. Ejecutar como App de Escritorio Nativa (Electron)
```bash
npm run desktop
```

---

## 📦 Generación de Instaladores y Ejecutables

### Para Laptop / PC de Escritorio (Windows / macOS / Linux)

```bash
# Compilar bundle y empaquetar instaladores .exe / .dmg / .AppImage
npm run build:desktop
```
Los archivos compilados se generarán en la carpeta `dist-electron/`:
- **Windows**: `SpotifyCustomPlayer Setup 1.0.0.exe` y versión portable `.exe`.
- **macOS**: `SpotifyCustomPlayer-1.0.0.dmg`.
- **Linux**: `SpotifyCustomPlayer-1.0.0.AppImage` y `.deb`.

*(Alternativa con Tauri/Rust)*:
```bash
cargo tauri build
```

---

### Para Smartphone / Móvil (Android APK e iOS PWA)

#### Opción A: Compilar archivo `.apk` para Android
```bash
# 1. Compilar el frontend optimizado
npm run build

# 2. Inicializar proyecto Capacitor Android (si es la primera vez)
npm run mobile:add:android

# 3. Sincronizar assets web con el contenedor Android nativo
npm run build:mobile

# 4. Generar el APK depurable mediante Gradle
cd android
./gradlew assembleDebug
```
El archivo se encontrará en:
`android/app/build/outputs/apk/debug/app-debug.apk`

#### Opción B: Instalación Directa PWA (Android / iOS / ChromeOS) — ¡Ya Desplegada y Activa!
- **URL Oficial en Producción**:  
  👉 **[https://pnoriegawork-maker.github.io/Spotify_personal/](https://pnoriegawork-maker.github.io/Spotify_personal/)**
- **Repositorio Oficial en GitHub**:  
  👉 **[https://github.com/pnoriegawork-maker/Spotify_personal](https://github.com/pnoriegawork-maker/Spotify_personal)**

1. Abre la URL en el navegador de tu smartphone (Chrome, Safari, Brave o Edge).
2. Toca el menú (tres puntos) y presiona **"Agregar a la pantalla principal"** o **"Instalar aplicación"**.
3. ¡Listo! La app se ejecutará a pantalla completa como una aplicación nativa, con soporte de almacenamiento local y reproducción sin conexión.

---

## 💾 Despliegue de Actualizaciones Futuras en 1 Solo Paso

Cada vez que abras esta carpeta y hagas ajustes en el código, solo ejecuta:
```bash
npm run deploy:pages
```
Este comando compilará el frontend y actualizará automáticamente la versión de tu smartphone en GitHub Pages.

---

## 🎧 Motor de Reproducción Offline (IndexedDB + Service Worker)

- **Descarga Física**: Cuando marcas una canción con el icono de corazón (❤️), la aplicación descarga el archivo binario de audio (`Blob`) y su carátula a la base de datos `SpotifyOfflineAudioDB` de la memoria interna.
- **Sin Conexión o Modo Avión**: En `Tu Biblioteca`, las canciones marcadas como favoritas se reproducen directamente desde `URL.createObjectURL(blob)`, garantizando reproducción instantánea con 0% de señal de internet.
- **Caché de Aplicación**: El Service Worker (`public/sw.js`) garantiza que el shell visual de la aplicación cargue de inmediato incluso si abres el móvil en modo avión.

---

## 🎹 Atajos de Teclado (Desktop)

| Tecla | Acción |
| :--- | :--- |
| `Espacio` | Reproducir / Pausar pista |
| `Flecha Derecha` | Adelantar 5 segundos |
| `Flecha Izquierda` | Retroceder 5 segundos |
| `Flecha Arriba` | Subir volumen (+5%) |
| `Flecha Abajo` | Bajar volumen (-5%) |
| `M` | Silenciar / Restaurar volumen |

