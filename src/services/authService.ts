import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserPreferences, BrandPreferences, StyleProfile, Subscription } from '../types';

export class AuthService {
  static async signUp(email: string, password: string, displayName: string): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
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
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      return firebaseUser;
    } catch (error: any) {
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please check your email or sign up.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
    }
  }

  static async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please check your email or sign up.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
    }
  }

  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        return null;
      }
      return await AuthService.getUserProfile(firebaseUser.uid);
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error: any) {
      console.warn('Failed to update user profile:', error.message);
      throw new Error(error.message);
    }
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        preferences: preferences,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error: any) {
      console.warn('Failed to update user preferences:', error.message);
      throw new Error(error.message);
    }
  }

  static async updateBrandPreferences(userId: string, brandPreferences: BrandPreferences): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        brandPreferences: brandPreferences,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error: any) {
      console.warn('Failed to update brand preferences:', error.message);
      throw new Error(error.message);
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user authenticated:', firebaseUser.uid);
        let userProfile = await this.getUserProfile(firebaseUser.uid);
        
        // If user profile doesn't exist, create a basic one
        if (!userProfile) {
          console.log('Creating user profile for existing user');
          const basicUserData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'User',
            ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
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
            await setDoc(doc(db, 'users', firebaseUser.uid), basicUserData);
            userProfile = basicUserData;
            console.log('User profile created successfully');
          } catch (error) {
            console.error('Failed to create user profile:', error);
          }
        }
        
        console.log('Returning user profile:', userProfile ? userProfile.email : 'null');
        callback(userProfile);
      } else {
        console.log('No Firebase user authenticated');
        callback(null);
      }
    });
  }
} 