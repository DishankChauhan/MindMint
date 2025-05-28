import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import {
  createMint,
  createAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { walletService } from '../wallet';
import { CONFIG } from '../../config';
import { JournalEntry } from '../../types';

export interface NFTMintResult {
  nftAddress: string;
  transactionSignature: string;
  metadataUri: string;
}

export interface IPFSMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
}

class RealSolanaService {
  private connection: Connection;

  constructor() {
    this.connection = walletService.getConnection();
  }

  // Upload metadata to IPFS (mock implementation for now)
  private async uploadToIPFS(metadata: IPFSMetadata): Promise<string> {
    // In production, this would upload to IPFS via services like Pinata, NFT.Storage, etc.
    // For now, we'll return a mock URI
    const mockUri = `https://mockipfs.com/metadata/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    console.log('📤 Uploading metadata to IPFS (mock):', mockUri);
    console.log('📝 Metadata:', metadata);
    return mockUri;
  }

  // Create NFT metadata for journal entry
  private createNFTMetadata(entry: JournalEntry, userWallet: string): IPFSMetadata {
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

    const entryDate = new Date(entry.createdAt).toLocaleDateString();
    const entryPreview = entry.content.length > 100 
      ? entry.content.substring(0, 100) + '...' 
      : entry.content;

    return {
      name: `MindMint Journal - ${entryDate}`,
      description: `A mindfulness journal entry minted as an NFT. "${entryPreview}" Mood: ${entry.mood} ${moodEmojis[entry.mood] || '🌟'}`,
      image: `https://mindmint.app/api/journal-image/${entry.id}`, // Would generate dynamic image
      attributes: [
        {
          trait_type: 'Mood',
          value: entry.mood,
        },
        {
          trait_type: 'Clarity Points',
          value: entry.clarityPoints,
        },
        {
          trait_type: 'Entry Date',
          value: entryDate,
        },
        {
          trait_type: 'Word Count',
          value: entry.content.split(' ').length,
        },
      ],
      properties: {
        category: 'Journal Entry',
        creators: [
          {
            address: userWallet,
            share: 85,
          },
          {
            address: CONFIG.NFT.METADATA.CREATOR_ADDRESS,
            share: 15,
          },
        ],
      },
    };
  }

  // Create a simple SPL Token as NFT (without complex metadata for now)
  private async createSimpleNFT(walletKeypair: Keypair): Promise<{ mint: PublicKey; tokenAccount: PublicKey; signature: string }> {
    console.log('🪙 Creating simple NFT mint...');

    try {
      // Create a new mint with 0 decimals (NFT standard)
      const mint = await createMint(
        this.connection,
        walletKeypair, // payer
        walletKeypair.publicKey, // mintAuthority
        walletKeypair.publicKey, // freezeAuthority
        0 // decimals (0 for NFTs)
      );

      console.log('✅ NFT mint created:', mint.toString());

      // Create token account for the NFT
      const tokenAccount = await createAccount(
        this.connection,
        walletKeypair, // payer
        mint, // mint
        walletKeypair.publicKey // owner
      );

      console.log('✅ Token account created:', tokenAccount.toString());

      // Mint 1 token (quantity for NFT)
      const signature = await mintTo(
        this.connection,
        walletKeypair, // payer
        mint, // mint
        tokenAccount, // destination
        walletKeypair.publicKey, // authority
        1 // amount (1 for NFT)
      );

      console.log('✅ NFT token minted, signature:', signature);

      return { mint, tokenAccount, signature };
    } catch (error) {
      console.error('❌ Error creating simple NFT:', error);
      throw new Error('Failed to create NFT');
    }
  }

  // Get wallet keypair for signing (using the current connected wallet)
  private getWalletKeypair(): Keypair {
    const walletAdapter = walletService.getCurrentWallet();
    if (!walletAdapter) {
      throw new Error('Wallet not connected');
    }

    // For now, we'll use the connected keypair from wallet service
    // In production, this would use the actual wallet's signing capability
    const walletService_: any = walletService as any;
    if (!walletService_.connectedKeypair) {
      throw new Error('Wallet keypair not available');
    }

    return walletService_.connectedKeypair;
  }

  // Main NFT minting function
  async mintJournalEntryAsNFT(entry: JournalEntry): Promise<NFTMintResult> {
    if (!CONFIG.NFT.ENABLED) {
      throw new Error('NFT minting is disabled');
    }

    const wallet = walletService.getCurrentWallet();
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    console.log('🎯 Starting NFT minting process for entry:', entry.id);

    try {
      // 1. Create NFT metadata
      const metadata = this.createNFTMetadata(entry, wallet.publicKey.toString());
      
      // 2. Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);
      
      // 3. Get wallet keypair for signing
      const walletKeypair = this.getWalletKeypair();
      
      // 4. Create simple NFT (SPL Token with 0 decimals)
      const nftResult = await this.createSimpleNFT(walletKeypair);

      const result: NFTMintResult = {
        nftAddress: nftResult.mint.toString(),
        transactionSignature: nftResult.signature,
        metadataUri: metadataUri,
      };

      console.log('🎉 NFT minting completed successfully!');
      console.log('📍 NFT Address:', result.nftAddress);
      console.log('📝 Transaction:', result.transactionSignature);
      console.log('🔗 Metadata URI:', result.metadataUri);

      return result;
    } catch (error) {
      console.error('❌ NFT minting failed:', error);
      throw new Error(`Failed to mint NFT: ${error}`);
    }
  }

  // Get NFT details
  async getNFTDetails(nftAddress: string): Promise<any> {
    try {
      const mint = new PublicKey(nftAddress);
      
      // Get mint info
      const mintInfo = await this.connection.getParsedAccountInfo(mint);
      
      return {
        mint: nftAddress,
        mintInfo: mintInfo.value,
      };
    } catch (error) {
      console.error('Error getting NFT details:', error);
      throw new Error('Failed to get NFT details');
    }
  }

  // Check if wallet has enough SOL for minting
  async checkMintingCosts(): Promise<{ hasEnoughSOL: boolean; estimatedCost: number; currentBalance: number }> {
    const wallet = walletService.getCurrentWallet();
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await walletService.getBalance();
      const estimatedCost = 0.01; // ~0.01 SOL for minting costs
      
      return {
        hasEnoughSOL: balance >= estimatedCost,
        estimatedCost,
        currentBalance: balance,
      };
    } catch (error) {
      console.error('Error checking minting costs:', error);
      throw new Error('Failed to check minting costs');
    }
  }

  // Verify NFT ownership
  async verifyNFTOwnership(nftMintAddress: string, ownerPublicKey: string): Promise<boolean> {
    try {
      const mint = new PublicKey(nftMintAddress);
      const owner = new PublicKey(ownerPublicKey);
      
      // Get token accounts for this owner and mint
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

  // Get network information
  getNetworkInfo(): { network: string; rpcUrl: string } {
    return {
      network: CONFIG.SOLANA.NETWORK,
      rpcUrl: CONFIG.SOLANA.RPC_URL,
    };
  }
}

// Export singleton instance
export const solanaService = new RealSolanaService(); 