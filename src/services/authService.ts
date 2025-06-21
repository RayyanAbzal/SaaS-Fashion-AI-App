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
import { User, UserPreferences } from '@/types';

export class AuthService {
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
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
        photoURL: firebaseUser.photoURL || undefined,
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
          },
        },
      };

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      } catch (firestoreError: any) {
        console.warn('Failed to save user data to Firestore:', firestoreError.message);
        // Continue with auth even if Firestore fails
      }

      return userData;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Try to get user data from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          return userDoc.data() as User;
        }
      } catch (firestoreError: any) {
        console.warn('Failed to get user data from Firestore:', firestoreError.message);
      }
      
      // If Firestore fails, create a basic user object
      const basicUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
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
          },
        },
      };
      
      return basicUser;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          return userDoc.data() as User;
        }
      } catch (firestoreError: any) {
        console.warn('Failed to get user data from Firestore:', firestoreError.message);
      }

      // If Firestore fails, return basic user info
      const basicUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
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
          },
        },
      };

      return basicUser;
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error: any) {
      console.warn('Failed to update user profile:', error.message);
      throw new Error(error.message);
    }
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'preferences': preferences,
        updatedAt: new Date(),
      });
    } catch (error: any) {
      console.warn('Failed to update user preferences:', error.message);
      throw new Error(error.message);
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback(userDoc.data() as User);
          } else {
            // Create basic user if Firestore document doesn't exist
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || undefined,
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
                },
              },
            };
            callback(basicUser);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          // Return basic user info if Firestore fails
          const basicUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || undefined,
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
              },
            },
          };
          callback(basicUser);
        }
      } else {
        callback(null);
      }
    });
  }
} 