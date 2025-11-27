import { supabase, isSupabaseConfigured } from './supabase';
import { User, UserPreferences, BrandPreferences, StyleProfile, Subscription } from '../types';

export class AuthService {
  static async signUp(email: string, password: string, displayName: string): Promise<any> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file. See SUPABASE_SETUP.md for instructions.');
    }

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
      
      // Immediately refresh session to trigger auth state change
      await supabase.auth.refreshSession();
      
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

  static async getUserProfile(userId: string, retries: number = 2): Promise<User | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          console.log(`Retrying getUserProfile (attempt ${attempt + 1}/${retries + 1})...`);
        }

        // Add timeout to prevent hanging (increased for slow networks)
        const profilePromise = supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('User profile fetch timeout')), 20000)
        );

        const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

        if (error) {
          // If it's a network error and we have retries left, retry
          if (attempt < retries && (
            error.message?.includes('timeout') ||
            error.message?.includes('network') ||
            error.message?.includes('fetch')
          )) {
            continue;
          }
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
        // If this is the last attempt, return null
        if (attempt === retries) {
          console.error("Error fetching user profile after retries:", error);
      return null;
    }
        // Otherwise, continue to next retry
        continue;
      }
    }
    
    return null;
  }

  /**
   * Create a basic user profile from Supabase auth user
   * Used when profile fetch times out or fails
   */
  private static createBasicUserProfile(authUser: any): User {
    return {
      id: authUser.id,
      email: authUser.email!,
      displayName: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'User',
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
  }

  static async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - returning null user');
      return null;
    }

    try {
      // Add timeout to getCurrentUser
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 10000)
      );

      const { data: { user } } = await Promise.race([userPromise, timeoutPromise]);
      
      if (!user) {
        return null;
      }
      
      // Try to get profile, but create basic one if it times out
      try {
        const profile = await Promise.race([
          AuthService.getUserProfile(user.id),
          new Promise<User | null>((resolve) => 
            setTimeout(() => resolve(this.createBasicUserProfile(user)), 10000)
          ),
        ]);
        return profile;
      } catch (error) {
        // If profile fetch fails, return basic profile
        console.warn('⚠️ Profile fetch failed, using basic profile:', error);
        return this.createBasicUserProfile(user);
      }
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
    // If Supabase is not configured, return a no-op unsubscribe function
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured - auth state changes disabled');
      // Call callback immediately with null
      setTimeout(() => callback(null), 0);
      return () => {}; // Return no-op unsubscribe function
    }

    let subscription: { unsubscribe: () => void } | null = null;
    let callbackCalled = false;
    
    // Set a longer timeout to ensure callback is called even if getSession hangs
    const timeoutId = setTimeout(() => {
      if (!callbackCalled) {
        console.warn('⚠️ Auth check timeout - will retry with getCurrentUser');
        // Don't call callback with null immediately - try getCurrentUser first
        AuthService.getCurrentUser().then(user => {
          if (!callbackCalled) {
            callbackCalled = true;
            callback(user);
          }
        }).catch(() => {
          if (!callbackCalled) {
            callbackCalled = true;
            callback(null);
          }
        });
      }
    }, 8000); // 8 second timeout (increased from 3)
    
    // Get initial session immediately (don't wait for auth state change)
    // Add timeout to getSession itself (increased timeout for slow networks)
    Promise.race([
      supabase.auth.getSession(),
      new Promise<{ data: { session: null }, error: Error }>((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout')), 10000)
      ),
    ]).then(async ({ data: { session }, error }) => {
      clearTimeout(timeoutId);
      
      if (error) {
        console.warn('⚠️ Error getting initial session:', error.message);
        if (!callbackCalled) {
          callbackCalled = true;
          callback(null);
        }
        return;
      }
      
      if (session?.user) {
        try {
          // Add timeout to getUserProfile (increased for slow networks)
          const userProfile = await Promise.race([
            this.getUserProfile(session.user.id),
            new Promise<User | null>((resolve) => 
              setTimeout(() => {
                console.warn('⚠️ getUserProfile timeout - creating basic profile');
                // Create basic user profile if fetch times out
                resolve(this.createBasicUserProfile(session.user));
              }, 10000)
            ),
          ]);
          if (!callbackCalled) {
            callbackCalled = true;
        callback(userProfile);
          }
        } catch (error) {
          console.warn('⚠️ Failed to get user profile on initial load:', error instanceof Error ? error.message : 'Unknown error');
          // If we have a session but profile fetch failed, create basic profile
          if (session?.user && !callbackCalled) {
            callbackCalled = true;
            callback(this.createBasicUserProfile(session.user));
          } else if (!callbackCalled) {
            callbackCalled = true;
            callback(null);
          }
        }
      } else {
        if (!callbackCalled) {
          callbackCalled = true;
          callback(null);
        }
      }
    }).catch((error) => {
      clearTimeout(timeoutId);
      console.warn('⚠️ Error in getSession:', error);
      if (!callbackCalled) {
        callbackCalled = true;
        callback(null);
      }
    });
    
    try {
      subscription = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (session?.user) {
            console.log('Supabase user authenticated:', session.user.id);
            let userProfile: User | null = null;
            
            try {
              // Add timeout to prevent hanging (increased for slow networks)
              userProfile = await Promise.race([
                this.getUserProfile(session.user.id),
                new Promise<User | null>((resolve) => 
                  setTimeout(() => {
                    console.warn('⚠️ getUserProfile timeout - creating basic profile');
                    // Create basic user profile if fetch times out
                    resolve(this.createBasicUserProfile(session.user));
                  }, 10000)
                ),
              ]);
            } catch (error) {
              console.warn('⚠️ Failed to get user profile (network error):', error instanceof Error ? error.message : 'Unknown error');
              // Continue to try creating profile if it doesn't exist
            }
            
            // If user profile doesn't exist, create a basic one
            if (!userProfile) {
              console.log('Creating user profile for existing user');
              userProfile = this.createBasicUserProfile(session.user);
              
              try {
                const { error } = await supabase
                  .from('users')
                  .insert([{
                    id: userProfile.id,
                    email: userProfile.email,
                    display_name: userProfile.displayName,
                    created_at: userProfile.createdAt.toISOString(),
                    updated_at: userProfile.updatedAt.toISOString(),
                    preferences: userProfile.preferences,
                    style_profile: userProfile.styleProfile,
                    brand_preferences: userProfile.brandPreferences,
                    subscription: userProfile.subscription,
                  }]);
                
                if (!error) {
                  userProfile = basicUserData;
                  console.log('User profile created successfully');
                } else {
                  console.warn('⚠️ Failed to create user profile:', error.message);
                }
              } catch (error) {
                console.warn('⚠️ Failed to create user profile (network error):', error instanceof Error ? error.message : 'Unknown error');
              }
            }
            
            console.log('Returning user profile:', userProfile ? userProfile.email : 'null');
            callback(userProfile);
          } else {
            console.log('No Supabase user authenticated');
            callback(null);
          }
        } catch (error) {
          console.warn('⚠️ Error in auth state change handler:', error instanceof Error ? error.message : 'Unknown error');
          callback(null); // On error, assume no user
        }
      });
    } catch (error) {
      console.warn('⚠️ Failed to set up auth state listener (network error):', error instanceof Error ? error.message : 'Unknown error');
      callback(null);
      return () => {};
    }

    // Return unsubscribe function
    return () => {
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('⚠️ Error unsubscribing from auth state:', error instanceof Error ? error.message : 'Unknown error');
      }
    };
  }
}
