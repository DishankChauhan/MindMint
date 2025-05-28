import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { JournalEntry, User, SyncStatus, UserPreferences } from '../types';
import { databaseService } from '../services/database';
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
  | { type: 'SET_INITIALIZED'; payload: boolean };

// State interface
interface AppState {
  user: User | null;
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  initialized: boolean;
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
    
    default:
      return state;
  }
}

// Context interface
interface AppContextType extends AppState {
  // User actions
  createUser: (preferences: UserPreferences) => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  connectWallet: (walletAddress: string) => Promise<void>;
  
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

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting MindMint initialization...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Initialize SQLite database
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        console.log('📄 Initializing SQLite database...');
        await databaseService.init();
        console.log('✅ SQLite database initialized');
      }
      
      // Try to get existing user or create one
      console.log('👤 Getting or creating user...');
      let user = await getOrCreateUser();
      console.log('✅ User ready:', user.id);
      dispatch({ type: 'SET_USER', payload: user });
      
      // Load journal entries
      console.log('📚 Loading journal entries...');
      const entries = await databaseService.getJournalEntries(user.id);
      console.log('✅ Loaded', entries.length, 'entries');
      dispatch({ type: 'SET_ENTRIES', payload: entries });
      
      // Update user stats based on entries
      console.log('📊 Updating user stats...');
      await updateUserStats(user, entries);
      console.log('✅ User stats updated');
      
      // Set initial sync status
      console.log('🌐 Setting initial sync status...');
      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: {
          isOnline: true, // We'll implement proper network detection later
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
    
    if (storedUserId && CONFIG.DATABASE.SQLITE_ENABLED) {
      const existingUser = await databaseService.getUser(storedUserId);
      if (existingUser) {
        console.log('📱 Found existing user in database');
        return existingUser;
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
    
    if (CONFIG.DATABASE.SQLITE_ENABLED) {
      newUser = await databaseService.createUser(userData);
    } else {
      // Fallback to in-memory user if database is disabled
      newUser = {
        id: Date.now().toString(),
        createdAt: new Date(),
        ...userData,
      };
    }
    
    // Store user ID
    await AsyncStorage.setItem('mindmint_user_id', newUser.id);
    
    return newUser;
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
    
    if (CONFIG.DATABASE.SQLITE_ENABLED) {
      await databaseService.updateUser(user.id, updates);
    }
    dispatch({ type: 'UPDATE_USER', payload: updates });
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
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        user = await databaseService.createUser(userData);
      } else {
        user = {
          id: Date.now().toString(),
          createdAt: new Date(),
          ...userData,
        };
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
      
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateUser(state.user.id, { preferences: updatedPreferences });
      }
      dispatch({ type: 'UPDATE_USER', payload: { preferences: updatedPreferences } });
    } catch (error) {
      console.error('Error updating preferences:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
    }
  };

  const connectWallet = async (walletAddress: string) => {
    if (!state.user) return;
    
    try {
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateUser(state.user.id, { walletAddress });
      }
      dispatch({ type: 'UPDATE_USER', payload: { walletAddress } });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect wallet' });
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
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        entry = await databaseService.createJournalEntry(entryData);
      } else {
        // Fallback to in-memory entry
        entry = {
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...entryData,
        };
      }
      
      dispatch({ type: 'ADD_ENTRY', payload: entry });
      
      // Update user stats
      await updateUserStats(state.user, [entry, ...state.entries]);
      
      return entry;
    } catch (error) {
      console.error('Error creating entry:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create journal entry' });
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    try {
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        await databaseService.updateJournalEntry(id, updates);
        
        // Mark as unsynced if content changed
        if (updates.content || updates.mood) {
          await databaseService.updateJournalEntry(id, { isSync: false });
          updates.isSync = false;
        }
      }
      
      dispatch({ type: 'UPDATE_ENTRY', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating entry:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update journal entry' });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
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
    
    if (!state.user?.walletAddress) {
      throw new Error('Wallet not connected');
    }
    
    const entry = state.entries.find(e => e.id === entryId);
    if (!entry) throw new Error('Entry not found');
    
    try {
      // For now, just mark as minted and add NFT points
      // Real Solana integration will be implemented with actual wallet connection
      const nftAddress = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await updateEntry(entryId, {
        isMinted: true,
        nftAddress,
        clarityPoints: entry.clarityPoints + CONFIG.CLARITY_POINTS.NFT_MINTING,
      });
      
      return nftAddress;
    } catch (error) {
      console.error('Error minting NFT:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mint NFT' });
      throw error;
    }
  };

  const syncToCloud = async () => {
    // Cloud sync will be implemented with PostgreSQL backend
    console.log('Cloud sync not implemented yet - will use PostgreSQL backend');
  };

  const checkOnlineStatus = async () => {
    // Network status checking will be implemented
    dispatch({
      type: 'SET_SYNC_STATUS',
      payload: {
        isOnline: true,
        pendingSync: 0,
        lastSyncTime: state.syncStatus.lastSyncTime,
      },
    });
  };

  const refreshData = async () => {
    if (!state.user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (CONFIG.DATABASE.SQLITE_ENABLED) {
        const entries = await databaseService.getJournalEntries(state.user.id);
        dispatch({ type: 'SET_ENTRIES', payload: entries });
        await updateUserStats(state.user, entries);
      }
      
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