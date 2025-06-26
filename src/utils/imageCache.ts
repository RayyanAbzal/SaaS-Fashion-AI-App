import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { SHA256 } from 'crypto-js';

interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxAge: number; // Maximum age of cached files in milliseconds
}

interface CachedFileInfo {
  path: string;
  size: number;
  modTime: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

class ImageCache {
  private static instance: ImageCache;
  private cacheDirectory: string;
  private config: CacheConfig;

  private constructor() {
    this.cacheDirectory = `${FileSystem.cacheDirectory}images/`;
    this.config = DEFAULT_CONFIG;
    this.initializeCache();
  }

  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  private async initializeCache() {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
    }
    this.cleanCache();
  }

  private async cleanCache() {
    try {
      const contents = await FileSystem.readDirectoryAsync(this.cacheDirectory);
      let totalSize = 0;
      const now = Date.now();
      
      // Get file info and calculate total size
      const fileInfos: CachedFileInfo[] = await Promise.all(
        contents.map(async (filename): Promise<CachedFileInfo> => {
          const filePath = `${this.cacheDirectory}${filename}`;
          const info = await FileSystem.getInfoAsync(filePath, { size: true });
          
          // Handle the case where the file might not exist
          if (!info.exists) {
            return {
              path: filePath,
              size: 0,
              modTime: now,
            };
          }

          // Safe type assertion since we know the file exists
          const fileInfo = info as FileSystem.FileInfo & {
            size?: number;
            modificationTime?: number;
          };

          return {
            path: filePath,
            size: fileInfo.size || 0,
            modTime: fileInfo.modificationTime || now,
          };
        })
      );

      // Sort by modification time (oldest first)
      fileInfos.sort((a, b) => a.modTime - b.modTime);

      // Remove old files and ensure we're under size limit
      for (const fileInfo of fileInfos) {
        const age = now - fileInfo.modTime;
        if (age > this.config.maxAge || totalSize + fileInfo.size > this.config.maxSize) {
          await FileSystem.deleteAsync(fileInfo.path);
        } else {
          totalSize += fileInfo.size;
        }
      }
    } catch (error) {
      console.error('Error cleaning image cache:', error);
    }
  }

  private getCacheKey(url: string): string {
    return SHA256(url).toString();
  }

  async getCachedImageUri(url: string): Promise<string> {
    if (Platform.OS === 'web') {
      return url; // No caching on web
    }

    const cacheKey = this.getCacheKey(url);
    const cachedPath = `${this.cacheDirectory}${cacheKey}`;

    try {
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      
      if (fileInfo.exists) {
        // Check if cache is expired
        const age = Date.now() - (fileInfo.modificationTime || 0);
        if (age <= this.config.maxAge) {
          return `file://${cachedPath}`;
        }
        // Cache expired, delete it
        await FileSystem.deleteAsync(cachedPath);
      }

      // Download and cache the image
      await FileSystem.downloadAsync(url, cachedPath);
      return `file://${cachedPath}`;
    } catch (error) {
      console.error('Error caching image:', error);
      return url; // Fallback to original URL
    }
  }

  async prefetchImages(urls: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      return; // No prefetching on web
    }

    try {
      await Promise.all(
        urls.map(url => this.getCachedImageUri(url))
      );
    } catch (error) {
      console.error('Error prefetching images:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDirectory);
      await this.initializeCache();
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }
}

export default ImageCache; 