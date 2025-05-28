import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../contexts/AppContext';
import { RootStackParamList } from '../types';
import { CONFIG } from '../config';
import Logo from '../components/Logo';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { 
    user, 
    walletConnected, 
    loading,
    connectWallet, 
    disconnectWallet, 
    getWalletBalance, 
    requestAirdrop,
    refreshData,
  } = useApp();

  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingAirdrop, setLoadingAirdrop] = useState(false);

  useEffect(() => {
    if (walletConnected) {
      loadBalance();
    }
  }, [walletConnected]);

  const loadBalance = async () => {
    if (!walletConnected) return;
    
    setLoadingBalance(true);
    try {
      const walletBalance = await getWalletBalance();
      setBalance(walletBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
      Alert.alert('Error', 'Failed to load wallet balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleConnectWallet = async (walletType: 'phantom' | 'solflare' | 'mock') => {
    try {
      await connectWallet(walletType);
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Alert.alert('Error', 'Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnectWallet = async () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectWallet();
              setBalance(null);
              Alert.alert('Success', 'Wallet disconnected successfully!');
            } catch (error) {
              console.error('Error disconnecting wallet:', error);
              Alert.alert('Error', 'Failed to disconnect wallet');
            }
          },
        },
      ]
    );
  };

  const handleRequestAirdrop = async () => {
    if (CONFIG.SOLANA.NETWORK !== 'devnet') {
      Alert.alert('Not Available', 'Airdrop is only available on devnet');
      return;
    }

    Alert.alert(
      'Request Airdrop',
      'Request 1 SOL for testing? (Devnet only)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            setLoadingAirdrop(true);
            try {
              const signature = await requestAirdrop(1);
              Alert.alert('Success', `Airdrop requested! Transaction: ${signature.slice(0, 8)}...`);
              setTimeout(() => loadBalance(), 2000); // Reload balance after a delay
            } catch (error) {
              console.error('Error requesting airdrop:', error);
              Alert.alert('Error', 'Failed to request airdrop. Please try again.');
            } finally {
              setLoadingAirdrop(false);
            }
          },
        },
      ]
    );
  };

  const renderUserStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Your Journey Stats</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.totalClarityPoints || 0}</Text>
          <Text style={styles.statLabel}>Total Clarity Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.longestStreak || 0}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
      </View>
    </View>
  );

  const renderWalletSection = () => {
    if (!walletConnected) {
      return (
        <View style={styles.walletSection}>
          <Text style={styles.sectionTitle}>Connect Solana Wallet</Text>
          <Text style={styles.walletDescription}>
            Connect your Solana wallet to mint journal entries as NFTs and earn rewards.
          </Text>
          
          <View style={styles.walletButtons}>
            <TouchableOpacity 
              style={[styles.walletButton, styles.phantomButton]}
              onPress={() => handleConnectWallet('phantom')}
            >
              <Text style={styles.walletButtonText}>👻 Connect Phantom</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.walletButton, styles.solflareButton]}
              onPress={() => handleConnectWallet('solflare')}
            >
              <Text style={styles.walletButtonText}>☀️ Connect Solflare</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.walletSection}>
        <Text style={styles.sectionTitle}>Solana Wallet</Text>
        
        <View style={styles.connectedWallet}>
          <View style={styles.walletHeader}>
            <Text style={styles.connectedText}>✅ Wallet Connected</Text>
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={handleDisconnectWallet}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
          
          {user?.walletAddress && (
            <Text style={styles.walletAddress}>
              {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
            </Text>
          )}
          
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>SOL Balance:</Text>
            {loadingBalance ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Text style={styles.balanceValue}>
                {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
              </Text>
            )}
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadBalance}
              disabled={loadingBalance}
            >
              <Text style={styles.refreshButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
          
          {CONFIG.SOLANA.NETWORK === 'devnet' && (
            <TouchableOpacity 
              style={[styles.airdropButton, loadingAirdrop && styles.airdropButtonDisabled]}
              onPress={handleRequestAirdrop}
              disabled={loadingAirdrop}
            >
              <Text style={styles.airdropButtonText}>
                {loadingAirdrop ? 'Requesting...' : '💰 Request Airdrop (1 SOL)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderNetworkInfo = () => (
    <View style={styles.networkSection}>
      <Text style={styles.sectionTitle}>Network Information</Text>
      <View style={styles.networkInfo}>
        <View style={styles.networkItem}>
          <Text style={styles.networkLabel}>Network:</Text>
          <Text style={[styles.networkValue, CONFIG.SOLANA.NETWORK === 'devnet' && styles.devnetText]}>
            {CONFIG.SOLANA.NETWORK.toUpperCase()}
          </Text>
        </View>
        <View style={styles.networkItem}>
          <Text style={styles.networkLabel}>RPC Endpoint:</Text>
          <Text style={styles.networkValue}>
            {CONFIG.SOLANA.RPC_URL.includes('devnet') ? 'Devnet RPC' : 'Mainnet RPC'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshData} />
      }
    >
      <View style={styles.header}>
        <Logo size="large" variant="dark" />
        <Text style={styles.welcomeText}>Welcome to MindMint!</Text>
        <Text style={styles.subtitleText}>Manage your profile and wallet</Text>
      </View>

      {renderUserStats()}
      {renderWalletSection()}
      {renderNetworkInfo()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>MindMint v{CONFIG.VERSION}</Text>
        <Text style={styles.footerSubtext}>Tokenized Mindfulness on Solana</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  statsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  walletSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  walletButtons: {
    gap: 12,
  },
  walletButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  phantomButton: {
    backgroundColor: '#6366f1',
  },
  solflareButton: {
    backgroundColor: '#ff6b35',
  },
  walletButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectedWallet: {
    // styles for connected wallet state
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  walletAddress: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 4,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  airdropButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  airdropButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  airdropButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  networkSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  networkInfo: {
    gap: 12,
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  networkValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  devnetText: {
    color: '#f59e0b',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
}); 