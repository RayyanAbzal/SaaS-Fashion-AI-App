import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Achievement, WardrobeItem } from '../types';

export class AchievementService {
  private static readonly ACHIEVEMENTS = {
    WARDROBE_MILESTONES: [
      { id: 'wardrobe_5', title: 'Starting Collection', description: 'Add 5 items to your wardrobe', threshold: 5 },
      { id: 'wardrobe_20', title: 'Growing Collection', description: 'Add 20 items to your wardrobe', threshold: 20 },
      { id: 'wardrobe_50', title: 'Fashion Enthusiast', description: 'Add 50 items to your wardrobe', threshold: 50 },
      { id: 'wardrobe_100', title: 'Fashion Expert', description: 'Add 100 items to your wardrobe', threshold: 100 }
    ],
    STYLE_STREAKS: [
      { id: 'style_streak_3', title: 'Style Streak', description: 'Create outfits 3 days in a row', threshold: 3 },
      { id: 'style_streak_7', title: 'Style Week', description: 'Create outfits 7 days in a row', threshold: 7 },
      { id: 'style_streak_30', title: 'Style Master', description: 'Create outfits 30 days in a row', threshold: 30 }
    ],
    CATEGORY_COMPLETION: [
      { id: 'category_tops', title: 'Top Collector', description: 'Add 10 different tops', threshold: 10 },
      { id: 'category_bottoms', title: 'Bottom Collector', description: 'Add 10 different bottoms', threshold: 10 },
      { id: 'category_shoes', title: 'Shoe Collector', description: 'Add 10 different shoes', threshold: 10 },
      { id: 'category_accessories', title: 'Accessory Collector', description: 'Add 10 different accessories', threshold: 10 }
    ],
    SOCIAL_ENGAGEMENT: [
      { id: 'social_likes_10', title: 'Rising Star', description: 'Get 10 likes on your outfits', threshold: 10 },
      { id: 'social_likes_50', title: 'Style Icon', description: 'Get 50 likes on your outfits', threshold: 50 },
      { id: 'social_shares_5', title: 'Trendsetter', description: 'Have 5 people share your outfits', threshold: 5 }
    ]
  };

  static async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    try {
      // Get user's current wardrobe
      const wardrobeRef = collection(db, 'users', userId, 'wardrobe');
      const wardrobeSnapshot = await getDocs(wardrobeRef);
      const wardrobeItems = wardrobeSnapshot.docs.map(doc => ({ ...doc.data() } as WardrobeItem));

      // Get user's current achievements
      const achievementsRef = collection(db, 'users', userId, 'achievements');
      const achievementsSnapshot = await getDocs(achievementsRef);
      const currentAchievements = achievementsSnapshot.docs.map(doc => ({ ...doc.data() } as Achievement));

      // Check wardrobe milestones
      const totalItems = wardrobeItems.length;
      for (const milestone of this.ACHIEVEMENTS.WARDROBE_MILESTONES) {
        if (totalItems >= milestone.threshold && !this.hasAchievement(currentAchievements, milestone.id)) {
          const achievement = await this.awardAchievement(userId, {
            id: milestone.id,
            userId,
            title: milestone.title,
            description: milestone.description,
            type: 'wardrobe',
            unlockedAt: new Date(),
            icon: '👕',
            progress: totalItems,
            maxProgress: milestone.threshold
          });
          newAchievements.push(achievement);
        }
      }

      // Check category completion
      const itemsByCategory = this.groupByCategory(wardrobeItems);
      for (const milestone of this.ACHIEVEMENTS.CATEGORY_COMPLETION) {
        const category = milestone.id.split('_')[1];
        const categoryItems = itemsByCategory[category] || [];
        if (categoryItems.length >= milestone.threshold && !this.hasAchievement(currentAchievements, milestone.id)) {
          const achievement = await this.awardAchievement(userId, {
            id: milestone.id,
            userId,
            title: milestone.title,
            description: milestone.description,
            type: 'category',
            unlockedAt: new Date(),
            icon: this.getCategoryIcon(category),
            progress: categoryItems.length,
            maxProgress: milestone.threshold
          });
          newAchievements.push(achievement);
        }
      }

      // Check style streaks (requires integration with outfit creation history)
      const streakDays = await this.getStyleStreak(userId);
      for (const streak of this.ACHIEVEMENTS.STYLE_STREAKS) {
        if (streakDays >= streak.threshold && !this.hasAchievement(currentAchievements, streak.id)) {
          const achievement = await this.awardAchievement(userId, {
            id: streak.id,
            userId,
            title: streak.title,
            description: streak.description,
            type: 'streak',
            unlockedAt: new Date(),
            icon: '🔥',
            progress: streakDays,
            maxProgress: streak.threshold
          });
          newAchievements.push(achievement);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  private static hasAchievement(achievements: Achievement[], achievementId: string): boolean {
    return achievements.some(a => a.id === achievementId);
  }

  private static async awardAchievement(userId: string, achievement: Achievement): Promise<Achievement> {
    const achievementRef = doc(db, 'users', userId, 'achievements', achievement.id);
    await setDoc(achievementRef, achievement);
    return achievement;
  }

  private static groupByCategory(items: WardrobeItem[]): Record<string, WardrobeItem[]> {
    return items.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, WardrobeItem[]>);
  }

  private static getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      tops: '👕',
      bottoms: '👖',
      shoes: '👟',
      accessories: '👜',
      outerwear: '🧥'
    };
    return icons[category] || '👕';
  }

  private static async getStyleStreak(userId: string): Promise<number> {
    try {
      const outfitsRef = collection(db, 'users', userId, 'outfits');
      const outfitsSnapshot = await getDocs(outfitsRef);
      const outfits = outfitsSnapshot.docs.map(doc => doc.data());

      // Sort outfits by date
      const sortedDates = outfits
        .map(outfit => outfit.createdAt.toDate())
        .sort((a, b) => b.getTime() - a.getTime());

      if (sortedDates.length === 0) return 0;

      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedDates.length - 1; i++) {
        const currentDate = new Date(sortedDates[i]);
        currentDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(sortedDates[i + 1]);
        nextDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating style streak:', error);
      return 0;
    }
  }
} 