import React, { useState, useRef, useCallback } from 'react';
import { useAssets, getRecentAssets, addToRecentAssets } from '../hooks/useAssets.js';

/**
 * AssetPicker - Composant de selection d'assets avec 3 modes
 * - Bibliotheque : grille d'assets du manifeste
 * - Upload : drag & drop + file picker
 * - URL : input manuel
 */
export default function AssetPicker({
  type = 'background',
  value = '',
  onChange,
  allowUpload = true,
  allowUrl = true,
  className = ''
}) {
  const [activeTab, setActiveTab] = useState('library');
  const [dragActive, setDragActive] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const fileInputRef = useRef(null);

  const { assets, loading, error } = useAssets({ category: type + 's' });
  const recentAssets = getRecentAssets(type);

  const handleSelect = useCallback((assetPath) => {
    onChange(assetPath);
    addToRecentAssets(type, assetPath);
  }, [onChange, type]);

  const handleFileUpload = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      console.warn('[AssetPicker] Invalid file type:', file?.type);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      handleSelect(dataUrl);
    };
    reader.readAsDataURL(file);
  }, [handleSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 border-slate-200 ${className}`}>
      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 font-semibold text-sm transition-all rounded-t-lg ${
            activeTab === 'library'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          📚 Bibliotheque
        </button>
        {allowUpload && (
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-semibold text-sm transition-all rounded-t-lg ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            📤 Upload
          </button>
        )}
        {allowUrl && (
          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 font-semibold text-sm transition-all rounded-t-lg ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            🔗 URL
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 min-h-[300px]">
        {activeTab === 'library' && (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Chargement des assets...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 font-semibold mb-2">Erreur de chargement</p>
                <p className="text-sm text-red-600">{error}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Le manifeste n'a pas pu etre charge. Verifiez que le script de generation est lance.
                </p>
              </div>
            )}

            {!loading && !error && assets.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-600 font-medium mb-2">Aucun asset disponible</p>
                <p className="text-sm text-slate-500">
                  Ajoutez des images dans <code className="bg-slate-100 px-2 py-1 rounded text-xs">/public/assets/{type}s/</code>
                </p>
              </div>
            )}

            {!loading && !error && assets.length > 0 && (
              <>
                {/* Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {assets.map((asset) => (
                    <AssetThumbnail
                      key={asset.id}
                      asset={asset}
                      selected={value === asset.path}
                      onSelect={() => handleSelect(asset.path)}
                      onHover={() => setPreviewAsset(asset)}
                    />
                  ))}
                </div>

                {/* Recent */}
                {recentAssets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Recemment utilises</p>
                    <div className="flex gap-2 flex-wrap">
                      {recentAssets.map((assetPath, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelect(assetPath)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            value === assetPath
                              ? 'bg-blue-500 text-white border-blue-600'
                              : 'bg-slate-100 hover:bg-blue-50 border-slate-300 hover:border-blue-500 text-slate-700'
                          }`}
                        >
                          {assetPath.split('/').pop().slice(0, 20)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            }`}
          >
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="font-semibold text-slate-700 mb-2">
              Glissez une image ici
            </p>
            <p className="text-sm text-slate-500 mb-4">
              ou cliquez pour parcourir
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              Choisir un fichier
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <p className="text-xs text-slate-500 mt-4">
              Formats supportes : JPG, PNG, SVG, GIF, WebP
            </p>
            <p className="text-xs text-slate-400 mt-1">
              (Stocke en base64 dans localStorage - limite ~5-10MB)
            </p>
          </div>
        )}

        {activeTab === 'url' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              URL de l'image
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="https://example.com/image.jpg"
              defaultValue={value}
              onBlur={(e) => handleSelect(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Entrez l'URL complete d'une image hebergee en ligne
            </p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Astuce :</strong> Vous pouvez aussi utiliser des chemins relatifs comme
                <code className="bg-white px-2 py-1 rounded ml-1">/assets/backgrounds/custom.jpg</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {(previewAsset || value) && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-2 mt-3">Apercu</p>
          <div className="bg-slate-100 rounded-lg p-3">
            <LazyImage
              src={previewAsset?.path || value}
              alt="Preview"
              className="w-full h-40 object-contain rounded"
            />
            {previewAsset && (
              <div className="mt-2 text-xs text-slate-600 space-y-1">
                <p><strong>Nom :</strong> {previewAsset.name}</p>
                <p><strong>Type :</strong> {previewAsset.type.toUpperCase()}</p>
                {previewAsset.size && (
                  <p><strong>Taille :</strong> {(previewAsset.size / 1024).toFixed(1)} KB</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Thumbnail d'asset avec lazy loading
 */
function AssetThumbnail({ asset, selected, onSelect, onHover }) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`relative rounded-lg overflow-hidden border-2 transition-all group ${
        selected
          ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
          : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
      }`}
    >
      <LazyImage
        src={asset.path}
        alt={asset.name}
        className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
      />
      <div className={`text-xs px-2 py-1.5 text-center font-medium transition-colors truncate ${
        selected
          ? 'bg-blue-500 text-white'
          : 'bg-slate-50 text-slate-700 group-hover:bg-blue-50'
      }`}>
        {asset.name}
      </div>
    </button>
  );
}

/**
 * Image avec lazy loading et skeleton
 */
function LazyImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative">
      {!loaded && !failed && (
        <div className={`${className} bg-slate-200 animate-pulse`} />
      )}
      {failed && (
        <div className={`${className} bg-slate-100 flex items-center justify-center text-xs text-slate-400`}>
          Image non disponible
        </div>
      )}
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
