import { JournalEntry, User, ClarityPointsBreakdown, MoodType } from '../types';

// Clarity Points System
export const CLARITY_POINTS = {
  DAILY_ENTRY: 10,
  MOOD_TRACKING: 5,
  NFT_MINTING: 20,
  STREAK_3_DAYS: 15,
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 200,
} as const;

// Calculate clarity points for a journal entry
export function calculateClarityPoints(
  entry: JournalEntry,
  currentStreak: number,
  isMoodTracked: boolean = true
): ClarityPointsBreakdown {
  let dailyEntry = CLARITY_POINTS.DAILY_ENTRY;
  let moodTracking = isMoodTracked ? CLARITY_POINTS.MOOD_TRACKING : 0;
  let nftMinting = entry.isMinted ? CLARITY_POINTS.NFT_MINTING : 0;
  let streakBonus = 0;

  // Calculate streak bonus
  if (currentStreak >= 30) {
    streakBonus = CLARITY_POINTS.STREAK_30_DAYS;
  } else if (currentStreak >= 7) {
    streakBonus = CLARITY_POINTS.STREAK_7_DAYS;
  } else if (currentStreak >= 3) {
    streakBonus = CLARITY_POINTS.STREAK_3_DAYS;
  }

  const total = dailyEntry + moodTracking + nftMinting + streakBonus;

  return {
    dailyEntry,
    moodTracking,
    nftMinting,
    streakBonus,
    total,
  };
}

// Calculate user streak
export function calculateStreak(entries: JournalEntry[], user: User): number {
  if (entries.length === 0) return 0;

  // Sort entries by date (newest first)
  const sortedEntries = entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Start of today

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      // Gap in streak, break
      break;
    }
  }

  return streak;
}

// Check if user has written today
export function hasWrittenToday(entries: JournalEntry[]): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return entries.some(entry => {
    const entryDate = new Date(entry.createdAt);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
}

// Get entries from the last N days
export function getRecentEntries(entries: JournalEntry[], days: number): JournalEntry[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return entries.filter(entry => entry.createdAt >= cutoffDate);
}

// Get mood distribution for analytics
export function getMoodDistribution(entries: JournalEntry[]): { [key in MoodType]?: number } {
  const distribution: { [key in MoodType]?: number } = {};

  entries.forEach(entry => {
    distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
  });

  return distribution;
}

// Get weekly mood data for charts
export function getWeeklyMoodData(entries: JournalEntry[]): Array<{ date: string; mood: MoodType; points: number }> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentEntries = entries.filter(entry => entry.createdAt >= weekAgo);

  return recentEntries.map(entry => ({
    date: entry.createdAt.toISOString().split('T')[0],
    mood: entry.mood,
    points: entry.clarityPoints,
  }));
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
}

// Generate encouraging messages based on streak
export function getStreakMessage(streak: number): string {
  if (streak === 0) {
    return "Start your mindfulness journey today! 🌱";
  } else if (streak === 1) {
    return "Great start! Keep the momentum going! 💫";
  } else if (streak < 3) {
    return `${streak} days strong! You're building a habit! 🔥`;
  } else if (streak < 7) {
    return `${streak} day streak! You're on fire! 🔥✨`;
  } else if (streak < 30) {
    return `Amazing ${streak} day streak! You're a mindfulness champion! 🏆`;
  } else {
    return `Incredible ${streak} day streak! You're a true MindMint master! 👑`;
  }
}

// Generate motivational quotes for different moods
export function getMotivationalQuote(mood: MoodType): string {
  const quotes: { [key in MoodType]: string[] } = {
    happy: [
      "Happiness is not by chance, but by choice. 😊",
      "Joy shared is joy doubled! ✨",
      "Your smile is your superpower! 🌟"
    ],
    sad: [
      "It's okay to feel sad. This too shall pass. 🌈",
      "Every storm runs out of rain. 💙",
      "You're stronger than you know. 💪"
    ],
    calm: [
      "In the midst of chaos, find stillness. 🧘‍♀️",
      "Peace comes from within. 🕊️",
      "Calm mind brings inner strength. 🌿"
    ],
    anxious: [
      "You've survived 100% of your bad days. 💪",
      "Breathe. You've got this. 🌸",
      "Anxiety is temporary, strength is permanent. 🦋"
    ],
    excited: [
      "Channel that energy into something amazing! ⚡",
      "Excitement is the spark of creativity! 🎨",
      "Your enthusiasm is contagious! 🚀"
    ],
    tired: [
      "Rest is not a luxury, it's a necessity. 😴",
      "Taking breaks makes you stronger. 🌙",
      "Tomorrow is a new day with new energy. ☀️"
    ],
    grateful: [
      "Gratitude turns what we have into enough. 🙏",
      "A grateful heart is a magnet for miracles. ✨",
      "Thankfulness is the beginning of happiness. 💛"
    ],
    angry: [
      "Anger is one letter short of danger. Breathe. 🌊",
      "Your peace is more important than their opinion. 🕯️",
      "Transform anger into positive action. 🔥"
    ]
  };

  const moodQuotes = quotes[mood];
  return moodQuotes[Math.floor(Math.random() * moodQuotes.length)];
}

// Validate journal entry content
export function validateJournalEntry(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push("Journal entry cannot be empty");
  }

  if (content.trim().length < 10) {
    errors.push("Journal entry should be at least 10 characters long");
  }

  if (content.length > 5000) {
    errors.push("Journal entry cannot exceed 5000 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get mood color for UI
export function getMoodColor(mood: MoodType): string {
  const colors: { [key in MoodType]: string } = {
    happy: '#FFD700',
    sad: '#87CEEB',
    calm: '#98FB98',
    anxious: '#FFA07A',
    excited: '#FF69B4',
    tired: '#9370DB',
    grateful: '#F0E68C',
    angry: '#FF6347',
  };
  return colors[mood];
}

// Get mood emoji
export function getMoodEmoji(mood: MoodType): string {
  const emojis: { [key in MoodType]: string } = {
    happy: '😊',
    sad: '😢',
    calm: '😌',
    anxious: '😰',
    excited: '🤩',
    tired: '😴',
    grateful: '🙏',
    angry: '😠',
  };
  return emojis[mood];
}

// Generate a unique ID
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
} 