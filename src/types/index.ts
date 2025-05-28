export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  mood: MoodType;
  createdAt: Date;
  updatedAt: Date;
  isMinted: boolean;
  nftAddress?: string;
  clarityPoints: number;
  isSync: boolean; // true if synced to cloud
}

export interface User {
  id: string;
  walletAddress?: string;
  totalClarityPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastEntryDate?: Date;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  enableNotifications: boolean;
  notificationTime: string; // "HH:MM" format
  theme: 'light' | 'dark';
  autoSync: boolean;
}

export type MoodType = 'happy' | 'sad' | 'calm' | 'anxious' | 'excited' | 'tired' | 'grateful' | 'angry';

export interface MoodData {
  mood: MoodType;
  date: string; // YYYY-MM-DD format
  points: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface ClarityPointsBreakdown {
  dailyEntry: number;
  streakBonus: number;
  moodTracking: number;
  nftMinting: number;
  total: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime?: Date;
  pendingSync: number; // number of entries waiting to sync
}

export interface NotificationSettings {
  enabled: boolean;
  time: string;
  streakReminders: boolean;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  NewEntry: { entryId?: string }; // for editing
  Profile: undefined;
  Settings: undefined;
  MoodGraph: undefined;
  MintNFT: { entryId: string };
};

// Database table types for SQLite
export interface DBJournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: string;
  created_at: string;
  updated_at: string;
  is_minted: number; // SQLite boolean as integer
  nft_address?: string;
  clarity_points: number;
  is_sync: number; // SQLite boolean as integer
}

export interface DBUser {
  id: string;
  wallet_address?: string;
  total_clarity_points: number;
  current_streak: number;
  longest_streak: number;
  last_entry_date?: string;
  created_at: string;
  preferences: string; // JSON string of UserPreferences
} 