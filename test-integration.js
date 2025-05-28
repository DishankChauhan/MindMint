#!/usr/bin/env node

/**
 * Integration Test for MindMint Real Implementation
 * Tests PostgreSQL database and Solana service connections
 */

const { Client } = require('pg');
const { Connection, clusterApiUrl } = require('@solana/web3.js');

async function testPostgreSQLConnection() {
  console.log('🐘 Testing PostgreSQL connection...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'mindmint',
    user: process.env.USER || 'postgres',
    password: '',
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL connected successfully');
    
    // Test if our tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'journal_entries')
    `);
    
    console.log('📋 Found tables:', result.rows.map(r => r.table_name));
    
    // Test sample query
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const entryCount = await client.query('SELECT COUNT(*) FROM journal_entries');
    
    console.log('📊 Database stats:');
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Journal Entries: ${entryCount.rows[0].count}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

async function testSolanaConnection() {
  console.log('⚡ Testing Solana connection...');
  
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // Test connection
    const version = await connection.getVersion();
    console.log('✅ Solana connected successfully');
    console.log('📍 Network version:', version);
    
    // Test slot information
    const slot = await connection.getSlot();
    console.log('🔢 Current slot:', slot);
    
    return true;
  } catch (error) {
    console.error('❌ Solana connection failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting MindMint Integration Tests\n');
  
  const postgresResult = await testPostgreSQLConnection();
  console.log('');
  const solanaResult = await testSolanaConnection();
  
  console.log('\n📊 Test Results:');
  console.log(`   PostgreSQL: ${postgresResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Solana: ${solanaResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (postgresResult && solanaResult) {
    console.log('\n🎉 All tests passed! MindMint is ready for real implementation.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the configuration.');
    process.exit(1);
  }
}

runTests().catch(console.error); 