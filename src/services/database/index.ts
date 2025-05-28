import * as SQLite from 'expo-sqlite';
import { JournalEntry, User, DBJournalEntry, DBUser, UserPreferences, MoodType } from '../../types';

const DB_NAME = 'mindmint.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Users table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        wallet_address TEXT,
        total_clarity_points INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_entry_date TEXT,
        created_at TEXT NOT NULL,
        preferences TEXT NOT NULL
      );
    `);

    // Journal entries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        mood TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_minted INTEGER DEFAULT 0,
        nft_address TEXT,
        clarity_points INTEGER DEFAULT 0,
        is_sync INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_user_date 
      ON journal_entries (user_id, created_at);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_entries_sync 
      ON journal_entries (is_sync);
    `);
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    
    const user: User = {
      id,
      createdAt: new Date(createdAt),
      ...userData,
    };

    await this.db.runAsync(
      `INSERT INTO users (id, wallet_address, total_clarity_points, current_streak, 
       longest_streak, last_entry_date, created_at, preferences) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.walletAddress || null,
        userData.totalClarityPoints,
        userData.currentStreak,
        userData.longestStreak,
        userData.lastEntryDate?.toISOString() || null,
        createdAt,
        JSON.stringify(userData.preferences),
      ]
    );

    return user;
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<DBUser>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return this.dbUserToUser(result);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const setClause = [];
    const values = [];

    if (updates.walletAddress !== undefined) {
      setClause.push('wallet_address = ?');
      values.push(updates.walletAddress);
    }
    if (updates.totalClarityPoints !== undefined) {
      setClause.push('total_clarity_points = ?');
      values.push(updates.totalClarityPoints.toString());
    }
    if (updates.currentStreak !== undefined) {
      setClause.push('current_streak = ?');
      values.push(updates.currentStreak.toString());
    }
    if (updates.longestStreak !== undefined) {
      setClause.push('longest_streak = ?');
      values.push(updates.longestStreak.toString());
    }
    if (updates.lastEntryDate !== undefined) {
      setClause.push('last_entry_date = ?');
      values.push(updates.lastEntryDate?.toISOString() || null);
    }
    if (updates.preferences !== undefined) {
      setClause.push('preferences = ?');
      values.push(JSON.stringify(updates.preferences));
    }

    if (setClause.length === 0) return;

    values.push(id);

    await this.db.runAsync(
      `UPDATE users SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Journal entry operations
  async createJournalEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    const entry: JournalEntry = {
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      ...entryData,
    };

    await this.db.runAsync(
      `INSERT INTO journal_entries (id, user_id, content, mood, created_at, 
       updated_at, is_minted, nft_address, clarity_points, is_sync) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entryData.userId,
        entryData.content,
        entryData.mood,
        now,
        now,
        entryData.isMinted ? '1' : '0',
        entryData.nftAddress || null,
        entryData.clarityPoints.toString(),
        entryData.isSync ? '1' : '0',
      ]
    );

    return entry;
  }

  async getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT * FROM journal_entries 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    const results = await this.db.getAllAsync<DBJournalEntry>(query, [userId]);
    
    return results.map(this.dbEntryToEntry);
  }

  async getJournalEntry(id: string): Promise<JournalEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<DBJournalEntry>(
      'SELECT * FROM journal_entries WHERE id = ?',
      [id]
    );

    if (!result) return null;
    return this.dbEntryToEntry(result);
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const setClause = ['updated_at = ?'];
    const values = [new Date().toISOString()];

    if (updates.content !== undefined) {
      setClause.push('content = ?');
      values.push(updates.content);
    }
    if (updates.mood !== undefined) {
      setClause.push('mood = ?');
      values.push(updates.mood);
    }
    if (updates.isMinted !== undefined) {
      setClause.push('is_minted = ?');
      values.push(updates.isMinted ? '1' : '0');
    }
    if (updates.nftAddress !== undefined) {
      setClause.push('nft_address = ?');
      values.push(updates.nftAddress);
    }
    if (updates.clarityPoints !== undefined) {
      setClause.push('clarity_points = ?');
      values.push(updates.clarityPoints.toString());
    }
    if (updates.isSync !== undefined) {
      setClause.push('is_sync = ?');
      values.push(updates.isSync ? '1' : '0');
    }

    values.push(id);

    await this.db.runAsync(
      `UPDATE journal_entries SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteJournalEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
  }

  async getUnsyncedEntries(userId: string): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<DBJournalEntry>(
      'SELECT * FROM journal_entries WHERE user_id = ? AND is_sync = 0',
      [userId]
    );

    return results.map(this.dbEntryToEntry);
  }

  async getTodayEntry(userId: string): Promise<JournalEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const result = await this.db.getFirstAsync<DBJournalEntry>(
      `SELECT * FROM journal_entries 
       WHERE user_id = ? AND date(created_at) = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, today]
    );

    if (!result) return null;
    return this.dbEntryToEntry(result);
  }

  // Helper methods
  private dbUserToUser(dbUser: DBUser): User {
    return {
      id: dbUser.id,
      walletAddress: dbUser.wallet_address || undefined,
      totalClarityPoints: dbUser.total_clarity_points,
      currentStreak: dbUser.current_streak,
      longestStreak: dbUser.longest_streak,
      lastEntryDate: dbUser.last_entry_date ? new Date(dbUser.last_entry_date) : undefined,
      createdAt: new Date(dbUser.created_at),
      preferences: JSON.parse(dbUser.preferences) as UserPreferences,
    };
  }

  private dbEntryToEntry(dbEntry: DBJournalEntry): JournalEntry {
    return {
      id: dbEntry.id,
      userId: dbEntry.user_id,
      content: dbEntry.content,
      mood: dbEntry.mood as MoodType, // Proper type assertion for mood
      createdAt: new Date(dbEntry.created_at),
      updatedAt: new Date(dbEntry.updated_at),
      isMinted: dbEntry.is_minted === 1,
      nftAddress: dbEntry.nft_address || undefined,
      clarityPoints: dbEntry.clarity_points,
      isSync: dbEntry.is_sync === 1,
    };
  }
}

export const databaseService = new DatabaseService(); 