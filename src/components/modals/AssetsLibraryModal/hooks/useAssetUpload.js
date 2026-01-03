import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { API } from '@/config/constants';

/**
 * Hook pour gérer l'upload d'assets avec progress tracking et celebrations
 *
 * @param {Object} options
 * @param {string} options.category - Catégorie d'asset (background, character, illustration)
 * @param {Function} options.onUploadComplete - Callback après upload réussi
 * @returns {Object} { uploadFiles, isUploading, progress, uploadedAssets }
 */
export function useAssetUpload({ category = 'background', onUploadComplete } = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedAssets, setUploadedAssets] = useState([]);

  const uploadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('category', category);

    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      // Simuler progress (vrai progress nécessite XMLHttpRequest ou fetch avec streams)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${API.BASE_URL}/api/assets/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const uploaded = result.files || [];
      setUploadedAssets(uploaded);

      // Toast de succès avec undo
      toast.success(`${uploaded.length} fichier(s) uploadé(s) !`, {
        description: uploaded.map(f => f.filename).join(', '),
        duration: 5000,
        action: {
          label: 'Annuler',
          onClick: () => {
            // TODO: Implémenter undo (DELETE request)
            toast.info('Undo non implémenté');
          },
        },
      });

      // Celebration animation (premier upload ou bulk > 5 fichiers)
      const isFirstUpload = localStorage.getItem('hasUploadedAsset') !== 'true';
      if (isFirstUpload || uploaded.length >= 5) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#06b6d4', '#ec4899'], // purple, cyan, pink
        });

        if (isFirstUpload) {
          localStorage.setItem('hasUploadedAsset', 'true');
        }
      }

      // Callback
      if (onUploadComplete) {
        onUploadComplete(uploaded);
      }

      // Reload manifest pour rafraîchir la liste
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('asset-manifest-updated'));
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload', {
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [category, onUploadComplete]);

  return {
    uploadFiles,
    isUploading,
    progress,
    uploadedAssets,
  };
}
