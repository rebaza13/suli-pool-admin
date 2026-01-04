import imageCompression from 'browser-image-compression';

const MAX_SIZE_MB = 3; // Maximum file size in MB
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // Convert to bytes

/**
 * Compresses an image file to be under 3MB
 * @param file - The image file to compress
 * @returns Compressed file as a Blob/File
 */
export async function compressImage(file: File): Promise<File> {
  // If file is already under 3MB, return as is
  if (file.size <= MAX_SIZE_BYTES) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: 1920, // Optional: limit dimensions
      useWebWorker: true, // Use web worker for better performance
      fileType: file.type, // Preserve original file type
    };

    const compressedFile = await imageCompression(file, options);
    
    // Double-check the size after compression
    if (compressedFile.size > MAX_SIZE_BYTES) {
      // If still too large, compress more aggressively
      const moreAggressiveOptions = {
        ...options,
        maxSizeMB: MAX_SIZE_MB * 0.9, // Slightly lower to ensure we're under
        maxWidthOrHeight: 1600, // Smaller dimensions
      };
      return await imageCompression(file, moreAggressiveOptions);
    }

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return original file (upload will fail if too large)
    return file;
  }
}

/**
 * Compresses multiple image files
 * @param files - Array of image files to compress
 * @returns Array of compressed files
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file)));
}

