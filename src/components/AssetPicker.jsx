import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  useAssets,
  getRecentAssets,
  addToRecentAssets,
} from "@/hooks/useAssets";
import { toAbsoluteAssetPath } from "../utils/pathUtils.js";
import { logger } from "../utils/logger";
import { API } from "@/config/constants";
import { TIMING } from "@/config/timing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Upload as UploadIcon, Link as LinkIcon, Loader2, AlertCircle, Check, Image as ImageIcon } from "lucide-react";

/**
 * AssetPicker - Composant de selection d'assets avec 3 modes
 * - Bibliotheque : grille d'assets du manifeste
 * - Upload : drag & drop + file picker
 * - URL : input manuel
 */
export default function AssetPicker({
  type = "background",
  value = "",
  onChange,
  allowUpload = true,
  allowUrl = true,
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("library");
  const [dragActive, setDragActive] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [uploadError, setUploadError] = useState(null);
  const [serverStatus, setServerStatus] = useState(null); // null | 'checking' | 'online' | 'offline'
  const fileInputRef = useRef(null);

  const { assets, loading, error, reloadManifest } = useAssets({
    category: type + "s",
  });
  const recentAssets = getRecentAssets(type);

  const handleSelect = useCallback(
    (assetPath) => {
      const absPath = toAbsoluteAssetPath(assetPath);
      onChange(absPath);
      addToRecentAssets(type, absPath);
    },
    [onChange, type]
  );

  // Health check serveur backend
  const checkServerHealth = useCallback(async () => {
    setServerStatus('checking');
    try {
      const response = await fetch(`${API.BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setServerStatus('online');
        return true;
      } else {
        setServerStatus('offline');
        logger.warn('[AssetPicker] Server returned non-200 status');
        return false;
      }
    } catch (error) {
      setServerStatus('offline');
      logger.error('[AssetPicker] Server health check failed:', error);
      return false;
    }
  }, []);

  // Check server health when Upload tab is activated
  useEffect(() => {
    if (activeTab === 'upload' && serverStatus === null) {
      checkServerHealth();
    }
  }, [activeTab, serverStatus, checkServerHealth]);

  const handleFileUpload = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith("image/")) {
        logger.warn("[AssetPicker] Invalid file type:", file?.type);
        setUploadError("Invalid file type. Only images allowed.");
        setUploadStatus("error");
        return;
      }

      // Check server health before upload
      setUploadStatus("uploading");
      const isServerOnline = await checkServerHealth();

      if (!isServerOnline) {
        setUploadError(
          "Upload server is not running. Please start the server with 'npm run dev' (not 'npm run dev:vite')."
        );
        setUploadStatus("error");
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", type + "s"); // 'backgrounds', 'characters', 'illustrations'

      setUploadError(null);

      try {
        const response = await fetch(
          `${API.BASE_URL}/api/assets/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();

        // Select the newly uploaded asset
        handleSelect(data.path);

        // Reload manifest to update library
        if (reloadManifest) {
          setTimeout(() => reloadManifest(), TIMING.DEBOUNCE_AUTOSAVE); // Small delay for manifest generation
        } else {
          // Fallback: reload page
          setTimeout(() => window.location.reload(), TIMING.UPLOAD_RELOAD_DELAY);
        }

        setUploadStatus("success");
      } catch (error) {
        logger.error("[AssetPicker] Upload error:", error);
        setUploadError(error.message);
        setUploadStatus("error");
      }
    },
    [type, handleSelect, reloadManifest, checkServerHealth]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

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
    <div className={`bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-slate-800 border-b border-slate-700 rounded-none justify-start p-2">
          <TabsTrigger value="library" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="h-4 w-4" />
            Bibliothèque
          </TabsTrigger>
          {allowUpload && (
            <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <UploadIcon className="h-4 w-4" />
              Upload
            </TabsTrigger>
          )}
          {allowUrl && (
            <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="library" className="p-4 m-0 min-h-[300px]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  Chargement des assets...
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                <p className="font-semibold mb-1">Erreur de chargement</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Le manifeste n'a pas pu être chargé. Vérifiez que le script de génération est lancé.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && assets.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 font-medium mb-2">
                Aucun asset disponible
              </p>
              <p className="text-sm text-slate-500">
                Ajoutez des images dans{" "}
                <code className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 border border-slate-700">
                  /public/assets/{type}s/
                </code>
              </p>
            </div>
          )}

          {!loading && !error && assets.length > 0 && (
            <>
              {/* Grid - Taille réduite pour éviter débordement */}
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
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
              </ScrollArea>

              {/* Recent */}
              {recentAssets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    Récemment utilisés
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {recentAssets.map((assetPath, idx) => (
                      <Badge
                        key={idx}
                        variant={value === assetPath ? "default" : "outline"}
                        className={`cursor-pointer text-xs px-3 py-1.5 ${
                          value === assetPath
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300"
                        }`}
                        onClick={() => handleSelect(assetPath)}
                      >
                        {assetPath.split("/").pop().slice(0, 20)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="upload" className="p-4 m-0 min-h-[300px]">
            {/* Server Status Banners */}
            {serverStatus === 'checking' && (
              <Alert className="mb-4 bg-blue-900/20 border-blue-800">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription className="text-blue-200 text-sm">
                  Vérification du serveur d'upload...
                </AlertDescription>
              </Alert>
            )}

            {serverStatus === 'offline' && (
              <Alert variant="destructive" className="mb-4 bg-amber-900/20 border-amber-700">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-amber-800 font-semibold mb-1">Upload server not available</p>
                    <p className="text-sm text-amber-700 mb-2">The upload feature requires the backend server to be running.</p>
                    <div className="bg-amber-100 border border-amber-300 rounded p-3 mb-2">
                      <p className="text-xs font-mono text-amber-900 mb-1">Please run:</p>
                      <code className="text-xs bg-white px-2 py-1 rounded border border-amber-300 text-amber-900 block">
                        npm run dev
                      </code>
                    </div>
                    <p className="text-xs text-amber-600">This starts Vite (port 5173) + upload server (port 3001).</p>
                    <Button
                      onClick={checkServerHealth}
                      className="mt-3 bg-amber-600 hover:bg-amber-700"
                      size="sm"
                    >
                      Réessayer
                    </Button>
                  </div>
                </div>
              </Alert>
            )}

            {serverStatus === 'online' && (
              <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700 font-medium">Upload server is online</p>
              </div>
            )}

            {/* Upload Status Messages */}
            {uploadStatus === "uploading" && (
              <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-blue-700 font-semibold">Uploading...</p>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-semibold">
                  ✅ Upload successful!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Asset added to library
                </p>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-semibold">❌ Upload failed</p>
                <p className="text-sm text-red-600 mt-1">{uploadError}</p>
              </div>
            )}

            {/* Upload Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50 scale-[1.02]"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400"
              } ${
                uploadStatus === "uploading" || serverStatus === 'offline'
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              <svg
                className="w-16 h-16 mx-auto mb-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="font-semibold text-slate-700 mb-2">
                Glissez une image ici
              </p>
              <p className="text-sm text-slate-500 mb-4">
                ou cliquez pour parcourir
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadStatus === "uploading" || serverStatus === 'offline'}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Choisir un fichier
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-4">
                Formats supportes : JPG, PNG, SVG, GIF, WebP
              </p>
              <p className="text-xs text-green-600 mt-1 font-medium">
                ✨ Uploaded to /public/assets - Max 10MB
              </p>
            </div>
        </TabsContent>

        <TabsContent value="url" className="p-4 m-0 min-h-[300px]">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            URL de l'image
          </label>
          <Input
            type="url"
            className="w-full bg-slate-800 border-slate-700 text-slate-100"
            placeholder="https://example.com/image.jpg"
            defaultValue={value}
            onBlur={(e) => handleSelect(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-2">
            Entrez l'URL complète d'une image hébergée en ligne
          </p>
          <Alert className="mt-4 bg-blue-900/20 border-blue-800">
            <AlertDescription className="text-sm text-blue-200">
              💡 <strong>Astuce :</strong> Vous pouvez aussi utiliser des chemins relatifs comme
              <code className="bg-slate-800 px-2 py-1 rounded ml-1 text-slate-300 border border-slate-700">
                /assets/backgrounds/custom.jpg
              </code>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {(previewAsset || value) && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-700">
          <p className="text-xs font-semibold text-slate-400 mb-2 mt-3">
            Aperçu
          </p>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <LazyImage
              src={previewAsset?.path || value}
              alt="Preview"
              className="w-full h-40 object-contain rounded"
            />
            {previewAsset && (
              <div className="mt-2 text-xs text-slate-400 space-y-1">
                <p>
                  <strong className="text-slate-300">Nom :</strong> {previewAsset.name}
                </p>
                <p>
                  <strong className="text-slate-300">Type :</strong> {previewAsset.type.toUpperCase()}
                </p>
                {previewAsset.size && (
                  <p>
                    <strong className="text-slate-300">Taille :</strong>{" "}
                    {(previewAsset.size / 1024).toFixed(1)} KB
                  </p>
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
          ? "border-blue-500 shadow-md ring-2 ring-blue-500/50"
          : "border-slate-700 hover:border-blue-500 hover:shadow-md"
      }`}
    >
      <LazyImage
        src={asset.path}
        alt={asset.name}
        className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
      />
      <div
        className={`text-[10px] px-2 py-1 text-center font-medium transition-colors truncate ${
          selected
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-slate-300 group-hover:bg-blue-600/20"
        }`}
      >
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
        <div className={`${className} bg-slate-700 animate-pulse`} />
      )}
      {failed && (
        <div
          className={`${className} bg-slate-800 flex items-center justify-center text-xs text-slate-500 border border-slate-700`}
        >
          Image non disponible
        </div>
      )}
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className} ${
            loaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
