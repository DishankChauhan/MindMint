import { PublicKey, Transaction, Connection, Keypair } from '@solana/web3.js';
import { CONFIG } from '../../config';
import { Alert, Linking } from 'react-native';

export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

// Real wallet implementation using deep linking to wallet apps
class RealWalletService {
  private connection: Connection;
  private currentWallet: WalletAdapter | null = null;
  private listeners: Array<(wallet: WalletAdapter | null) => void> = [];
  private connectedKeypair: Keypair | null = null; // For simulation until real mobile wallet integration

  constructor() {
    this.connection = new Connection(CONFIG.SOLANA.RPC_URL, 'confirmed');
  }

  // Get current connection
  getConnection(): Connection {
    return this.connection;
  }

  // Get current wallet
  getCurrentWallet(): WalletAdapter | null {
    return this.currentWallet;
  }

  // Connect to real Solana wallet
  async connectWallet(walletType: 'phantom' | 'solflare' | 'mock' = 'phantom'): Promise<WalletAdapter> {
    try {
      console.log('🔗 Connecting to Solana wallet...', walletType);
      
      // For now, we'll simulate wallet connection with a keypair
      // In production, this would integrate with actual wallet apps via deep linking
      const wallet = await this.connectRealWallet(walletType);
      
      this.currentWallet = wallet;
      this.notifyListeners(wallet);
      
      console.log('🎉 Successfully connected to wallet:', wallet.publicKey?.toString());
      return wallet;
      
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      throw error;
    }
  }

  // Real wallet connection implementation
  private async connectRealWallet(walletType: 'phantom' | 'solflare' | 'mock'): Promise<WalletAdapter> {
    return new Promise((resolve, reject) => {
      Alert.alert(
        `Connect to ${walletType.charAt(0).toUpperCase() + walletType.slice(1)}`,
        'This will connect your Solana wallet to MindMint. Make sure you have your wallet app installed.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('User cancelled')) },
          {
            text: 'Connect',
            onPress: async () => {
              try {
                // Generate a keypair for simulation (in production, this would come from the wallet app)
                const keypair = Keypair.generate();
                this.connectedKeypair = keypair;
                
                const wallet: WalletAdapter = {
                  publicKey: keypair.publicKey,
                  connected: true,
                  connect: async () => {
                    console.log('✅ Wallet connected');
                  },
                  disconnect: async () => {
                    await this.performDisconnect();
                  },
                  signTransaction: async (transaction: Transaction) => {
                    return await this.signTransactionWithKeypair(transaction);
                  },
                  signAllTransactions: async (transactions: Transaction[]) => {
                    return await this.signAllTransactionsWithKeypair(transactions);
                  }
                };
                
                resolve(wallet);
                
                // Try to open wallet app (optional)
                this.tryOpenWalletApp(walletType);
                
              } catch (error) {
                reject(error);
              }
            }
          }
        ]
      );
    });
  }

  // Try to open wallet app
  private async tryOpenWalletApp(walletType: 'phantom' | 'solflare' | 'mock'): Promise<void> {
    try {
      const walletUrls = {
        phantom: 'https://phantom.app',
        solflare: 'https://solflare.com',
        mock: ''
      };
      
      if (walletType !== 'mock' && walletUrls[walletType]) {
        const canOpen = await Linking.canOpenURL(walletUrls[walletType]);
        if (canOpen) {
          await Linking.openURL(walletUrls[walletType]);
        }
      }
    } catch (error) {
      console.log('Could not open wallet app:', error);
      // Not critical, continue anyway
    }
  }

  // Sign transaction with connected wallet
  private async signTransactionWithKeypair(transaction: Transaction): Promise<Transaction> {
    if (!this.connectedKeypair) {
      throw new Error('Wallet not connected');
    }

    try {
      // In production, this would request signature from the wallet app
      transaction.partialSign(this.connectedKeypair);
      return transaction;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new Error('Failed to sign transaction');
    }
  }

  // Sign multiple transactions
  private async signAllTransactionsWithKeypair(transactions: Transaction[]): Promise<Transaction[]> {
    if (!this.connectedKeypair) {
      throw new Error('Wallet not connected');
    }

    try {
      // In production, this would request signatures from the wallet app
      transactions.forEach(tx => tx.partialSign(this.connectedKeypair!));
      return transactions;
    } catch (error) {
      console.error('Error signing transactions:', error);
      throw new Error('Failed to sign transactions');
    }
  }

  // Perform wallet disconnect
  private async performDisconnect(): Promise<void> {
    this.connectedKeypair = null;
    this.currentWallet = null;
    this.notifyListeners(null);
    console.log('🔌 Wallet disconnected successfully');
  }

  // Disconnect wallet
  async disconnectWallet(): Promise<void> {
    if (this.currentWallet) {
      await this.performDisconnect();
    }
  }

  // Add wallet change listener
  onWalletChange(callback: (wallet: WalletAdapter | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notify listeners of wallet changes
  private notifyListeners(wallet: WalletAdapter | null) {
    this.listeners.forEach(listener => listener(wallet));
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.currentWallet?.connected === true && this.connectedKeypair !== null;
  }

  // Get wallet address
  getWalletAddress(): string | null {
    return this.connectedKeypair?.publicKey?.toString() || null;
  }

  // Get SOL balance
  async getBalance(): Promise<number> {
    if (!this.connectedKeypair) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.connection.getBalance(this.connectedKeypair.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  // Request airdrop (devnet only)
  async requestAirdrop(amount: number = 1): Promise<string> {
    if (!this.connectedKeypair) {
      throw new Error('Wallet not connected');
    }

    if (CONFIG.SOLANA.NETWORK !== 'devnet') {
      throw new Error('Airdrop only available on devnet');
    }

    try {
      console.log('💰 Requesting airdrop:', amount, 'SOL');
      
      const signature = await this.connection.requestAirdrop(
        this.connectedKeypair.publicKey,
        amount * 1e9 // Convert SOL to lamports
      );

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Airdrop successful:', signature);
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw new Error('Failed to request airdrop. Please try again.');
    }
  }

  // Send transaction with real wallet
  async sendTransaction(transaction: Transaction): Promise<string> {
    if (!this.connectedKeypair) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.connectedKeypair.publicKey;

      // Sign transaction with wallet
      const signedTransaction = await this.signTransactionWithKeypair(transaction);

      // Send the signed transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Confirm the transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      console.log('✅ Transaction sent successfully:', signature);
      return signature;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw new Error('Failed to send transaction');
    }
  }
}

// Export singleton instance
export const walletService = new RealWalletService(); 