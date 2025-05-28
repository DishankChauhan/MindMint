import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../contexts/AppContext';
import { RootStackParamList, JournalEntry } from '../types';
import { CONFIG } from '../config';
import Logo from '../components/Logo';

type MintNFTScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MintNFT'>;
type MintNFTScreenRouteProp = RouteProp<RootStackParamList, 'MintNFT'>;

export default function MintNFTScreen() {
  const navigation = useNavigation<MintNFTScreenNavigationProp>();
  const route = useRoute<MintNFTScreenRouteProp>();
  const { entryId } = route.params;

  const { 
    entries, 
    walletConnected, 
    mintEntryAsNFT,
    connectWallet,
  } = useApp();

  const [minting, setMinting] = useState(false);
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const foundEntry = entries.find(e => e.id === entryId);
    setEntry(foundEntry || null);
  }, [entryId, entries]);

  const getMoodEmoji = (mood: string): string => {
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
  };

  const getMoodColor = (mood: string): string => {
    const moodColors: { [key: string]: string } = {
      happy: '#fef3c7',
      sad: '#dbeafe',
      calm: '#d1fae5',
      anxious: '#fed7aa',
      excited: '#fce7f3',
      tired: '#e9d5ff',
      grateful: '#fef9e3',
      angry: '#fee2e2',
    };
    return moodColors[mood] || '#f3f4f6';
  };

  const handleMintNFT = async () => {
    if (!entry) return;

    if (!walletConnected) {
      Alert.alert(
        'Wallet Required',
        'You need to connect a Solana wallet to mint NFTs. Would you like to connect now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect Wallet',
            onPress: () => navigation.navigate('Profile'),
          },
        ]
      );
      return;
    }

    if (entry.isMinted) {
      Alert.alert('Already Minted', 'This journal entry has already been minted as an NFT.');
      return;
    }

    Alert.alert(
      'Mint Journal Entry as NFT',
      `This will mint your journal entry "${entry.content.slice(0, 50)}..." as a unique NFT on the Solana blockchain.\n\nCost: ~0.001 SOL\nReward: ${CONFIG.CLARITY_POINTS.NFT_MINTING} Clarity Points`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mint NFT',
          onPress: performMint,
        },
      ]
    );
  };

  const performMint = async () => {
    if (!entry) return;

    setMinting(true);
    try {
      const nftAddress = await mintEntryAsNFT(entry.id);
      
      Alert.alert(
        'NFT Minted Successfully! 🎉',
        `Your journal entry has been minted as an NFT!\n\nNFT Address: ${nftAddress.slice(0, 8)}...\n\nYou earned ${CONFIG.CLARITY_POINTS.NFT_MINTING} Clarity Points!`,
        [
          { text: 'View Profile', onPress: () => navigation.navigate('Profile') },
          { text: 'Back to Home', onPress: () => navigation.navigate('Home') },
        ]
      );
    } catch (error) {
      console.error('Error minting NFT:', error);
      Alert.alert(
        'Minting Failed',
        'Sorry, there was an error minting your NFT. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setMinting(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet('phantom'); // Use Phantom as default real wallet
      Alert.alert('Success', 'Wallet connected! You can now mint NFTs.');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Alert.alert('Error', 'Failed to connect wallet. Please try again.');
    }
  };

  if (!entry) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Journal entry not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderWalletRequirement = () => (
    <View style={styles.walletRequirement}>
      <Text style={styles.requirementTitle}>🔐 Wallet Required</Text>
      <Text style={styles.requirementText}>
        To mint journal entries as NFTs, you need to connect a Solana wallet.
      </Text>
      <TouchableOpacity 
        style={styles.connectWalletButton}
        onPress={handleConnectWallet}
      >
        <Text style={styles.connectWalletButtonText}>Connect Wallet</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAlreadyMinted = () => (
    <View style={styles.alreadyMinted}>
      <Text style={styles.alreadyMintedTitle}>✅ Already Minted</Text>
      <Text style={styles.alreadyMintedText}>
        This journal entry has been minted as an NFT!
      </Text>
      {entry.nftAddress && (
        <Text style={styles.nftAddress}>
          NFT Address: {entry.nftAddress.slice(0, 8)}...{entry.nftAddress.slice(-8)}
        </Text>
      )}
    </View>
  );

  const renderMintSection = () => {
    if (!walletConnected) {
      return renderWalletRequirement();
    }

    if (entry.isMinted) {
      return renderAlreadyMinted();
    }

    return (
      <View style={styles.mintSection}>
        <Text style={styles.mintTitle}>🎨 Mint as NFT</Text>
        <Text style={styles.mintDescription}>
          Transform your journal entry into a unique NFT on the Solana blockchain. 
          This creates a permanent, verifiable record of your mindfulness journey.
        </Text>
        
        <View style={styles.mintDetails}>
          <View style={styles.mintDetailItem}>
            <Text style={styles.mintDetailLabel}>Network:</Text>
            <Text style={styles.mintDetailValue}>{CONFIG.SOLANA.NETWORK.toUpperCase()}</Text>
          </View>
          <View style={styles.mintDetailItem}>
            <Text style={styles.mintDetailLabel}>Estimated Cost:</Text>
            <Text style={styles.mintDetailValue}>~0.001 SOL</Text>
          </View>
          <View style={styles.mintDetailItem}>
            <Text style={styles.mintDetailLabel}>Clarity Points Reward:</Text>
            <Text style={styles.mintDetailValue}>+{CONFIG.CLARITY_POINTS.NFT_MINTING} points</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.mintButton, minting && styles.mintButtonDisabled]}
          onPress={handleMintNFT}
          disabled={minting}
        >
          {minting ? (
            <View style={styles.mintingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.mintButtonText}>Minting NFT...</Text>
            </View>
          ) : (
            <Text style={styles.mintButtonText}>🚀 Mint NFT</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Logo size="medium" variant="dark" />
        <Text style={styles.headerTitle}>Mint Journal Entry</Text>
        <Text style={styles.headerSubtitle}>Create a unique NFT from your mindfulness</Text>
      </View>

      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={[styles.moodBadge, { backgroundColor: getMoodColor(entry.mood) }]}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
            <Text style={styles.moodText}>{entry.mood}</Text>
          </View>
          <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
        </View>
        
        <Text style={styles.entryContent}>{entry.content}</Text>
        
        <View style={styles.entryFooter}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>✨ {entry.clarityPoints} Clarity Points</Text>
          </View>
          {entry.isMinted && (
            <View style={styles.mintedBadge}>
              <Text style={styles.mintedText}>🎨 NFT</Text>
            </View>
          )}
        </View>
      </View>

      {renderMintSection()}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 What is NFT Minting?</Text>
        <Text style={styles.infoText}>
          Minting your journal entry as an NFT creates a unique, blockchain-verified token 
          that represents your mindfulness journey. This NFT is yours forever and can be 
          viewed in any Solana-compatible wallet or NFT marketplace.
        </Text>
        
        <Text style={styles.infoText}>
          • Permanent record on blockchain{'\n'}
          • Unique artwork generated from your entry{'\n'}
          • Earn additional Clarity Points{'\n'}
          • Own a piece of your mindfulness journey
        </Text>
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
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 16,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  mintedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mintedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  mintSection: {
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
  mintTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  mintDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  mintDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  mintDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mintDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  mintDetailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  mintButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mintButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  mintButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mintingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletRequirement: {
    backgroundColor: '#fff7ed',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  requirementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ea580c',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 16,
    color: '#9a3412',
    lineHeight: 24,
    marginBottom: 16,
  },
  connectWalletButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectWalletButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyMinted: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  alreadyMintedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  alreadyMintedText: {
    fontSize: 16,
    color: '#047857',
    lineHeight: 24,
    marginBottom: 8,
  },
  nftAddress: {
    fontSize: 14,
    color: '#065f46',
    fontFamily: 'monospace',
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8,
  },
  infoSection: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 