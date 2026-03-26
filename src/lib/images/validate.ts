export const IMAGE_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxSizeMB: 10,
  minDimension: 256,
  maxDimension: 4096,
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  acceptedExtensions: ".jpg, .jpeg, .png, .webp",
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  if (!IMAGE_CONSTRAINTS.acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Please upload a JPEG, PNG, or WebP image.`,
    };
  }

  if (file.size > IMAGE_CONSTRAINTS.maxSizeBytes) {
    return {
      valid: false,
      error: `Image must be under ${IMAGE_CONSTRAINTS.maxSizeMB} MB.`,
    };
  }

  return { valid: true };
}

export function validateImageDimensions(
  width: number,
  height: number
): ValidationResult {
  if (width < IMAGE_CONSTRAINTS.minDimension || height < IMAGE_CONSTRAINTS.minDimension) {
    return {
      valid: false,
      error: `Image must be at least ${IMAGE_CONSTRAINTS.minDimension}×${IMAGE_CONSTRAINTS.minDimension} pixels.`,
    };
  }

  if (width > IMAGE_CONSTRAINTS.maxDimension || height > IMAGE_CONSTRAINTS.maxDimension) {
    return {
      valid: false,
      error: `Image must be no larger than ${IMAGE_CONSTRAINTS.maxDimension}×${IMAGE_CONSTRAINTS.maxDimension} pixels.`,
    };
  }

  return { valid: true };
}

/** Returns a Promise resolving to a base64 data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

/** Load an image element from a data URL to check dimensions */
export function loadImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = dataUrl;
  });
}
