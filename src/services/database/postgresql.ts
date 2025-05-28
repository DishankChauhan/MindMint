// Conditional import to avoid React Native import issues
// import { Pool, PoolClient } from 'pg';
import { JournalEntry, User, DBJournalEntry, DBUser, UserPreferences, MoodType } from '../../types';

// PostgreSQL connection configuration
interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

class PostgreSQLService {
  private pool: any = null;
  private config: PostgreSQLConfig | null = null;
  private pgModule: any = null;

  // Dynamically import pg module when needed
  private async importPg() {
    if (!this.pgModule) {
      try {
        // This will only work in Node.js environments, not React Native
        this.pgModule = require('pg');
      } catch (error) {
        throw new Error('PostgreSQL is not available in React Native environment. Use this service only in Node.js backend.');
      }
    }
    return this.pgModule;
  }

  // Initialize with configuration
  async init(config: PostgreSQLConfig): Promise<void> {
    // Skip PostgreSQL initialization in React Native
    if (typeof window !== 'undefined' || typeof navigator !== 'undefined') {
      console.warn('PostgreSQL service is not available in React Native. Skipping initialization.');
      return;
    }

    try {
      const pg = await this.importPg();
      
      this.config = config;
      this.pool = new pg.Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Create tables if they don't exist
      await this.createTables();
      console.log('PostgreSQL database initialized successfully');
    } catch (error) {
      console.error('PostgreSQL initialization failed:', error);
      throw error;
    }
  }

  // Helper method to check if we're in a React Native environment
  private isReactNative(): boolean {
    return typeof window !== 'undefined' || typeof navigator !== 'undefined';
  }

