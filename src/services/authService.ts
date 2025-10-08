import { supabase } from './supabase';
import { User, UserPreferences, BrandPreferences, StyleProfile, Subscription } from '../types';

export class AuthService {
  static async signUp(email: string, password: string, displayName: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      // Create user document in Supabase
      const userData: User = {
        id: data.user.id,
        email: data.user.email!,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          stylePreferences: [],
          favoriteColors: [],
          sizePreferences: {
            top: '',
            bottom: '',
            shoes: '',
          },
          budget: {
            min: 0,
            max: 1000,
            currency: 'NZD',
          },
          preferredRetailers: [],
          notificationSettings: {
            outfitReminders: true,
            styleTips: true,
            newArrivals: true,
            priceAlerts: true,
          },
          privacySettings: {
            shareOutfits: false,
            showProfile: true,
            allowAnalytics: true,
          },
        },
        styleProfile: {
          personality: 'casual',
          bodyType: 'rectangle',
          skinTone: 'neutral',
          height: 170,
          weight: 70,
          measurements: {
            bust: 90,
            waist: 75,
            hips: 95,
            inseam: 80,
          },
          styleGoals: [],
          occasions: ['casual', 'work'],
          climate: 'temperate',
        },
        brandPreferences: {
          love: [],
          avoid: [],
          preferredCategories: [],
          budget: {
            min: 0,
            max: 1000,
            currency: 'NZD',
          },
          preferredPriceRanges: {},
          brandRatings: {},
          lastUpdated: new Date(),
        },
        subscription: {
          plan: 'free',
          startDate: new Date(),
          features: ['basic-outfits', 'wardrobe-management'],
        },
      };
      
      const { error: dbError } = await supabase
        .from('users')
        .insert([{
          id: userData.id,
          email: userData.email,
          display_name: userData.displayName,
          created_at: userData.createdAt.toISOString(),
          updated_at: userData.updatedAt.toISOString(),
          preferences: userData.preferences,
          style_profile: userData.styleProfile,
          brand_preferences: userData.brandPreferences,
          subscription: userData.subscription,
        }]);

      if (dbError) {
        console.warn('Failed to create user profile:', dbError.message);
      }

      return data.user;
    } catch (error: any) {
      // Provide more specific error messages
      if (error.message?.includes('already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message?.includes('Password')) {
        throw new Error('Password should be at least 6 characters long.');
      } else {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
    }
  }

  static async signIn(email: string, password: string): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data.user;
    } catch (error: any) {
      // Provide more specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please verify your email before signing in.');
      } else {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
    }
  }

  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      // Map snake_case from Supabase to camelCase for TypeScript
      const user: User = {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        photoUrl: data.photo_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        preferences: data.preferences,
        styleProfile: data.style_profile,
        brandPreferences: data.brand_preferences,
        subscription: data.subscription,
      };
      
      return user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }
      return await AuthService.getUserProfile(user.id);
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      // Map camelCase to snake_case for Supabase
      const mappedUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.displayName !== undefined) mappedUpdates.display_name = updates.displayName;
      if (updates.photoUrl !== undefined) mappedUpdates.photo_url = updates.photoUrl;
      if (updates.preferences !== undefined) mappedUpdates.preferences = updates.preferences;
      if (updates.styleProfile !== undefined) mappedUpdates.style_profile = updates.styleProfile;
      if (updates.brandPreferences !== undefined) mappedUpdates.brand_preferences = updates.brandPreferences;
      if (updates.subscription !== undefined) mappedUpdates.subscription = updates.subscription;
      
      const { error } = await supabase
        .from('users')
        .update(mappedUpdates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.warn('Failed to update user profile:', error.message);
      throw new Error(error.message);
    }
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.warn('Failed to update user preferences:', error.message);
      throw new Error(error.message);
    }
  }

  static async updateBrandPreferences(userId: string, brandPreferences: BrandPreferences): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          brand_preferences: brandPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.warn('Failed to update brand preferences:', error.message);
      throw new Error(error.message);
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        console.log('Supabase user authenticated:', session.user.id);
        let userProfile = await this.getUserProfile(session.user.id);
        
        // If user profile doesn't exist, create a basic one
        if (!userProfile) {
          console.log('Creating user profile for existing user');
          const basicUserData: User = {
            id: session.user.id,
            email: session.user.email!,
            displayName: session.user.user_metadata?.display_name || 'User',
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              stylePreferences: [],
              favoriteColors: [],
              sizePreferences: {
                top: '',
                bottom: '',
                shoes: '',
              },
              budget: {
                min: 0,
                max: 1000,
                currency: 'NZD',
              },
              preferredRetailers: [],
              notificationSettings: {
                outfitReminders: true,
                styleTips: true,
                newArrivals: true,
                priceAlerts: true,
              },
              privacySettings: {
                shareOutfits: false,
                showProfile: true,
                allowAnalytics: true,
              },
            },
            styleProfile: {
              personality: 'casual',
              bodyType: 'rectangle',
              skinTone: 'neutral',
              height: 170,
              weight: 70,
              measurements: {
                bust: 90,
                waist: 75,
                hips: 95,
                inseam: 80,
              },
              styleGoals: [],
              occasions: ['casual', 'work'],
              climate: 'temperate',
            },
            brandPreferences: {
              love: [],
              avoid: [],
              preferredCategories: [],
              budget: {
                min: 0,
                max: 1000,
                currency: 'NZD',
              },
              preferredPriceRanges: {},
              brandRatings: {},
              lastUpdated: new Date(),
            },
            subscription: {
              plan: 'free',
              startDate: new Date(),
              features: ['basic-outfits', 'wardrobe-management'],
            },
          };
          
          try {
            const { error } = await supabase
              .from('users')
              .insert([{
                id: basicUserData.id,
                email: basicUserData.email,
                display_name: basicUserData.displayName,
                created_at: basicUserData.createdAt.toISOString(),
                updated_at: basicUserData.updatedAt.toISOString(),
                preferences: basicUserData.preferences,
                style_profile: basicUserData.styleProfile,
                brand_preferences: basicUserData.brandPreferences,
                subscription: basicUserData.subscription,
              }]);
            
            if (!error) {
              userProfile = basicUserData;
              console.log('User profile created successfully');
            } else {
              console.error('Failed to create user profile:', error);
            }
          } catch (error) {
            console.error('Failed to create user profile:', error);
          }
        }
        
        console.log('Returning user profile:', userProfile ? userProfile.email : 'null');
        callback(userProfile);
      } else {
        console.log('No Supabase user authenticated');
        callback(null);
      }
    });

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }
}
