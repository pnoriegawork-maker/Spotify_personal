# Memoria Técnica Oficial: Spotify Custom Player (SpClient REA & Motor Offline)

**Fecha de última actualización**: 27 de Octubre de 2026  
**Arquitectura**: Vanilla JavaScript ES6+ (Sin frameworks pesados) + Vite 6 + Web Audio API + IndexedDB + Electron + PWA  
**Estado del Proyecto**: Producción Estable, Desplegado y Sincronizado  

---

## 1. Identificación y Ubicación de Recursos

- **Directorio Raíz Local**: `C:\Users\Estudiante 08\Documents\Pedro_Noriega\Aplicaciones IA\Spotify_personal`
- **Repositorio Oficial en GitHub**: [https://github.com/pnoriegawork-maker/Spotify_personal](https://github.com/pnoriegawork-maker/Spotify_personal) (Rama `main`)
- **PWA Web & Smartphone en Producción**: [https://pnoriegawork-maker.github.io/Spotify_personal/](https://pnoriegawork-maker.github.io/Spotify_personal/) (Rama `gh-pages`)
- **Ejecutable Local para Desktop (Windows x64)**: `dist-electron/win-unpacked/SpotifyCustomPlayer.exe`
- **Acceso Directo en Escritorio**: `C:\Users\Estudiante 08\Desktop\Spotify Custom Player.lnk`

---

## 2. Registro Histórico: Todo lo Aprobado vs. Todo lo Rechazado

Esta sección rige como norma estricta de desarrollo para cualquier sesión posterior.

### ✅ TODO LO APROBADO (Estándares de Calidad y Soluciones Validadas)

1. **Audio de Estudio 100% Original Auténtico**:
   - Solo se admiten grabaciones de estudio originales de las bandas oficiales en alta fidelidad (AAC/M4A a 320 kbps nativos).
   - Alojamiento directo y autónomo en el paquete del reproductor (`public/audio/`), garantizando que la reproducción funcione de forma inmediata, sin bloqueos de CORS, sin cuotas caídas y sin depender de servicios de terceros.
   - Pistas maestras integradas:
     * *Stratovarius – Black Diamond* (5:35, Álbum *Visions*, 1997).
     * *Stratovarius – Hunting High and Low* (4:05, Álbum *Infinite*, 2000).
     * *Queen – Bohemian Rhapsody* (5:59, Álbum *A Night at the Opera*, 1975).
     * *Metallica – Master of Puppets* (8:35, Álbum *Master of Puppets*, 1986).
     * *Daft Punk – Get Lucky* (4:08, Álbum *Random Access Memories*, 2013).
     * *AC/DC – Back in Black* (4:13, Álbum *Back in Black*, 1980).
     * *Guns N' Roses – Sweet Child O' Mine* (5:54, Álbum *Appetite for Destruction*, 1987).

2. **Carátulas Oficiales Discográficas en Alta Definición**:
   - Portadas auténticas históricas aprobadas y alojadas en `public/covers/` (*Visions*, *Infinite*, *A Night at the Opera*, *Master of Puppets*, *Random Access Memories*, *Back in Black*, *Appetite for Destruction*).
   - Fallback multinivel seguro en `CONFIG.DEFAULT_COVER` que evita imágenes rotas o errores 404.

3. **Buscador Multidimensional Estructurado y Blindado (`src/api/spotifyApi.js`)**:
   - Navegación funcional con selectores activos: **Todos**, **Canciones**, **Artistas** y **Álbumes**.
   - Prioridad #1 inmutable: Las búsquedas de canciones o artistas del catálogo maestro anteponen siempre las grabaciones oficiales de estudio, bloqueando cualquier reemplazo por versiones externas.
   - Navegación interactiva completa: Clic en artista abre su vista de discografía y top canciones; clic en álbum abre el desglose de pistas.

4. **Motor de Descarga y Almacenamiento Físico Offline (`src/library/storage.js`)**:
   - Almacenamiento binario en `IndexedDB` (`SpotifyOfflineAudioDB`, almacén `audio_blobs`) al pulsar el botón Me Gusta (❤️).
   - Generación de Blob URLs (`blob:`) en memoria RAM para reproducción física 100% fluida en Modo Avión o sin conexión a internet.
   - Sincronización inteligente y depuración automática de caché: Si un favorito guardado contenía una URL obsoleta o de baja calidad, el motor purga el blob desactualizado y lo reemplaza automáticamente con la pista de estudio oficial.

5. **Motor Acústico Web Audio API a 60 FPS (`src/player/audioEngine.js`)**:
   - Grafo de procesamiento de audio en tiempo real:
     * `BiquadFilterNode`: Filtro low-shelf a 150 Hz (+3.5 dB) para realce acústico de graves sin distorsión.
     * `AnalyserNode`: FFT de 64 bandas sincronizado a 60 FPS con Canvas 2D en la barra de reproducción.
     * `GainNode`: Control de volumen lineal sin saturación.

6. **Ecosistema Multiplataforma Integrado**:
   - PWA instalable con Service Worker (`public/sw.js`) con estrategia Stale-While-Revalidate.
   - Aplicación de escritorio portable para Windows mediante Electron (`electron/main.js`).
   - Script de despliegue en un solo comando: `npm run deploy:pages`.

---

### ❌ TODO LO RECHAZADO (Prácticas y Enfoques Inaceptables Descartados)

1. **RECHAZADO: Previews de 30 segundos**:
   - Queda estrictamente prohibido limitar las canciones a fragmentos o previews de 30 segundos. El reproductor fue construido para emular la experiencia completa de un cliente SpClient de Spotify y debe ofrecer siempre las obras musicales completas (de 3 a 9 minutos).

2. **RECHAZADO: Scraping a ciegas de CDNs externos (JioSaavn) sin verificación estricta de artista**:
   - Fue la causa directa de que se reprodujeran canciones equivocadas (por ejemplo, *Vince In My Place* en lugar de *Hunting High and Low*, versiones en idiomas asiáticos o canciones de artistas no relacionados). Queda descartado el uso de resultados externos que no pasen por un filtro estricto de coincidencia de título y artista oficial.

3. **RECHAZADO: Pistas de Karaoke, Instrumentales no oficiales y Tributos de baja calidad**:
   - Descartadas totalmente pistas tipo *ZZang KARAOKE*, instrumentales sintetizados o covers no autorizados. En `mergeAndResolveTracks()` se implementó un filtro de exclusión obligatorio que purga automáticamente resultados con etiquetas `karaoke`, `instrumental`, `zzang` o `tribute`.

4. **RECHAZADO: Carátulas genéricas de banco de imágenes (Unsplash) para artistas reconocidos**:
   - Inaceptable colocar fotografías de conciertos anónimos o fotos de stock para representar álbumes clásicos de Stratovarius, Queen o Metallica. Solo se admiten las portadas oficiales diseñadas para dichos álbumes.

5. **RECHAZADO: Selectores de UI decorativos o no funcionales**:
   - Inaceptable que los botones de categoría (Canciones, Artistas, Álbumes) no filtren el contenido. Toda pestaña y enlace de navegación debe tener un manejador de eventos activo y dinámico.

6. **RECHAZADO: Persistencia de caché corrupta o residual**:
   - Si se actualiza el catálogo, el sistema no debe permitir que el almacenamiento en `localStorage` o `IndexedDB` mantenga en reproducción archivos viejos o defectuosos; la invalidación de caché debe ser automática.

---

## 3. Estructura del Código Fuente

```
Spotify_personal/
├── electron/
│   └── main.js                  # Proceso principal de Electron (Ventana nativa Windows)
├── public/
│   ├── audio/                   # 100% Masters de estudio oficiales (AAC/M4A)
│   │   ├── stratovarius_black_diamond.m4a
│   │   ├── stratovarius_hunting_high_and_low.m4a
│   │   ├── queen_bohemian_rhapsody.m4a
│   │   ├── metallica_master_of_puppets.m4a
│   │   ├── daft_punk_get_lucky.m4a
│   │   ├── acdc_back_in_black.m4a
│   │   └── guns_n_roses_sweet_child_o_mine.m4a
│   ├── covers/                  # Carátulas oficiales de álbumes en HD
│   │   ├── stratovarius_visions.jpg
│   │   ├── stratovarius_infinite.jpg
│   │   ├── queen_a_night_at_the_opera.jpg
│   │   ├── metallica_master_of_puppets.jpg
│   │   ├── daft_punk_random_access_memories.jpg
│   │   ├── acdc_back_in_black.jpg
│   │   └── guns_n_roses_appetite.jpg
│   ├── icon.svg                 # Logo oficial de la aplicación
│   ├── manifest.json            # Manifiesto PWA para instalación en smartphone
│   └── sw.js                    # Service Worker con caché offline Stale-While-Revalidate
├── scripts/
│   └── deploy.js                # Despliegue automatizado a GitHub Pages (gh-pages)
├── src/
│   ├── api/
│   │   ├── auth.js              # Flujo OAuth PKCE RFC 7636 (opcional para usuarios SpClient)
│   │   └── spotifyApi.js        # Universal Catalog Engine con prioridad a masters de estudio
│   ├── core/
│   │   ├── config.js            # Configuración global, catálogo maestro y getAssetUrl()
│   │   └── state.js             # Gestor reactivo de estado global (Flux/Pub-Sub)
│   ├── library/
│   │   └── storage.js           # Motor IndexedDB, descarga de blobs y purga de caché
│   ├── player/
│   │   ├── audioEngine.js       # Web Audio API, analizador FFT 64 bandas y filtro Biquad
│   │   └── lyricsEngine.js      # Sincronización de letras LRC milimétricas con LRCLIB
│   ├── ui/
│   │   ├── components.js        # Tarjetas de canciones, artistas, álbumes y controles
│   │   └── views.js             # Renderizado de Inicio, Búsqueda, Biblioteca y Detalles
│   ├── main.js                  # Orquestador principal e inicio del ciclo de vida
│   └── style.css                # Estilos Spotify Dark Theme (#121212)
├── dist/                        # Bundle compilado de producción para despliegue
├── dist-electron/               # Binarios ejecutables de escritorio Windows (.exe)
├── package.json                 # Scripts y dependencias del proyecto
├── vite.config.js               # Configuración Vite con base relativa './'
├── MEMORIA_TECNICA.md           # Memoria técnica interna del proyecto
└── README.md                    # Documentación pública del repositorio
```

---

## 4. Guía de Comandos para Retomar el Proyecto

Cuando se vuelva a abrir esta carpeta de trabajo:

```bash
# 1. Iniciar servidor local de desarrollo:
npm run dev

# 2. Ejecutar como aplicación nativa de escritorio:
npm run desktop

# 3. Compilar el ejecutable para Windows (.exe):
npm run build:desktop

# 4. Desplegar actualizaciones a GitHub Pages en un solo comando:
npm run deploy:pages
```
