// App configuration
export const CONFIG = {
  // App info
  APP_NAME: 'MindMint',
  VERSION: '1.0.0',
  
  // Database configuration
  DATABASE: {
    // Use SQLite for local development and offline-first functionality
    SQLITE_ENABLED: true,
    
    // PostgreSQL for cloud deployment (disabled in React Native to avoid import issues)
    POSTGRESQL_ENABLED: false, // Disabled for React Native compatibility
    POSTGRESQL_CONFIG: {
      host: 'localhost',
      port: 5432,
      database: 'mindmint',
      user: process.env.USER || 'postgres', // Use current user for local dev
      password: '', // No password for local development
      ssl: false,
    },
  },
  
  // Solana configuration
  SOLANA: {
    ENABLED: true,
    NETWORK: 'devnet' as 'devnet' | 'mainnet-beta',
    RPC_URL: 'https://api.devnet.solana.com',
    // Wallet adapter configuration
    WALLET: {
      CLUSTER: 'devnet',
    },
  },
  
  // NFT Minting configuration
  NFT: {
    ENABLED: true, // Enable real NFT minting
    METADATA: {
      SYMBOL: 'MIND',
      EXTERNAL_URL: 'https://mindmint.app',
      COLLECTION_NAME: 'MindMint Journal Entries',
      CREATOR_ADDRESS: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    },
  },
  
  // Notifications
  NOTIFICATIONS: {
    DEFAULT_TIME: '20:00', // 8 PM
    ENABLED: true,
    REMINDER_MESSAGES: [
      "Time to reflect on your day 🌅",
      "Your mindfulness moment awaits ✨",
      "Ready to earn some clarity points? 📝",
    ],
  },
  
  // Points system
  CLARITY_POINTS: {
    DAILY_ENTRY: 10,
    MOOD_TRACKING: 5,
    STREAK_BONUS_MULTIPLIER: 2,
    NFT_MINTING: 20,
    WEEKLY_GOAL: 70,
  },
  
  // Development flags
  DEV: {
    MOCK_WALLET: false, // Disable mock wallet - use real wallet
    MOCK_NFT_MINTING: false, // Disable mock NFT minting - use real minting
    ENABLE_LOGGING: true,
  },
  
  // App navigation
  NAVIGATION: {
    INITIAL_ROUTE: 'Home',
    TAB_ROUTES: ['Home', 'History', 'Profile'],
  },
};

// Environment-specific overrides
if (__DEV__) {
  console.log('🔧 Running in development mode');
  console.log('📊 Solana network:', CONFIG.SOLANA.NETWORK);
  console.log('💾 SQLite enabled:', CONFIG.DATABASE.SQLITE_ENABLED);
  console.log('🐘 PostgreSQL enabled:', CONFIG.DATABASE.POSTGRESQL_ENABLED);
} 