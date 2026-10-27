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

  DEFAULT_COVER: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  DEFAULT_ARTIST_AVATAR: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',

  // CATÁLOGO DESTACADO GLOBAL COMPLETO (Pistas Completas 320 kbps con Web Audio API y CDN Universal)
  DEMO_CATALOG: [
    {
      id: 'global-strato-01',
      title: 'Hunting High and Low',
      artist: 'Stratovarius',
      album: 'Infinite',
      duration: 249,
      durationFormatted: '4:09',
      audioUrl: 'https://aac.saavncdn.com/513/dac1d86c1f57f02ca3f4f387f9646001_320.mp4',
      coverUrl: 'https://c.saavncdn.com/513/In-My-Place-Instrumental-2019-20190305023133-500x500.jpg',
      year: 2000,
      genre: 'Power Metal'
    },
    {
      id: 'global-strato-02',
      title: 'Black Diamond',
      artist: 'Stratovarius',
      album: 'Visions',
      duration: 236,
      durationFormatted: '3:56',
      audioUrl: 'https://aac.saavncdn.com/587/739bd1fb4156515c9edd04fe0fbfd8a3_320.mp4',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      year: 1997,
      genre: 'Power Metal'
    },
    {
      id: 'global-queen-01',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      duration: 218,
      durationFormatted: '3:38',
      audioUrl: 'https://aac.saavncdn.com/806/442b9d1e36a4bcef050a32de50a82316_320.mp4',
      coverUrl: 'https://c.saavncdn.com/806/Bohemian-Rhapsody-Haryanvi-2025-20250910130600-500x500.jpg',
      year: 1975,
      genre: 'Classic Rock'
    },
    {
      id: 'global-metallica-01',
      title: 'Master of Puppets',
      artist: 'Metallica',
      album: 'Master of Puppets (Remastered)',
      duration: 498,
      durationFormatted: '8:18',
      audioUrl: 'https://aac.saavncdn.com/064/e10b7e28039e6a3c021ea245943ad2ef_320.mp4',
      coverUrl: 'https://c.saavncdn.com/064/ZZang-KARAOKE-2024-Old-POP-Vol-19-Instrumental-2024-20260710183200-500x500.jpg',
      year: 1986,
      genre: 'Thrash Metal'
    },
    {
      id: 'global-daft-01',
      title: 'Get Lucky (feat. Pharrell Williams)',
      artist: 'Daft Punk',
      album: 'Random Access Memories',
      duration: 231,
      durationFormatted: '3:51',
      audioUrl: 'https://aac.saavncdn.com/888/dd0f6f81018550501683e41b7abe6044_320.mp4',
      coverUrl: 'https://c.saavncdn.com/888/Singing-Today-s-Hits-Vol-1-English-2014-500x500.jpg',
      year: 2013,
      genre: 'Electronic / Funk'
    },
    {
      id: 'global-acdc-01',
      title: 'Back In Black',
      artist: 'AC/DC',
      album: 'Back in Black',
      duration: 262,
      durationFormatted: '4:22',
      audioUrl: 'https://aac.saavncdn.com/060/9e85a7df81a3f75ccc0890ca39f488b5_320.mp4',
      coverUrl: 'https://c.saavncdn.com/060/ZZang-KARAOKE-2024-Old-POP-Vol-2-Instrumental-2024-20260711235641-500x500.jpg',
      year: 1980,
      genre: 'Hard Rock'
    },
    {
      id: 'global-gnr-01',
      title: 'Sweet Child O\' Mine',
      artist: 'Guns N\' Roses',
      album: 'Appetite for Destruction',
      duration: 129,
      durationFormatted: '2:09',
      audioUrl: 'https://aac.saavncdn.com/737/ff0a737ee136de7690fe5ce235c9df3f_320.mp4',
      coverUrl: 'https://c.saavncdn.com/737/Sweet-Child-O-Mine-Instrumental-2025-20250721100045-500x500.jpg',
      year: 1987,
      genre: 'Hard Rock'
    }
  ]
};

