import * as FileSystem from 'expo-file-system';

export const fileToBase64 = async (uri: string): Promise<string> => {
  try {
    // Validate URI
    if (!uri || uri.trim() === '') {
      throw new Error('Invalid URI: URI is empty or undefined');
    }

    console.log('Converting URI to base64:', uri);

    // Handle different URI formats
    let fileUri = uri;
    
    // If it's already a data URI, extract the base64 part
    if (uri.startsWith('data:image/')) {
      const base64Part = uri.split(',')[1];
      if (base64Part) {
        return base64Part;
      }
    }

    // For content URIs (Android), we need to copy to a temporary file first
    if (uri.startsWith('content://')) {
      const tempUri = `${FileSystem.cacheDirectory}temp_image_${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: uri,
        to: tempUri
      });
      fileUri = tempUri;
    }

    // For file URIs, use as is
    if (uri.startsWith('file://')) {
      fileUri = uri;
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Successfully converted to base64, length:', base64.length);
    return base64;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    console.error('URI that failed:', uri);
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 