// src/components/tabs/library/hooks/useAssets.js

import { useState, useCallback, useEffect } from 'react';

/**
 * LocalStorage key for persisting assets
 */
const STORAGE_KEY = 'accesscity_assets';

/**
 * Asset categories enum
 */
export const CATEGORIES = {
	BACKGROUNDS: 'backgrounds',
	CHARACTERS: 'characters',
	ICONS: 'icons',
	AUDIO: 'audio',
	ALL: 'all'
};

/**
 * Generate unique asset ID
 * @returns {string} Unique asset identifier
 */
const generateId = () => `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Custom hook for managing assets (CRUD + localStorage persistence)
 * 
 * @returns {Object} Assets state and methods
 * @property {Array} assets - List of all assets
 * @property {boolean} loading - Loading state
 * @property {Function} addAsset - Add new asset
 * @property {Function} updateAsset - Update existing asset
 * @property {Function} deleteAsset - Delete asset by ID
 * @property {Function} getAssetById - Get single asset
 * @property {Function} getAssetsByCategory - Filter by category
 * @property {Function} searchAssets - Search by name
 */
export const useAssets = () => {
	const [assets, setAssets] = useState([]);
	const [loading, setLoading] = useState(true);

	// Load assets from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				setAssets(JSON.parse(stored));
			}
		} catch (e) {
			setAssets([]);
		}
		setLoading(false);
	}, []);

	// Save assets to localStorage
	const saveToStorage = useCallback((newAssets) => {
		setAssets(newAssets);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newAssets));
		} catch (e) {}
	}, []);

	// Add new asset
	const addAsset = useCallback((assetData) => {
		const newAsset = {
			id: generateId(),
			name: assetData.name || 'Untitled',
			category: assetData.category || CATEGORIES.ALL,
			url: assetData.url || '',
			type: assetData.type || '',
			size: assetData.size || 0,
			altText: assetData.altText || '',
			createdAt: Date.now(),
			...assetData
		};
		const newAssets = [newAsset, ...assets];
		saveToStorage(newAssets);
		return newAsset.id;
	}, [assets, saveToStorage]);

	// Update asset
	const updateAsset = useCallback((id, updates) => {
		let success = false;
		const newAssets = assets.map((asset) => {
			if (asset.id === id) {
				success = true;
				return { ...asset, ...updates, updatedAt: Date.now() };
			}
			return asset;
		});
		if (success) saveToStorage(newAssets);
		return success;
	}, [assets, saveToStorage]);

	// Delete asset
	const deleteAsset = useCallback((id) => {
		const newAssets = assets.filter((asset) => asset.id !== id);
		const success = newAssets.length !== assets.length;
		if (success) saveToStorage(newAssets);
		return success;
	}, [assets, saveToStorage]);

	// Get asset by ID
	const getAssetById = useCallback((id) => {
		return assets.find((asset) => asset.id === id) || null;
	}, [assets]);

	// Get assets by category
	const getAssetsByCategory = useCallback((category) => {
		if (category === CATEGORIES.ALL) return assets;
		return assets.filter((asset) => asset.category === category);
	}, [assets]);

	// Search assets by name
	const searchAssets = useCallback((query) => {
		if (!query) return assets;
		return assets.filter((asset) => asset.name.toLowerCase().includes(query.toLowerCase()));
	}, [assets]);

	return {
		assets,
		loading,
		addAsset,
		updateAsset,
		deleteAsset,
		getAssetById,
		getAssetsByCategory,
		searchAssets
	};
};
