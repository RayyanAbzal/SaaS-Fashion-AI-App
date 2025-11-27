import { supabase, isSupabaseConfigured } from './supabase';
import * as Haptics from 'expo-haptics';

export interface GamificationData {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  lastActivityDate: Date | null;
  dailyActionsCount: number;
}

export interface XPTransaction {
  action: 'outfit_liked' | 'outfit_swiped' | 'style_checked' | 'perfume_recommended' | 'daily_login';
  amount: number;
  description: string;
}

class GamificationService {
  private static XP_VALUES = {
    outfit_liked: 10,
    outfit_swiped: 2,
    style_checked: 15,
    perfume_recommended: 5,
    daily_login: 20,
  };

  /**
   * Get user's gamification data
   */
  static async getUserGamification(userId: string): Promise<GamificationData> {
    if (!isSupabaseConfigured()) {
      return this.getDefaultGamification();
    }

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If table doesn't exist, return default (graceful degradation)
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('⚠️ User gamification table not found. Run database migrations. See DATABASE_SETUP.md');
          return this.getDefaultGamification();
        }
        // If record doesn't exist, create it
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          return await this.initializeGamification(userId);
        }
        // Otherwise, try to initialize
        return await this.initializeGamification(userId);
      }
      
      if (!data) {
        // Create default gamification record
        return await this.initializeGamification(userId);
      }

      return {
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        totalXP: data.total_xp || 0,
        level: data.level || 1,
        lastActivityDate: data.last_activity_date ? new Date(data.last_activity_date) : null,
        dailyActionsCount: data.daily_actions_count || 0,
      };
    } catch (error) {
      console.error('Error fetching gamification:', error);
      return this.getDefaultGamification();
    }
  }

  /**
   * Initialize gamification for a new user
   */
  static async initializeGamification(userId: string): Promise<GamificationData> {
    if (!isSupabaseConfigured()) {
      return this.getDefaultGamification();
    }

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .insert([{
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          total_xp: 0,
          level: 1,
          daily_actions_count: 0,
        }])
        .select()
        .single();

      if (error) {
        // If table doesn't exist, return default (graceful degradation)
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('⚠️ User gamification table not found. Run database migrations. See DATABASE_SETUP.md');
          return this.getDefaultGamification();
        }
        throw error;
      }

      return {
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        level: 1,
        lastActivityDate: null,
        dailyActionsCount: 0,
      };
    } catch (error) {
      console.error('Error initializing gamification:', error);
      return this.getDefaultGamification();
    }
  }

  /**
   * Award XP for an action
   */
  static async awardXP(userId: string, transaction: XPTransaction): Promise<GamificationData> {
    if (!isSupabaseConfigured()) {
      return this.getDefaultGamification();
    }

    try {
      // Get current gamification data
      let gamification = await this.getUserGamification(userId);

      // Update streak if it's a new day
      const today = new Date().toDateString();
      const lastActivity = gamification.lastActivityDate?.toDateString();
      
      if (lastActivity !== today) {
        // Check if streak should continue or reset
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActivity === yesterdayStr) {
          // Continue streak
          gamification.currentStreak += 1;
        } else if (lastActivity !== today) {
          // Reset streak
          gamification.currentStreak = 1;
        }

        // Update longest streak
        if (gamification.currentStreak > gamification.longestStreak) {
          gamification.longestStreak = gamification.currentStreak;
        }

        // Reset daily actions count
        gamification.dailyActionsCount = 0;
      }

      // Add XP
      gamification.totalXP += transaction.amount;
      gamification.dailyActionsCount += 1;

      // Calculate level (100 XP per level)
      const newLevel = Math.floor(gamification.totalXP / 100) + 1;
      const leveledUp = newLevel > gamification.level;
      gamification.level = newLevel;

      // Update in database
      const { error } = await supabase
        .from('user_gamification')
        .update({
          current_streak: gamification.currentStreak,
          longest_streak: gamification.longestStreak,
          total_xp: gamification.totalXP,
          level: gamification.level,
          last_activity_date: new Date().toISOString().split('T')[0],
          daily_actions_count: gamification.dailyActionsCount,
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Haptic feedback for level up
      if (leveledUp) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return gamification;
    } catch (error) {
      console.error('Error awarding XP:', error);
      return this.getDefaultGamification();
    }
  }

  /**
   * Get XP value for an action
   */
  static getXPValue(action: XPTransaction['action']): number {
    return this.XP_VALUES[action] || 0;
  }

  /**
   * Create XP transaction
   */
  static createTransaction(action: XPTransaction['action']): XPTransaction {
    return {
      action,
      amount: this.getXPValue(action),
      description: this.getActionDescription(action),
    };
  }

  /**
   * Get description for action
   */
  private static getActionDescription(action: XPTransaction['action']): string {
    const descriptions = {
      outfit_liked: 'Liked an outfit',
      outfit_swiped: 'Swiped through outfits',
      style_checked: 'Checked your style',
      perfume_recommended: 'Got perfume recommendation',
      daily_login: 'Daily login bonus',
    };
    return descriptions[action] || 'Completed action';
  }

  /**
   * Get default gamification data
   */
  private static getDefaultGamification(): GamificationData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      level: 1,
      lastActivityDate: null,
      dailyActionsCount: 0,
    };
  }

  /**
   * Calculate XP needed for next level
   */
  static getXPForNextLevel(currentLevel: number): number {
    return currentLevel * 100;
  }

  /**
   * Get XP progress to next level
   */
  static getXPProgress(totalXP: number, level: number): { current: number; needed: number; percentage: number } {
    const currentLevelXP = (level - 1) * 100;
    const nextLevelXP = level * 100;
    const current = totalXP - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;
    const percentage = Math.min(100, (current / needed) * 100);

    return { current, needed, percentage };
  }
}

export default GamificationService;

