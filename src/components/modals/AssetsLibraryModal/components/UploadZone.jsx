import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssetUpload } from '../hooks/useAssetUpload';

export function UploadZone({ category = 'background', compact = false }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { uploadFiles, isUploading, progress } = useAssetUpload({ category });

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      uploadFiles(imageFiles);
    }
  }, [uploadFiles]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, [uploadFiles]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragActive(false);
    }
  }, []);

  // Compact mode: Mini upload button (pour mode sélection)
  if (compact) {
    return (
      <div className="relative">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id={`upload-input-${category}`}
        />
        <label htmlFor={`upload-input-${category}`}>
          <Button
            variant="gaming-accent"
            size="sm"
            className="cursor-pointer"
            asChild
          >
            <span>
              <Upload className="h-3 w-3" />
              Upload
            </span>
          </Button>
        </label>
      </div>
    );
  }

  // Full mode: Grande drop zone (pour mode bibliothèque)
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-8 transition-all",
        "flex flex-col items-center justify-center gap-4",
        "hover:border-purple-500 hover:bg-purple-500/5",
        isDragActive && "border-cyan-400 bg-cyan-400/10 scale-[1.02]",
        isUploading && "opacity-50 pointer-events-none"
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* Icon avec animation */}
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-purple-500 to-cyan-500",
          "transition-transform",
          isDragActive && "scale-110 rotate-6"
        )}
      >
        {isDragActive ? (
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        ) : (
          <ImageIcon className="w-8 h-8 text-white" />
        )}
      </div>

      {/* Texte */}
      <div className="text-center">
        <p className="text-base font-semibold text-white">
          {isDragActive
            ? "Déposez vos fichiers ici !"
            : "Glissez-déposez vos images"}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          ou cliquez pour parcourir
        </p>
        <p className="text-xs text-slate-500 mt-2">
          PNG, JPG, SVG, GIF, WebP • Max 10MB par fichier
        </p>
      </div>

      {/* Browse button */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id={`upload-input-full-${category}`}
      />
      <label htmlFor={`upload-input-full-${category}`}>
        <Button variant="gaming-primary" asChild className="cursor-pointer">
          <span>
            <Upload className="h-4 w-4" />
            Parcourir mes fichiers
          </span>
        </Button>
      </label>

      {/* Progress indicator si upload en cours */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Upload en cours... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
