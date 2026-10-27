/**
 * CONFIGURACIÓN CENTRAL DEL CLIENTE Y MAPEO DE PROTOCOLOS REA
 * Arquitectura basada en deconstrucción de Spotify (morluto/rea & SpClient)
 * Catálogo enriquecido con artistas globales y enlace al Resolver Universal
 */

export const CONFIG = {
  APP_NAME: 'Spotify Custom Player (Universal Global Core)',
  VERSION: '1.1.0',
  DEFAULT_CLIENT_ID: '279eb526b18d420481e7f91e3f61513b',
  REDIRECT_URI: window.location.origin + window.location.pathname,
  
  ENDPOINTS: {
    ACCOUNTS_AUTH: 'https://accounts.spotify.com/authorize',
    ACCOUNTS_TOKEN: 'https://accounts.spotify.com/api/token',
    WEB_API: 'https://api.spotify.com/v1',
    SPCLIENT_BASE: 'https://spclient.wg.spotify.com',
    STORAGE_RESOLVE: 'https://spclient.wg.spotify.com/storage-resolve/files/audio/interactive',
    METADATA_SERVICE: 'https://spclient.wg.spotify.com/metadata/4',
    LYRICS_SERVICE: 'https://spclient.wg.spotify.com/lyrics-multistatus/v1',
    DEALER_WS: 'wss://dealer.spotify.com',
    AP_RESOLVE: 'https://apresolve.spotify.com'
  },

  STORAGE_KEYS: {
    AUTH_STATE: 'rea_spotify_auth_state',
    CODE_VERIFIER: 'rea_spotify_code_verifier',
    ACCESS_TOKEN: 'rea_spotify_access_token',
    REFRESH_TOKEN: 'rea_spotify_refresh_token',
    TOKEN_EXPIRY: 'rea_spotify_token_expiry',
    CLIENT_ID: 'rea_spotify_custom_client_id',
    FAVORITES: 'rea_spotify_favorites_v1',
    CUSTOM_PLAYLISTS: 'rea_spotify_playlists_v1',
    SETTINGS: 'rea_spotify_settings_v1'
  },

  // CATÁLOGO DESTACADO GLOBAL (Iconos mundiales del Rock, Metal, Synthwave y Electrónica)
  DEMO_CATALOG: [
    {
      id: 'global-strato-01',
      title: 'Hunting High and Low',
      artist: 'Stratovarius',
      album: 'Infinite',
      duration: 245,
      durationFormatted: '4:05',
      audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ef/35/b7/ef35b773-674f-921d-6a64-6a6ac090d973/mzaf_5916111386184098455.plus.aac.p.m4a',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d5/43/17/d5431713-356b-3fa2-d1d7-27b0c8efc74e/4029759114291.jpg/600x600bb.jpg',
      year: 2000,
      genre: 'Power Metal'
    },
    {
      id: 'global-strato-02',
      title: 'Black Diamond',
      artist: 'Stratovarius',
      album: 'Visions',
      duration: 339,
      durationFormatted: '5:39',
      audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/65/42/60/65426079-5faa-e3d3-afff-9c3994bc6776/mzaf_5955434148749811929.plus.aac.p.m4a',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3d/8c/df/3d8cdfef-7f55-66ea-c726-17b5f25bf611/4029759114314.jpg/600x600bb.jpg',
      year: 1997,
      genre: 'Power Metal'
    },
    {
      id: 'global-queen-01',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      duration: 354,
      durationFormatted: '5:54',
      audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/a4/09/b3/a409b30c-5ee2-b88d-3b56-7ee24fa60ce9/mzaf_10332308365612662059.plus.aac.p.m4a',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/28/1d/18/281d1845-6671-5586-7a8e-cfd2bb7a87e5/00602527718042.rgb.jpg/600x600bb.jpg',
      year: 1975,
      genre: 'Classic Rock'
    },
    {
      id: 'global-metallica-01',
      title: 'Master of Puppets',
      artist: 'Metallica',
      album: 'Master of Puppets (Remastered)',
      duration: 515,
      durationFormatted: '8:35',
      audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/dd/50/a1/dd50a1df-3635-430c-6c19-1bb07662cfbf/mzaf_16480587786419131604.plus.aac.p.m4a',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/4a/12/35/4a1235b3-3df8-3d19-d04b-32454559868f/00858978005219.rgb.jpg/600x600bb.jpg',
      year: 1986,
      genre: 'Thrash Metal'
    },
    {
      id: 'global-daft-01',
      title: 'Get Lucky (feat. Pharrell Williams)',
      artist: 'Daft Punk',
      album: 'Random Access Memories',
      duration: 248,
      durationFormatted: '4:08',
      audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/21/04/aa/2104aa7f-d5b7-789a-0e06-ff4042858d24/mzaf_1669438965042805470.plus.aac.p.m4a',
      coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/58/2b/ef/582bef01-7fa1-1bb7-c0e7-ec213607775f/886443927087.jpg/600x600bb.jpg',
      year: 2013,
      genre: 'Electronic / Funk'
    },
    {
      id: 'global-cyber-01',
      title: 'Midnight Protocol (Cyber Drift)',
      artist: 'Morluto & The Reverse Engineers',
      album: 'SpClient Deconstructed Vol. 1',
      duration: 198,
      durationFormatted: '3:18',
      audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cyberpunk-2099-10701.mp3',
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      year: 2026,
      genre: 'Cyberpunk'
    }
  ]
};
