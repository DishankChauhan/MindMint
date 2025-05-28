import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { JournalEntry, User, SyncStatus, UserPreferences } from '../types';
import { databaseService } from '../services/database';
import { postgreSQLService } from '../services/database/postgresql';
import { walletService } from '../services/wallet';
import { solanaService } from '../services/solana';
import { calculateStreak, calculateClarityPoints, hasWrittenToday } from '../utils';
import { CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ENTRIES'; payload: JournalEntry[] }
  | { type: 'ADD_ENTRY'; payload: JournalEntry }
  | { type: 'UPDATE_ENTRY'; payload: { id: string; updates: Partial<JournalEntry> } }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_WALLET_CONNECTED'; payload: boolean };

// State interface
interface AppState {
  user: User | null;
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  initialized: boolean;
  walletConnected: boolean;
}

// Initial state
const initialState: AppState = {
  user: null,
  entries: [],
  loading: false,
  error: null,
  syncStatus: {
    isOnline: false,
    pendingSync: 0,
  },
  initialized: false,
  walletConnected: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_ENTRIES':
      return { ...state, entries: action.payload };
    
    case 'ADD_ENTRY':
      return { ...state, entries: [action.payload, ...state.entries] };
    
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(entry =>
          entry.id === action.payload.id
            ? { ...entry, ...action.payload.updates }
            : entry
        ),
      };
    
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.payload),
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    
    case 'SET_WALLET_CONNECTED':
      return { ...state, walletConnected: action.payload };
    
    default:
      return state;
  }
}

// Context interface
interface AppContextType extends AppState {
  // User actions
  createUser: (preferences: UserPreferences) => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  
  // Wallet actions
  connectWallet: (walletType?: 'phantom' | 'solflare' | 'mock') => Promise<void>;
  disconnectWallet: () => Promise<void>;
  getWalletBalance: () => Promise<number>;
  requestAirdrop: (amount?: number) => Promise<string>;
  
  // Journal entry actions
  createEntry: (content: string, mood: any) => Promise<JournalEntry>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getTodayEntry: () => JournalEntry | null;
  
  // NFT actions
  mintEntryAsNFT: (entryId: string) => Promise<string>;
  
  // Sync actions
  syncToCloud: () => Promise<void>;
  checkOnlineStatus: () => Promise<void>;
  
