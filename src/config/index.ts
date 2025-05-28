// App configuration
export const CONFIG = {
  // App info
  APP_NAME: 'MindMint',
  VERSION: '1.0.0',
  
  // Database configuration
  DATABASE: {
    // Use SQLite for local development and offline-first functionality
    SQLITE_ENABLED: true,
    
    // PostgreSQL for cloud deployment (optional)
    POSTGRESQL_ENABLED: false,
    POSTGRESQL_CONFIG: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'mindmint',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production',
    },
  },
  
  // Solana configuration
  SOLANA: {
    ENABLED: true,
    NETWORK: __DEV__ ? 'devnet' : 'mainnet-beta',
    RPC_URL: __DEV__ 
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com',
  },
  
  // Notifications
  NOTIFICATIONS: {
    DEFAULT_TIME: '20:00', // 8 PM
    ENABLED: true,
  },
  
  // Points system
  CLARITY_POINTS: {
    DAILY_ENTRY: 10,
    MOOD_TRACKING: 5,
    NFT_MINTING: 20,
    STREAK_3_DAYS: 15,
    STREAK_7_DAYS: 50,
    STREAK_30_DAYS: 200,
  },
  
  // Development flags
  DEV: {
    ENABLE_LOGGING: __DEV__,
    ENABLE_DEBUG_MENU: __DEV__,
    BYPASS_AUTH: __DEV__, // Skip wallet connection in dev mode
  },
};

// Environment-specific overrides
if (__DEV__) {
  console.log('🔧 Running in development mode');
  console.log('📊 Solana network:', CONFIG.SOLANA.NETWORK);
  console.log('💾 SQLite enabled:', CONFIG.DATABASE.SQLITE_ENABLED);
  console.log('🐘 PostgreSQL enabled:', CONFIG.DATABASE.POSTGRESQL_ENABLED);
} 