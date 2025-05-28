import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../contexts/AppContext';
import { RootStackParamList, MoodType } from '../types';
import { getMoodEmoji, hasWrittenToday } from '../utils';
import Logo from '../components/Logo';

type NewEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewEntry'>;
type NewEntryScreenRouteProp = RouteProp<RootStackParamList, 'NewEntry'>;

const MOOD_OPTIONS: { mood: MoodType; emoji: string; color: string }[] = [
  { mood: 'happy', emoji: '😊', color: '#FFD700' },
  { mood: 'calm', emoji: '😌', color: '#98FB98' },
  { mood: 'excited', emoji: '🤩', color: '#FF69B4' },
  { mood: 'grateful', emoji: '🙏', color: '#F0E68C' },
  { mood: 'sad', emoji: '😢', color: '#87CEEB' },
  { mood: 'anxious', emoji: '😰', color: '#FFA07A' },
  { mood: 'tired', emoji: '😴', color: '#9370DB' },
  { mood: 'angry', emoji: '😠', color: '#FF6347' },
];

const PROMPTS = [
  "How are you feeling right now?",
  "What made you smile today?",
  "What are you grateful for?",
  "What's on your mind?",
  "Describe your day in three words...",
  "What lesson did you learn today?",
  "What would you tell your younger self?",
  "What are you looking forward to?",
];

export default function NewEntryScreen() {
  const navigation = useNavigation<NewEntryScreenNavigationProp>();
  const route = useRoute<NewEntryScreenRouteProp>();
  const { createEntry, updateEntry, entries, user } = useApp();
  
  // Get existing entry if editing
  const existingEntry = route.params?.entryId 
    ? entries.find(e => e.id === route.params.entryId)
    : null;
  
  // State
  const [content, setContent] = useState(existingEntry?.content || '');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(existingEntry?.mood || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [wordCount, setWordCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Refs and animations
  const textInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Calculate word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);
  
  // Track unsaved changes
  useEffect(() => {
    const hasChanges = existingEntry 
      ? (content !== existingEntry.content || selectedMood !== existingEntry.mood)
      : (content.trim().length > 0 || selectedMood !== null);
    setHasUnsavedChanges(hasChanges);
  }, [content, selectedMood, existingEntry]);
  
  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Focus text input after animation
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 300);
  }, []);
  
  // Navigation header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Logo size="small" variant="light" showText={false} />
          <Text style={styles.headerTitle}>
            {existingEntry ? 'Edit Entry' : 'New Journal Entry'}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
        >
          <Text style={[
            styles.headerButtonText,
            (!hasUnsavedChanges || isSaving) && styles.headerButtonDisabled
          ]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleBack}
        >
          <Text style={styles.headerButtonText}>
            {hasUnsavedChanges ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, hasUnsavedChanges, isSaving, existingEntry]);
  
  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };
  
  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert('Select Your Mood', 'Please select how you\'re feeling to continue.');
      return;
    }
    
    if (content.trim().length < 10) {
      Alert.alert('Write More', 'Please write at least 10 characters for your journal entry.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (existingEntry) {
        // Update existing entry
        await updateEntry(existingEntry.id, {
          content: content.trim(),
          mood: selectedMood,
        });
        Alert.alert('Entry Updated', 'Your journal entry has been updated successfully!');
      } else {
        // Create new entry
        await createEntry(content.trim(), selectedMood);
        Alert.alert('Entry Saved', 'Your journal entry has been saved successfully!');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Save Failed', 'Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    Keyboard.dismiss();
  };
  
  const handlePromptSelect = (prompt: string) => {
    setContent(prev => prev + (prev ? '\n\n' : '') + prompt + ' ');
    setShowPrompts(false);
    textInputRef.current?.focus();
  };
  
  const getRandomPrompt = () => {
    const availablePrompts = PROMPTS.filter(p => p !== currentPrompt);
    const newPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    setCurrentPrompt(newPrompt);
  };
  
  const screenHeight = Dimensions.get('window').height;
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.dateText}>
            {existingEntry 
              ? `${new Date(existingEntry.createdAt).toDateString() === new Date().toDateString() ? 'Today' : 'Edited'} • ${new Date(existingEntry.createdAt).toLocaleDateString()}`
              : `Today • ${new Date().toLocaleDateString()}`
            }
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.wordCountText}>
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.clarityPointsText}>
              +{Math.max(10, Math.floor(wordCount / 10) * 2)} clarity points
            </Text>
          </View>
        </View>
        
        {/* Mood Selection */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>How are you feeling? 💭</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.moodScrollView}
            contentContainerStyle={styles.moodContainer}
          >
            {MOOD_OPTIONS.map(({ mood, emoji, color }) => (
              <TouchableOpacity
                key={mood}
                style={[
                  styles.moodButton,
                  selectedMood === mood && { backgroundColor: color + '20', borderColor: color },
                ]}
                onPress={() => handleMoodSelect(mood)}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood && { color: color, fontWeight: 'bold' }
                ]}>
                  {mood}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Writing Prompts */}
        {!existingEntry && (
          <View style={styles.promptSection}>
            <TouchableOpacity 
              style={styles.promptButton}
              onPress={() => setShowPrompts(!showPrompts)}
            >
              <Text style={styles.promptButtonText}>
                💡 Need inspiration?
              </Text>
            </TouchableOpacity>
            
            {showPrompts && (
              <View style={styles.promptsList}>
                <TouchableOpacity 
                  style={styles.promptItem}
                  onPress={() => handlePromptSelect(currentPrompt)}
                >
                  <Text style={styles.promptText}>{currentPrompt}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.refreshPromptButton}
                  onPress={getRandomPrompt}
                >
                  <Text style={styles.refreshPromptText}>🔄 Get another prompt</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Text Input */}
        <View style={styles.textInputSection}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, { minHeight: screenHeight * 0.3 }]}
            placeholder={existingEntry ? 'Edit your thoughts...' : 'What\'s on your mind today?'}
            placeholderTextColor="#9ca3af"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoCorrect
            autoCapitalize="sentences"
            scrollEnabled={true}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>
        
        {/* Tips */}
        {!existingEntry && content.length < 50 && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>✨ Writing Tips:</Text>
            <Text style={styles.tipText}>• Be honest about your feelings</Text>
            <Text style={styles.tipText}>• Notice what you're grateful for</Text>
            <Text style={styles.tipText}>• Reflect on your day's highlights</Text>
            <Text style={styles.tipText}>• Write without judgment</Text>
          </View>
        )}
        
        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[styles.saveButton, (!hasUnsavedChanges || !selectedMood) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasUnsavedChanges || !selectedMood || isSaving}
          >
            <Text style={[styles.saveButtonText, (!hasUnsavedChanges || !selectedMood) && styles.saveButtonTextDisabled]}>
              {isSaving ? '⏳ Saving...' : `💾 ${existingEntry ? 'Update' : 'Save'} Entry`}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  headerInfo: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordCountText: {
    fontSize: 14,
    color: '#6b7280',
  },
  clarityPointsText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  moodSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  moodScrollView: {
    marginBottom: 8,
  },
  moodContainer: {
    paddingHorizontal: 4,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 70,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  promptSection: {
    marginBottom: 20,
  },
  promptButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  promptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  promptsList: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  promptItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  refreshPromptButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  refreshPromptText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  textInputSection: {
    flex: 1,
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsSection: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
  },
  bottomActions: {
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtonDisabled: {
    color: '#9ca3af',
  },
}); 