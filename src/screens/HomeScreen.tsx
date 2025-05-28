import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../contexts/AppContext';
import { RootStackParamList } from '../types';
import { formatDate, getStreakMessage, getMoodEmoji, truncateText } from '../utils';
import Logo from '../components/Logo';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { 
    user, 
    entries, 
    loading, 
    getTodayEntry, 
    refreshData 
  } = useApp();

  const todayEntry = getTodayEntry();
  const recentEntries = entries.slice(0, 5);
  const hasWrittenToday = todayEntry !== null;

  const handleWriteToday = () => {
    if (hasWrittenToday && todayEntry) {
      navigation.navigate('NewEntry', { entryId: todayEntry.id });
    } else {
      navigation.navigate('NewEntry', {});
    }
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handleViewMoodGraph = () => {
    navigation.navigate('MoodGraph');
  };

  const handleEntryPress = (entryId: string) => {
    navigation.navigate('NewEntry', { entryId });
  };

  const handleMintNFT = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    if (!user?.walletAddress) {
      Alert.alert(
        'Wallet Required',
        'Connect a Solana wallet to mint your journal entry as an NFT.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Wallet', onPress: handleViewProfile },
        ]
      );
      return;
    }

    if (entry.isMinted) {
      Alert.alert('Already Minted', 'This entry has already been minted as an NFT.');
      return;
    }

    navigation.navigate('MintNFT', { entryId });
  };

  const renderWelcomeHeader = () => (
    <View style={styles.welcomeHeader}>
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.userGreeting}>Continue your mindfulness journey</Text>
      </View>
      <Logo size="medium" variant="light" showText={false} />
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your Journey Progress</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statItem, styles.streakStat]}>
          <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
          <Text style={styles.streakIcon}>🔥</Text>
        </View>
        <View style={[styles.statItem, styles.pointsStat]}>
          <Text style={styles.statValue}>{user?.totalClarityPoints || 0}</Text>
          <Text style={styles.statLabel}>Clarity Points</Text>
          <Text style={styles.pointsIcon}>✨</Text>
        </View>
        <View style={[styles.statItem, styles.nftStat]}>
          <Text style={styles.statValue}>{entries.filter(e => e.isMinted).length}</Text>
          <Text style={styles.statLabel}>NFTs Minted</Text>
          <Text style={styles.nftIcon}>🎨</Text>
        </View>
      </View>
      <Text style={styles.streakMessage}>
        {getStreakMessage(user?.currentStreak || 0)}
      </Text>
    </View>
  );

  const renderTodayCard = () => (
    <TouchableOpacity style={styles.todayCard} onPress={handleWriteToday}>
      <View style={styles.todayHeader}>
        <Text style={styles.todayTitle}>
          {hasWrittenToday ? "Today's Entry" : "Write Today's Entry"}
        </Text>
        <Text style={styles.todayIcon}>
          {hasWrittenToday ? "✨" : "📝"}
        </Text>
      </View>
      {hasWrittenToday && todayEntry ? (
        <View style={styles.todayContent}>
          <View style={styles.moodRow}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(todayEntry.mood)}</Text>
            <Text style={styles.moodText}>Feeling {todayEntry.mood}</Text>
          </View>
          <Text style={styles.entryPreview}>
            {truncateText(todayEntry.content, 100)}
          </Text>
          <View style={styles.editBadge}>
            <Text style={styles.editHint}>Tap to edit</Text>
          </View>
        </View>
      ) : (
        <View style={styles.writePromptContainer}>
          <Text style={styles.writePrompt}>
            How are you feeling today? Start your daily reflection...
          </Text>
          <View style={styles.startWritingBadge}>
            <Text style={styles.startWritingText}>Start Writing →</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.profileAction]} onPress={handleViewProfile}>
          <Text style={styles.actionEmoji}>👤</Text>
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.insightsAction]} onPress={handleViewMoodGraph}>
          <Text style={styles.actionEmoji}>📊</Text>
          <Text style={styles.actionText}>Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.settingsAction]} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.actionEmoji}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEntryItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.entryItem}
      onPress={() => handleEntryPress(item.id)}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryDateMood}>
          <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
          <View style={styles.moodBadge}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood)}</Text>
            <Text style={styles.moodLabel}>{item.mood}</Text>
          </View>
        </View>
        {item.isMinted && (
          <View style={styles.nftBadge}>
            <Text style={styles.nftText}>NFT ✨</Text>
          </View>
        )}
      </View>
      <Text style={styles.entryContent}>
        {truncateText(item.content, 150)}
      </Text>
      <View style={styles.entryFooter}>
        <Text style={styles.clarityPoints}>
          +{item.clarityPoints} clarity points
        </Text>
        {!item.isMinted && (
          <TouchableOpacity 
            style={styles.mintButton}
            onPress={() => handleMintNFT(item.id)}
          >
            <Text style={styles.mintButtonText}>Mint NFT</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshData} />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderWelcomeHeader()}
      {renderStatsCard()}
      {renderTodayCard()}
      {renderQuickActions()}
      
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {recentEntries.length > 0 ? (
          <FlatList
            data={recentEntries}
            renderItem={renderEntryItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📖</Text>
            <Text style={styles.emptyStateTitle}>No entries yet</Text>
            <Text style={styles.emptyStateText}>
              Start your mindfulness journey by writing your first entry!
            </Text>
            <TouchableOpacity style={styles.firstEntryButton} onPress={handleWriteToday}>
              <Text style={styles.firstEntryButtonText}>Write First Entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  welcomeHeader: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userGreeting: {
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    position: 'relative',
  },
  streakStat: {
    backgroundColor: '#fee2e2',
  },
  pointsStat: {
    backgroundColor: '#fef3c7',
  },
  nftStat: {
    backgroundColor: '#ddd6fe',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  streakIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
  },
  pointsIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
  },
  nftIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
  },
  streakMessage: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  todayCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  todayIcon: {
    fontSize: 24,
  },
  todayContent: {
    // styles for when entry exists
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  moodText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  entryPreview: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  editBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editHint: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  writePromptContainer: {
    // styles for when no entry exists
  },
  writePrompt: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  startWritingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  startWritingText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  quickActions: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileAction: {
    backgroundColor: '#ecfdf5',
  },
  insightsAction: {
    backgroundColor: '#eff6ff',
  },
  settingsAction: {
    backgroundColor: '#fef3c7',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  recentSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  entryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  entryDateMood: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginRight: 12,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  nftBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nftText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  entryContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clarityPoints: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  mintButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mintButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  firstEntryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  firstEntryButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
}); 