  // Create database tables
  private async createTables(): Promise<void> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const client = await this.pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          wallet_address TEXT,
          total_clarity_points INTEGER DEFAULT 0,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_entry_date TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          preferences JSONB NOT NULL DEFAULT '{}'::jsonb
        );
      `);

      // Journal entries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          mood TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          is_minted BOOLEAN DEFAULT FALSE,
          nft_address TEXT,
          clarity_points INTEGER DEFAULT 0,
          is_sync BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_entries_user_date 
        ON journal_entries (user_id, created_at DESC);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_entries_sync 
        ON journal_entries (is_sync);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_entries_mood 
        ON journal_entries (mood);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_entries_minted 
        ON journal_entries (is_minted);
      `);

      // Commit transaction
      await client.query('COMMIT');
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date();
    
    const user: User = {
      id,
      createdAt,
      ...userData,
    };

    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO users (id, wallet_address, total_clarity_points, current_streak, 
         longest_streak, last_entry_date, created_at, preferences) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          userData.walletAddress || null,
          userData.totalClarityPoints,
          userData.currentStreak,
          userData.longestStreak,
          userData.lastEntryDate || null,
          createdAt,
          JSON.stringify(userData.preferences),
        ]
      );
    } finally {
      client.release();
    }

    return user;
  }

  async getUser(id: string): Promise<User | null> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) return null;

      return this.dbUserToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (updates.walletAddress !== undefined) {
      setClause.push(`wallet_address = $${paramCount++}`);
      values.push(updates.walletAddress);
    }
    if (updates.totalClarityPoints !== undefined) {
      setClause.push(`total_clarity_points = $${paramCount++}`);
      values.push(updates.totalClarityPoints);
    }
    if (updates.currentStreak !== undefined) {
      setClause.push(`current_streak = $${paramCount++}`);
      values.push(updates.currentStreak);
    }
    if (updates.longestStreak !== undefined) {
      setClause.push(`longest_streak = $${paramCount++}`);
      values.push(updates.longestStreak);
    }
    if (updates.lastEntryDate !== undefined) {
      setClause.push(`last_entry_date = $${paramCount++}`);
      values.push(updates.lastEntryDate);
    }
    if (updates.preferences !== undefined) {
      setClause.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.preferences));
    }

    if (setClause.length === 0) return;

    values.push(id);

    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    } finally {
      client.release();
    }
  }

  // Journal entry operations
  async createJournalEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const now = new Date();
    
    const entry: JournalEntry = {
      id,
      createdAt: now,
      updatedAt: now,
      ...entryData,
    };

    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO journal_entries (id, user_id, content, mood, created_at, 
         updated_at, is_minted, nft_address, clarity_points, is_sync) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          entryData.userId,
          entryData.content,
          entryData.mood,
          now,
          now,
          entryData.isMinted,
          entryData.nftAddress || null,
          entryData.clarityPoints,
          entryData.isSync,
        ]
      );
    } finally {
      client.release();
    }

    return entry;
  }

  async getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM journal_entries 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        ${limit ? `LIMIT $2` : ''}
      `;

      const params = limit ? [userId, limit] : [userId];
      const result = await client.query(query, params);
      
      return result.rows.map(this.dbEntryToEntry);
    } finally {
      client.release();
    }
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<void> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (updates.content !== undefined) {
      setClause.push(`content = $${paramCount++}`);
      values.push(updates.content);
    }
    if (updates.mood !== undefined) {
      setClause.push(`mood = $${paramCount++}`);
      values.push(updates.mood);
    }
    if (updates.isMinted !== undefined) {
      setClause.push(`is_minted = $${paramCount++}`);
      values.push(updates.isMinted);
    }
    if (updates.nftAddress !== undefined) {
      setClause.push(`nft_address = $${paramCount++}`);
      values.push(updates.nftAddress);
    }
    if (updates.clarityPoints !== undefined) {
      setClause.push(`clarity_points = $${paramCount++}`);
      values.push(updates.clarityPoints);
    }
    if (updates.isSync !== undefined) {
      setClause.push(`is_sync = $${paramCount++}`);
      values.push(updates.isSync);
    }

    // Always update the updated_at timestamp
    setClause.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    if (setClause.length <= 1) return; // Only updated_at was set

    values.push(id);

    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE journal_entries SET ${setClause.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    } finally {
      client.release();
    }
  }

  async deleteJournalEntry(id: string): Promise<void> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM journal_entries WHERE id = $1', [id]);
    } finally {
      client.release();
    }
  }

  async getUnsyncedEntries(userId: string): Promise<JournalEntry[]> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM journal_entries WHERE user_id = $1 AND is_sync = FALSE ORDER BY created_at DESC',
        [userId]
      );
      
      return result.rows.map(this.dbEntryToEntry);
    } finally {
      client.release();
    }
  }

  // Analytics queries
  async getMoodDistribution(userId: string, days?: number): Promise<{ [key: string]: number }> {
    if (this.isReactNative()) {
      throw new Error('PostgreSQL operations not available in React Native');
    }
    
    if (!this.pool) throw new Error('Database not initialized');

    const client = await this.pool.connect();
    try {
      let query = `
        SELECT mood, COUNT(*) as count 
        FROM journal_entries 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (days) {
        query += ` AND created_at >= NOW() - INTERVAL '${days} days'`;
      }

      query += ' GROUP BY mood ORDER BY count DESC';

      const result = await client.query(query, params);
      
      const distribution: { [key: string]: number } = {};
      result.rows.forEach((row: any) => {
        distribution[row.mood] = parseInt(row.count);
      });

      return distribution;
    } finally {
      client.release();
    }
  }

  // Utility methods
  async checkConnection(): Promise<boolean> {
    if (this.isReactNative()) {
      return false;
    }
    
    if (!this.pool) return false;

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('PostgreSQL connection check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // Helper methods
  private dbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      walletAddress: dbUser.wallet_address,
      totalClarityPoints: dbUser.total_clarity_points,
      currentStreak: dbUser.current_streak,
      longestStreak: dbUser.longest_streak,
      lastEntryDate: dbUser.last_entry_date ? new Date(dbUser.last_entry_date) : undefined,
      createdAt: new Date(dbUser.created_at),
      preferences: typeof dbUser.preferences === 'string' 
        ? JSON.parse(dbUser.preferences) 
        : dbUser.preferences,
    };
  }

  private dbEntryToEntry(dbEntry: any): JournalEntry {
    return {
      id: dbEntry.id,
      userId: dbEntry.user_id,
      content: dbEntry.content,
      mood: dbEntry.mood as MoodType,
      createdAt: new Date(dbEntry.created_at),
      updatedAt: new Date(dbEntry.updated_at),
      isMinted: dbEntry.is_minted,
      nftAddress: dbEntry.nft_address,
      clarityPoints: dbEntry.clarity_points,
      isSync: dbEntry.is_sync,
    };
  }
}

export const postgreSQLService = new PostgreSQLService(); 