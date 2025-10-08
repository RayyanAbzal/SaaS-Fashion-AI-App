import { supabase } from './supabase';

class SupabaseStorageService {
  /**
   * Upload an image to Supabase Storage
   * @param uri Local file URI
   * @param path Storage path (e.g., 'wardrobe/user123/item456.jpg')
   * @returns Public URL of uploaded image
   */
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(path);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Delete an image from Supabase Storage
   * @param path Storage path
   */
  async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([path]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Get public URL for an image
   * @param path Storage path
   * @returns Public URL
   */
  getPublicUrl(path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(path);
    
    return publicUrl;
  }
}

export default new SupabaseStorageService();

