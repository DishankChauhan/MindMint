import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { JournalEntry, NFTMetadata } from '../../types';

// Solana configuration
const SOLANA_RPC_URL = __DEV__ ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com';
const SOLANA_NETWORK = __DEV__ ? 'devnet' : 'mainnet-beta';

class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }

  // Check connection to Solana network
  async checkConnection(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      console.log('Connected to Solana', SOLANA_NETWORK, 'version:', version);
      return true;
    } catch (error) {
      console.error('Failed to connect to Solana:', error);
      return false;
    }
  }

  // Get SOL balance for a wallet
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Request airdrop for devnet testing
  async requestAirdrop(publicKey: string, amount: number = 1): Promise<string> {
    if (SOLANA_NETWORK !== 'devnet') {
      throw new Error('Airdrop only available on devnet');
    }

    try {
      const pubKey = new PublicKey(publicKey);
      const signature = await this.connection.requestAirdrop(
        pubKey,
        amount * LAMPORTS_PER_SOL
      );
      
      await this.connection.confirmTransaction(signature);
      console.log('Airdrop successful:', signature);
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw error;
    }
  }

  // Generate NFT metadata from journal entry
  generateNFTMetadata(entry: JournalEntry): NFTMetadata {
    const date = entry.createdAt.toLocaleDateString();
    const moodEmoji = this.getMoodEmoji(entry.mood);
    
    return {
      name: `MindMint Entry – ${date}`,
      description: `A tokenized moment of reflection from ${date}. ${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}`,
      image: this.generateMoodImage(entry.mood),
      attributes: [
        {
          trait_type: 'Mood',
          value: entry.mood,
        },
        {
          trait_type: 'Mood Emoji',
          value: moodEmoji,
        },
        {
          trait_type: 'Clarity Points',
          value: entry.clarityPoints,
        },
        {
          trait_type: 'Date',
          value: date,
        },
        {
          trait_type: 'Word Count',
          value: entry.content.split(' ').length,
        },
        {
          trait_type: 'Entry Type',
          value: 'Daily Journal',
        },
        {
          trait_type: 'Network',
          value: SOLANA_NETWORK,
        },
      ],
    };
  }

  // Upload metadata to IPFS (using a service like Pinata or NFT.Storage)
  async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    try {
      // For MVP, we'll simulate metadata upload
      // In production, integrate with IPFS services like:
      // - NFT.Storage (free for NFTs)
      // - Pinata
      // - Arweave via Bundlr
      
      console.log('Uploading metadata to IPFS...');
      console.log('Metadata:', JSON.stringify(metadata, null, 2));
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a realistic IPFS hash
      const mockHash = 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o';
      const metadataUri = `https://ipfs.io/ipfs/${mockHash}`;
      
      console.log('Metadata uploaded to:', metadataUri);
      return metadataUri;
    } catch (error) {
      console.error('Error uploading metadata:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  // Create a simple NFT token using SPL Token
  async createSimpleNFT(
    payerKeypair: Keypair,
    metadataUri: string,
    journalEntry: JournalEntry
  ): Promise<{ mintAddress: string; tokenAccount: string; signature: string }> {
    try {
      console.log('Creating SPL Token NFT...');
      
      // Create a new mint with 0 decimals (NFT standard)
      const mint = await createMint(
        this.connection,
        payerKeypair,
        payerKeypair.publicKey, // Mint authority
        payerKeypair.publicKey, // Freeze authority (optional)
        0 // 0 decimals for NFT
      );

      console.log('Mint created:', mint.toString());

      // Get or create associated token account for the owner
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        payerKeypair,
        mint,
        payerKeypair.publicKey
      );

      console.log('Token account:', tokenAccount.address.toString());

      // Mint exactly 1 token to the token account (NFT = supply of 1)
      const signature = await mintTo(
        this.connection,
        payerKeypair,
        mint,
        tokenAccount.address,
        payerKeypair.publicKey,
        1 // Mint exactly 1 token
      );

      console.log('NFT minted successfully!');
      console.log('Transaction signature:', signature);

      return {
        mintAddress: mint.toString(),
        tokenAccount: tokenAccount.address.toString(),
        signature,
      };
    } catch (error) {
      console.error('Error creating NFT:', error);
      throw new Error('Failed to create NFT on Solana');
    }
  }

  // Complete NFT minting process
  async mintJournalEntryNFT(
    entry: JournalEntry,
    walletKeypair: Keypair
  ): Promise<{ nftAddress: string; transactionSignature: string; metadataUri: string }> {
    try {
      console.log('Starting NFT minting process for entry:', entry.id);
      
      // Step 1: Generate metadata
      const metadata = this.generateNFTMetadata(entry);
      
      // Step 2: Upload metadata to IPFS
      const metadataUri = await this.uploadMetadata(metadata);
      
      // Step 3: Create NFT on Solana
      const nftResult = await this.createSimpleNFT(walletKeypair, metadataUri, entry);
      
      console.log('NFT minting completed successfully!');
      
      return {
        nftAddress: nftResult.mintAddress,
        transactionSignature: nftResult.signature,
        metadataUri,
      };
    } catch (error) {
      console.error('Error in NFT minting process:', error);
      throw error;
    }
  }

  // Verify NFT ownership
  async verifyNFTOwnership(nftMintAddress: string, ownerPublicKey: string): Promise<boolean> {
    try {
      const mint = new PublicKey(nftMintAddress);
      const owner = new PublicKey(ownerPublicKey);
      
      // Get the associated token account for this owner and mint
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(owner, {
        mint: mint
      });

      if (tokenAccounts.value.length === 0) {
        return false;
      }

      // Check if the token account has exactly 1 token (NFT standard)
      const tokenAccount = tokenAccounts.value[0];
      const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount.pubkey);
      
      return accountInfo.value.uiAmount === 1;
    } catch (error) {
      console.error('Error verifying NFT ownership:', error);
      return false;
    }
  }

  // Get transaction details
  async getTransactionDetails(signature: string): Promise<any> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed'
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        signature,
        timestamp: transaction.blockTime ? new Date(transaction.blockTime * 1000).toISOString() : null,
        status: transaction.meta?.err ? 'failed' : 'confirmed',
        fee: transaction.meta?.fee || 0,
        slot: transaction.slot,
      };
    } catch (error) {
      console.error('Error getting transaction details:', error);
      throw error;
    }
  }

  // Generate a new Solana keypair
  static generateKeypair(): Keypair {
    return Keypair.generate();
  }

  // Get public key from private key
  static getKeypairFromSecretKey(secretKey: Uint8Array): Keypair {
    return Keypair.fromSecretKey(secretKey);
  }

  // Validate Solana address
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  // Helper methods
  private getMoodEmoji(mood: string): string {
    const moodEmojis: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      calm: '😌',
      anxious: '😰',
      excited: '🤩',
      tired: '😴',
      grateful: '🙏',
      angry: '😠',
    };
    return moodEmojis[mood] || '😐';
  }

  private generateMoodImage(mood: string): string {
    // In production, you could:
    // 1. Generate unique artwork using AI (DALL-E, Midjourney API)
    // 2. Use pre-designed mood-based templates
    // 3. Create generative art based on entry content
    
    const baseUrl = 'https://via.placeholder.com/500x500';
    const colors: { [key: string]: string } = {
      happy: 'FFD700',
      sad: '87CEEB',
      calm: '98FB98',
      anxious: 'FFA07A',
      excited: 'FF69B4',
      tired: '9370DB',
      grateful: 'F0E68C',
      angry: 'FF6347',
    };
    
    const color = colors[mood] || 'CCCCCC';
    const emoji = encodeURIComponent(this.getMoodEmoji(mood));
    return `${baseUrl}/${color}/FFFFFF?text=${emoji}`;
  }
}

export const solanaService = new SolanaService(); 