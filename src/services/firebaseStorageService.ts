import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase'; // Your initialized firebase storage

const FirebaseStorageService = {
  async testStorageConnection(): Promise<boolean> {
    try {
      console.log('Testing Firebase Storage connection...');
      
      if (!storage) {
        console.error('Firebase Storage is not initialized');
        return false;
      }
      
      // Try to create a test reference
      const testRef = ref(storage, 'test-connection.txt');
      console.log('Storage reference created successfully');
      
      // Try to upload a small test file
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      await uploadBytes(testRef, testBlob);
      console.log('Test upload successful');
      
      // Clean up the test file
      await deleteObject(testRef);
      console.log('Test file cleaned up');
      
      return true;
    } catch (error) {
      console.error('Storage connection test failed:', error);
      return false;
    }
  },

  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      console.log('Starting image upload for path:', path);
      console.log('Image URI:', uri);
      
      // Validate URI
      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid image URI provided');
      }

      // Check if storage is properly initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }

      // Handle different URI formats
      let processedUri = uri;
      if (uri.startsWith('file://')) {
        // Local file URI - should work as is
        console.log('Processing local file URI');
      } else if (uri.startsWith('data:')) {
        // Data URI - should work as is
        console.log('Processing data URI');
      } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        // Remote URL - should work as is
        console.log('Processing remote URL');
      } else {
        // Assume it's a local file path
        processedUri = `file://${uri}`;
        console.log('Converted to file URI:', processedUri);
      }

      // Fetch the image
      console.log('Fetching image from URI...');
      const response = await fetch(processedUri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('Image blob created, size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Image blob is empty');
      }

      // Validate blob type
      if (!blob.type.startsWith('image/')) {
        console.warn('Blob type is not an image:', blob.type);
        // Continue anyway as some systems don't set the correct MIME type
      }

      // Create storage reference
      const storageRef = ref(storage, path);
      console.log('Storage reference created for path:', path);
      
      // Upload the blob with explicit content type
      const contentType = blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
      console.log('Uploading blob to Firebase Storage with content type:', contentType);
      
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000',
      });
      
      console.log('Upload completed successfully');
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image: ", error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          throw new Error('Storage access denied. Please check your Firebase configuration and permissions.');
        } else if (error.message.includes('storage/quota-exceeded')) {
          throw new Error('Storage quota exceeded. Please try again later.');
        } else if (error.message.includes('storage/unauthenticated')) {
          throw new Error('User not authenticated. Please log in again.');
        } else if (error.message.includes('storage/retry-limit-exceeded')) {
          throw new Error('Upload failed due to network issues. Please check your connection and try again.');
        } else if (error.message.includes('storage/invalid-format')) {
          throw new Error('Invalid image format. Please try a different image.');
        } else if (error.message.includes('storage/cannot-slice-blob')) {
          throw new Error('Image processing failed. Please try a different image.');
        } else if (error.message.includes('storage/unknown')) {
          throw new Error('Firebase Storage configuration issue. Please check your Firebase project settings and Storage rules.');
        }
      }
      
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async uploadWardrobeImage(imageUri: string, itemId: string, userId: string): Promise<string> {
    try {
      console.log('Uploading wardrobe image for user:', userId, 'item:', itemId);
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!itemId) {
        throw new Error('Item ID is required');
      }

      // Use the main uploadImage method with proper path
      const path = `wardrobe/${userId}/${itemId}.jpg`;
      return await FirebaseStorageService.uploadImage(imageUri, path);
    } catch (error) {
      console.error('Error uploading wardrobe image:', error);
      throw error;
    }
  },

  async deleteWardrobeImage(itemId: string, userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const storageRef = ref(storage, `wardrobe/${userId}/${itemId}.jpg`);
      await deleteObject(storageRef);
      console.log('Wardrobe image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  },

  async uploadBulkImages(imageUris: string[], itemIds: string[], userId: string): Promise<string[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const uploadPromises = imageUris.map(async (imageUri, index) => {
        const itemId = itemIds[index];
        return FirebaseStorageService.uploadWardrobeImage(imageUri, itemId, userId);
      });

      const downloadURLs = await Promise.all(uploadPromises);
      return downloadURLs;
    } catch (error) {
      console.error('Error uploading bulk images:', error);
      throw new Error('Failed to upload bulk images');
    }
  }
};

export default FirebaseStorageService; 