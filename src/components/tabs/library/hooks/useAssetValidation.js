// src/components/tabs/library/hooks/useAssetValidation.js

import { useCallback } from 'react';

/**
 * Validation rules for asset files
 */
const VALIDATION_RULES = {
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
 * Custom hook for asset file validation
 * 
 * @returns {Object} Validation methods
 * @property {Function} validateFile - Validate single file
 * @property {Function} validateDimensions - Validate image dimensions
 * @property {Function} getValidationRules - Get rules for category
 */
export const useAssetValidation = () => {
	// Validate file type and size
	const validateFile = useCallback((file, category) => {
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
	const validateDimensions = useCallback((file, category) => {
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
	const getValidationRules = useCallback((category) => {
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