  // Utility methods
  refreshData: () => Promise<void>;
  clearError: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook to use context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  // Listen to wallet changes
  useEffect(() => {
    const unsubscribe = walletService.onWalletChange((wallet) => {
      dispatch({ type: 'SET_WALLET_CONNECTED', payload: !!wallet });
      if (wallet && state.user) {
        updateUserWallet(wallet.publicKey?.toString());
      }
    });

    return unsubscribe;
  }, [state.user]);

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting MindMint initialization...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Initialize databases
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        console.log('📄 Initializing SQLite database...');
        await databaseService.init();
        console.log('✅ SQLite database initialized');
      }

      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        console.log('🐘 Initializing PostgreSQL database...');
        try {
          const postgreSQLConfig = {
            ...CONFIG.DATABASE.POSTGRESQL_CONFIG,
            username: CONFIG.DATABASE.POSTGRESQL_CONFIG.user, // Map 'user' to 'username'
          };
          await postgreSQLService.init(postgreSQLConfig);
          console.log('✅ PostgreSQL database initialized');
        } catch (error) {
          console.warn('⚠️ PostgreSQL connection failed, using SQLite only:', error);
        }
      }
      
      // Try to get existing user or create one
      console.log('👤 Getting or creating user...');
      let user = await getOrCreateUser();
      console.log('✅ User ready:', user.id);
      dispatch({ type: 'SET_USER', payload: user });
      
      // Load journal entries
      console.log('📚 Loading journal entries...');
      const entries = await loadJournalEntries(user.id);
      console.log('✅ Loaded', entries.length, 'entries');
      dispatch({ type: 'SET_ENTRIES', payload: entries });
      
      // Update user stats based on entries
      console.log('📊 Updating user stats...');
      await updateUserStats(user, entries);
      console.log('✅ User stats updated');
      
      // Check wallet connection
      console.log('💰 Checking wallet connection...');
      const walletConnected = walletService.isConnected();
      dispatch({ type: 'SET_WALLET_CONNECTED', payload: walletConnected });
      console.log('✅ Wallet status:', walletConnected ? 'Connected' : 'Not connected');
      
      // Set initial sync status
      console.log('🌐 Setting initial sync status...');
      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isOnline: true,
          pendingSync: 0,
        },
      });
      console.log('✅ Sync status set');
      
      console.log('🎉 MindMint initialization complete!');
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app. Please restart.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getOrCreateUser = async (): Promise<User> => {
    // Try to get user ID from storage
    const storedUserId = await AsyncStorage.getItem('mindmint_user_id');
    
    if (storedUserId) {
      // Try PostgreSQL first, then SQLite
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        try {
          const existingUser = await postgreSQLService.getUser(storedUserId);
          if (existingUser) {
            console.log('🐘 Found existing user in PostgreSQL');
            return existingUser;
          }
        } catch (error) {
          console.warn('PostgreSQL user lookup failed:', error);
        }
      }
      
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        const existingUser = await databaseService.getUser(storedUserId);
        if (existingUser) {
          console.log('📱 Found existing user in SQLite');
          return existingUser;
        }
      }
    }
    
    // Create new user
    console.log('🆕 Creating new user');
    const defaultPreferences: UserPreferences = {
      enableNotifications: CONFIG.NOTIFICATIONS.ENABLED,
      notificationTime: CONFIG.NOTIFICATIONS.DEFAULT_TIME,
      theme: 'light',
      autoSync: true,
    };
    
    const userData = {
      totalClarityPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      preferences: defaultPreferences,
    };

    let newUser: User;
    
    // Try to create in PostgreSQL first, fallback to SQLite
    if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
      try {
        newUser = await postgreSQLService.createUser(userData);
        console.log('🐘 User created in PostgreSQL');
      } catch (error) {
        console.warn('PostgreSQL user creation failed, using SQLite:', error);
        newUser = await databaseService.createUser(userData);
      }
    } else {
      newUser = await databaseService.createUser(userData);
    }
    
    // Store user ID
    await AsyncStorage.setItem('mindmint_user_id', newUser.id);
    
    return newUser;
  };

  const loadJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
    // Try PostgreSQL first, then SQLite
    if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
      try {
        return await postgreSQLService.getJournalEntries(userId);
      } catch (error) {
        console.warn('PostgreSQL entries lookup failed, using SQLite:', error);
      }
    }
    
    if (CONFIG.DATABASE.SQLITE_ENABLED) {
      return await databaseService.getJournalEntries(userId);
    }
    
    return [];
  };

  const updateUserStats = async (user: User, entries: JournalEntry[]) => {
    const currentStreak = calculateStreak(entries, user);
    const totalClarityPoints = entries.reduce((sum, entry) => sum + entry.clarityPoints, 0);
    const longestStreak = Math.max(user.longestStreak, currentStreak);
    const lastEntryDate = entries.length > 0 ? entries[0].createdAt : undefined;
    
    const updates = {
      currentStreak,
      totalClarityPoints,
      longestStreak,
      lastEntryDate,
    };
    
    // Update in both databases
    try {
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        await postgreSQLService.updateUser(user.id, updates);
      }
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateUser(user.id, updates);
      }
    } catch (error) {
      console.warn('Error updating user stats:', error);
    }
    
    dispatch({ type: 'UPDATE_USER', payload: updates });
  };

  const updateUserWallet = async (walletAddress: string | undefined) => {
    if (!state.user) return;
    
    try {
      const updates = { walletAddress };
      
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        await postgreSQLService.updateUser(state.user.id, updates);
      }
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateUser(state.user.id, updates);
      }
      dispatch({ type: 'UPDATE_USER', payload: updates });
    } catch (error) {
      console.error('Error updating user wallet:', error);
    }
  };

  // Context methods
  const createUser = async (preferences: UserPreferences) => {
    try {
      const userData = {
        totalClarityPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        preferences,
      };

      let user: User;
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        try {
          user = await postgreSQLService.createUser(userData);
        } catch (error) {
          console.warn('PostgreSQL user creation failed, using SQLite:', error);
          user = await databaseService.createUser(userData);
        }
      } else {
        user = await databaseService.createUser(userData);
      }
      
      await AsyncStorage.setItem('mindmint_user_id', user.id);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Error creating user:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create user' });
    }
  };

  const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
    if (!state.user) return;
    
    try {
      const updatedPreferences = { ...state.user.preferences, ...preferences };
      
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        await postgreSQLService.updateUser(state.user.id, { preferences: updatedPreferences });
      }
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateUser(state.user.id, { preferences: updatedPreferences });
      }
      dispatch({ type: 'UPDATE_USER', payload: { preferences: updatedPreferences } });
    } catch (error) {
      console.error('Error updating preferences:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
    }
  };

  const connectWallet = async (walletType: 'phantom' | 'solflare' | 'mock' = 'phantom') => {
    if (!state.user) return;
    
    try {
      const wallet = await walletService.connectWallet(walletType);
      const walletAddress = wallet.publicKey?.toString();
      
      const updates = { walletAddress };
      
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        await postgreSQLService.updateUser(state.user.id, updates);
      }
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateUser(state.user.id, updates);
      }
      dispatch({ type: 'UPDATE_USER', payload: updates });
      dispatch({ type: 'SET_WALLET_CONNECTED', payload: true });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect wallet' });
    }
  };

  const disconnectWallet = async () => {
    if (!state.user) return;
    
    try {
      await walletService.disconnectWallet();
      const updates = { walletAddress: undefined };
      
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        await postgreSQLService.updateUser(state.user.id, updates);
      }
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateUser(state.user.id, updates);
      }
      dispatch({ type: 'UPDATE_USER', payload: updates });
      dispatch({ type: 'SET_WALLET_CONNECTED', payload: false });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to disconnect wallet' });
    }
  };

  const getWalletBalance = async (): Promise<number> => {
    if (!walletService.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await walletService.getBalance();
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  };

  const requestAirdrop = async (amount: number = 1): Promise<string> => {
    if (!walletService.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    try {
      return await walletService.requestAirdrop(amount);
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw error;
    }
  };

  const createEntry = async (content: string, mood: any): Promise<JournalEntry> => {
    if (!state.user) throw new Error('No user found');
    
    try {
      // Calculate clarity points
      const currentStreak = state.user.currentStreak;
      const pointsBreakdown = calculateClarityPoints(
        { mood } as JournalEntry,
        currentStreak,
        true
      );
      
      const entryData = {
        userId: state.user.id,
        content,
        mood,
        isMinted: false,
        clarityPoints: pointsBreakdown.total,
        isSync: false,
      };

      let entry: JournalEntry;
      
      // Try PostgreSQL first, fallback to SQLite
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        try {
          entry = await postgreSQLService.createJournalEntry(entryData);
        } catch (error) {
          console.warn('PostgreSQL entry creation failed, using SQLite:', error);
          entry = await databaseService.createJournalEntry(entryData);
        }
      } else {
        entry = await databaseService.createJournalEntry(entryData);
      }
      
      dispatch({ type: 'ADD_ENTRY', payload: entry });
      
      // Update user stats
      const updatedEntries = [entry, ...state.entries];
      await updateUserStats(state.user, updatedEntries);
      
      return entry;
    } catch (error) {
      console.error('Error creating entry:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create journal entry' });
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    try {
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        await postgreSQLService.updateJournalEntry(id, updates);
      }
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateJournalEntry(id, updates);
      }
      dispatch({ type: 'UPDATE_ENTRY', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating entry:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update journal entry' });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      if (CONFIG.DATABASE.POSTGRESQL_ENABLED) {
        await postgreSQLService.deleteJournalEntry(id);
      }
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.deleteJournalEntry(id);
      }
      dispatch({ type: 'DELETE_ENTRY', payload: id });
    } catch (error) {
      console.error('Error deleting entry:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete journal entry' });
    }
  };

  const getTodayEntry = (): JournalEntry | null => {
    return state.entries.find(entry => {
      const today = new Date();
      const entryDate = new Date(entry.createdAt);
      return (
        today.getDate() === entryDate.getDate() &&
        today.getMonth() === entryDate.getMonth() &&
        today.getFullYear() === entryDate.getFullYear()
      );
    }) || null;
  };

  const mintEntryAsNFT = async (entryId: string): Promise<string> => {
    if (!CONFIG.SOLANA.ENABLED) {
      throw new Error('Solana functionality is disabled');
    }
    
    if (!walletService.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    const entry = state.entries.find(e => e.id === entryId);
    if (!entry) throw new Error('Entry not found');
    
    if (entry.isMinted) {
      throw new Error('Entry already minted as NFT');
    }
    
    try {
      console.log('🎨 Starting real NFT minting for entry:', entryId);
      
      // Use real Solana service to mint NFT
      const nftResult = await solanaService.mintJournalEntryAsNFT(entry);
      
      // Update the entry to mark as minted
      const updates = {
        isMinted: true,
        nftAddress: nftResult.nftAddress,
        nftTransactionSignature: nftResult.transactionSignature,
        nftMetadataUri: nftResult.metadataUri,
        clarityPoints: entry.clarityPoints + CONFIG.CLARITY_POINTS.NFT_MINTING,
      };
      
      await updateEntry(entryId, updates);
      
      console.log('🎉 NFT minted successfully!', nftResult);
      return nftResult.nftAddress;
    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mint NFT' });
      throw error;
    }
  };

  const syncToCloud = async () => {
    if (!CONFIG.DATABASE.POSTGRESQL_ENABLED || !state.user) {
      console.log('Cloud sync not available');
      return;
    }
    
    try {
      // Sync entries that haven't been synced
      const unsyncedEntries = state.entries.filter(entry => !entry.isSync);
      
      for (const entry of unsyncedEntries) {
        try {
          await postgreSQLService.createJournalEntry({
            ...entry,
            isSync: true,
          });
          
          // Update local entry to mark as synced
          await databaseService.updateJournalEntry(entry.id, { isSync: true });
        } catch (error) {
          console.warn('Failed to sync entry:', entry.id, error);
        }
      }
      
      console.log(`Synced ${unsyncedEntries.length} entries to cloud`);
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync data to cloud' });
    }
  };

  const checkOnlineStatus = async () => {
    // Simple online check - in production you'd use NetInfo
    dispatch({
      type: 'SET_SYNC_STATUS',
      payload: {
        isOnline: true,
        pendingSync: state.entries.filter(e => !e.isSync).length,
        lastSyncTime: state.syncStatus.lastSyncTime,
      },
    });
  };

  const refreshData = async () => {
    if (!state.user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const entries = await loadJournalEntries(state.user.id);
      dispatch({ type: 'SET_ENTRIES', payload: entries });
      await updateUserStats(state.user, entries);
      
      await checkOnlineStatus();
    } catch (error) {
      console.error('Error refreshing data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: AppContextType = {
    ...state,
    createUser,
    updateUserPreferences,
    connectWallet,
    disconnectWallet,
    getWalletBalance,
    requestAirdrop,
    createEntry,
    updateEntry,
    deleteEntry,
    getTodayEntry,
    mintEntryAsNFT,
    syncToCloud,
    checkOnlineStatus,
    refreshData,
    clearError,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
} 