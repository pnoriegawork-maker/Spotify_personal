/**
 * CONFIGURACIÓN CENTRAL DEL CLIENTE Y MAPEO DE PROTOCOLOS REA
 * Arquitectura basada en deconstrucción de Spotify (morluto/rea & SpClient)
 * Catálogo enriquecido con artistas globales y enlace al Resolver Universal
 */

export function getAssetUrl(relativePath) {
  if (!relativePath) return '';
  if (
    relativePath.startsWith('http://') ||
    relativePath.startsWith('https://') ||
    relativePath.startsWith('blob:') ||
    relativePath.startsWith('data:')
  ) {
    return relativePath;
  }
  const clean = relativePath.replace(/^(\.\/|\/)/, '');
  if (typeof window === 'undefined') {
    return `./${clean}`;
  }
  let base = window.location.pathname || '/';
  if (!base.endsWith('/')) {
    if (/\.[a-zA-Z0-9]+$/.test(base)) {
      base = base.substring(0, base.lastIndexOf('/') + 1);
    } else {
      base = base + '/';
    }
  }
  return `${window.location.origin}${base}${clean}`;
}

export const CONFIG = {
  APP_NAME: 'Spotify Custom Player (Universal Global Core)',
  VERSION: '1.2.0',
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

  DEFAULT_COVER: getAssetUrl('covers/stratovarius_visions.jpg'),
  DEFAULT_ARTIST_AVATAR: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',

  // CATÁLOGO MAESTRO GLOBAL (Pistas de Estudio 100% Originales y Carátulas Oficiales)
  DEMO_CATALOG: [
    {
      id: 'global-strato-01',
      title: 'Hunting High and Low',
      artist: 'Stratovarius',
      album: 'Infinite',
      duration: 245,
      durationFormatted: '4:05',
      audioUrl: getAssetUrl('audio/stratovarius_hunting_high_and_low.m4a'),
      coverUrl: getAssetUrl('covers/stratovarius_infinite.jpg'),
      year: 2000,
      genre: 'Power Metal',
      isFullTrack: true
    },
    {
      id: 'global-strato-02',
      title: 'Black Diamond',
      artist: 'Stratovarius',
      album: 'Visions',
      duration: 335,
      durationFormatted: '5:35',
      audioUrl: getAssetUrl('audio/stratovarius_black_diamond.m4a'),
      coverUrl: getAssetUrl('covers/stratovarius_visions.jpg'),
      year: 1997,
      genre: 'Power Metal',
      isFullTrack: true
    },
    {
      id: 'global-queen-01',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      duration: 359,
      durationFormatted: '5:59',
      audioUrl: getAssetUrl('audio/queen_bohemian_rhapsody.m4a'),
      coverUrl: getAssetUrl('covers/queen_a_night_at_the_opera.jpg'),
      year: 1975,
      genre: 'Classic Rock',
      isFullTrack: true
    },
    {
      id: 'global-metallica-01',
      title: 'Master of Puppets',
      artist: 'Metallica',
      album: 'Master of Puppets',
      duration: 515,
      durationFormatted: '8:35',
      audioUrl: getAssetUrl('audio/metallica_master_of_puppets.m4a'),
      coverUrl: getAssetUrl('covers/metallica_master_of_puppets.jpg'),
      year: 1986,
      genre: 'Thrash Metal',
      isFullTrack: true
    },
    {
      id: 'global-daft-01',
      title: 'Get Lucky (feat. Pharrell Williams)',
      artist: 'Daft Punk',
      album: 'Random Access Memories',
      duration: 248,
      durationFormatted: '4:08',
      audioUrl: getAssetUrl('audio/daft_punk_get_lucky.m4a'),
      coverUrl: getAssetUrl('covers/daft_punk_random_access_memories.jpg'),
      year: 2013,
      genre: 'Electronic / Funk',
      isFullTrack: true
    },
    {
      id: 'global-acdc-01',
      title: 'Back In Black',
      artist: 'AC/DC',
      album: 'Back in Black',
      duration: 253,
      durationFormatted: '4:13',
      audioUrl: getAssetUrl('audio/acdc_back_in_black.m4a'),
      coverUrl: getAssetUrl('covers/acdc_back_in_black.jpg'),
      year: 1980,
      genre: 'Hard Rock',
      isFullTrack: true
    },
    {
      id: 'global-gnr-01',
      title: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      album: 'Appetite for Destruction',
      duration: 354,
      durationFormatted: '5:54',
      audioUrl: getAssetUrl('audio/guns_n_roses_sweet_child_o_mine.m4a'),
      coverUrl: getAssetUrl('covers/guns_n_roses_appetite.jpg'),
      year: 1987,
      genre: 'Hard Rock',
      isFullTrack: true
    }
  ]
};

