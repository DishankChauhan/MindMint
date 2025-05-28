-- MindMint Database Schema
-- PostgreSQL schema for the mindfulness journaling app

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) UNIQUE, -- Solana wallet address
    total_clarity_points INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_entry_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    preferences JSONB NOT NULL DEFAULT '{
        "enableNotifications": true,
        "notificationTime": "20:00",
        "theme": "light",
        "autoSync": true
    }'
);

-- Create journal_entries table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood VARCHAR(20) NOT NULL CHECK (mood IN ('happy', 'sad', 'calm', 'anxious', 'excited', 'tired', 'grateful', 'angry')),
    clarity_points INTEGER NOT NULL DEFAULT 0,
    is_minted BOOLEAN NOT NULL DEFAULT FALSE,
    nft_address VARCHAR(44), -- Solana NFT mint address
    nft_transaction_signature VARCHAR(88), -- Solana transaction signature
    nft_metadata_uri TEXT, -- IPFS metadata URI
    is_sync BOOLEAN NOT NULL DEFAULT TRUE, -- Always true for PostgreSQL entries
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX idx_journal_entries_mood ON journal_entries(mood);
CREATE INDEX idx_journal_entries_is_minted ON journal_entries(is_minted);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at 
    BEFORE UPDATE ON journal_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development (optional)
-- Uncomment the following lines if you want some test data

/*
INSERT INTO users (wallet_address, total_clarity_points, current_streak, longest_streak) VALUES
('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 150, 3, 7);

INSERT INTO journal_entries (user_id, content, mood, clarity_points, is_minted) VALUES
((SELECT id FROM users WHERE wallet_address = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'),
 'Today I practiced mindfulness meditation for 20 minutes. I felt a sense of calm wash over me as I focused on my breathing.', 
 'calm', 
 15, 
 false);
*/ 