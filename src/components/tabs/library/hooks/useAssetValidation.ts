// src/components/tabs/library/hooks/useAssetValidation.ts

import { useCallback } from 'react';

/**
 * Asset category type
 */
export type AssetCategory = 'backgrounds' | 'characters' | 'icons' | 'audio';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Dimension constraints for image validation
 */
interface DimensionConstraints {
  width: number;
  height: number;
}

/**
 * Validation rules structure
 */
interface ValidationRulesStructure {
  MAX_SIZE: number;
  ALLOWED_FORMATS: Record<AssetCategory, string[]>;
  MIN_DIMENSIONS: Partial<Record<AssetCategory, DimensionConstraints>>;
}

/**
 * Validation rules for asset files
 */
const VALIDATION_RULES: ValidationRulesStructure = {
  // Max file size: 10MB
  MAX_SIZE: 10 * 1024 * 1024,
  // Allowed formats per category
  ALLOWED_FORMATS: {
    backgrounds: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    characters: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    icons: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
  },
  // Minimum dimensions for images (width x height)
  MIN_DIMENSIONS: {
    backgrounds: { width: 800, height: 600 },
    characters: { width: 128, height: 128 },
    icons: { width: 32, height: 32 }
  }
};

/**
 * Validation rules for a specific category
 */
export interface CategoryValidationRules {
  maxSize: number;
  allowed: string[];
  min: DimensionConstraints | null;
}

/**
 * Return type for useAssetValidation hook
 */
export interface UseAssetValidationReturn {
  /** Validate single file */
  validateFile: (file: File | null, category: AssetCategory) => ValidationResult;
  /** Validate image dimensions (async) */
  validateDimensions: (file: File | null, category: AssetCategory) => Promise<ValidationResult>;
  /** Get validation rules for category */
  getValidationRules: (category: AssetCategory) => CategoryValidationRules;
}

/**
 * Custom hook for asset file validation
 *
 * @returns Validation methods
 */
export const useAssetValidation = (): UseAssetValidationReturn => {
  // Validate file type and size
  const validateFile = useCallback((file: File | null, category: AssetCategory): ValidationResult => {
    if (!file) return { valid: false, error: 'No file provided' };
    if (file.size > VALIDATION_RULES.MAX_SIZE) {
      return { valid: false, error: 'File too large' };
    }
    const allowed = VALIDATION_RULES.ALLOWED_FORMATS[category] || [];
    if (!allowed.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }
    return { valid: true };
  }, []);

  // Validate image dimensions (async)
  const validateDimensions = useCallback((file: File | null, category: AssetCategory): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve({ valid: true });
        return;
      }
      const min = VALIDATION_RULES.MIN_DIMENSIONS[category];
      if (!min) {
        resolve({ valid: true });
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        if (img.width < min.width || img.height < min.height) {
          resolve({ valid: false, error: `Image too small (${img.width}x${img.height})` });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => resolve({ valid: false, error: 'Invalid image' });
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Get validation rules for a category
  const getValidationRules = useCallback((category: AssetCategory): CategoryValidationRules => {
    return {
      maxSize: VALIDATION_RULES.MAX_SIZE,
      allowed: VALIDATION_RULES.ALLOWED_FORMATS[category] || [],
      min: VALIDATION_RULES.MIN_DIMENSIONS[category] || null
    };
  }, []);

  return {
    validateFile,
    validateDimensions,
    getValidationRules
  };
};
