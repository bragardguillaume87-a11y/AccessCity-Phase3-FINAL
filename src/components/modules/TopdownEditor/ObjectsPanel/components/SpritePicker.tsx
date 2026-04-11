import { useState } from 'react';
import { ImagePlus, Upload, Loader2, X } from 'lucide-react';
import { Z_INDEX } from '@/utils/zIndexLayers';

export interface SpritePickerProps {
  assets: { name: string; path: string; url?: string; type?: string }[];
  isUploading: boolean;
  onSelectExisting: (url: string, name: string) => void;
  onUploadClick: () => void;
  onClose: () => void;
}

export function SpritePicker({
  assets,
  isUploading,
  onSelectExisting,
  onUploadClick,
  onClose,
}: SpritePickerProps) {
  const imageAssets = assets.filter(
    (a) => a.type?.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(a.path)
  );
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.TOPDOWN_OVERLAY,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 380,
          maxHeight: '70vh',
          background: '#13131f',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}
        >
          <ImagePlus size={15} style={{ color: '#a78bfa', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
              Choisir l'image du sprite
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              Importe un nouveau fichier ou sélectionne un asset existant
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 6,
              border: 'none',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            }}
            aria-label="Fermer"
          >
            <X size={12} />
          </button>
        </div>

        {/* Upload button */}
        <div style={{ padding: '10px 16px 6px', flexShrink: 0 }}>
          <button
            onClick={onUploadClick}
            disabled={isUploading}
            style={{
              width: '100%',
              height: 38,
              borderRadius: 8,
              border: '1px dashed rgba(139,92,246,0.5)',
              background: isUploading ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.07)',
              color: isUploading ? '#a78bfa' : 'rgba(139,92,246,0.9)',
              cursor: isUploading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!isUploading) e.currentTarget.style.background = 'rgba(139,92,246,0.18)';
            }}
            onMouseLeave={(e) => {
              if (!isUploading) e.currentTarget.style.background = 'rgba(139,92,246,0.07)';
            }}
          >
            {isUploading ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Chargement…
              </>
            ) : (
              <>
                <Upload size={14} /> Importer depuis l'ordinateur
              </>
            )}
          </button>
        </div>

        {/* Assets list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 10px' }}>
          {imageAssets.length === 0 ? (
            <div
              style={{
                padding: '20px 0',
                textAlign: 'center',
                fontSize: 14,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              Aucun sprite dans la bibliothèque.
              <br />
              <span style={{ fontSize: 14 }}>Importez un fichier PNG ci-dessus.</span>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '6px 4px 4px',
                }}
              >
                Bibliothèque ({imageAssets.length})
              </div>
              {imageAssets.map((a) => {
                const url = a.url ?? a.path;
                const isHov = hovered === url;
                return (
                  <button
                    key={url}
                    onClick={() => onSelectExisting(url, a.name)}
                    onMouseEnter={() => setHovered(url)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 8px',
                      borderRadius: 7,
                      border: isHov ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
                      background: isHov ? 'rgba(139,92,246,0.1)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.08s',
                    }}
                  >
                    <img
                      src={url}
                      alt={a.name}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: 'contain',
                        borderRadius: 4,
                        background: 'rgba(0,0,0,0.4)',
                        flexShrink: 0,
                        imageRendering: 'pixelated',
                      }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: isHov ? '#c4b5fd' : 'rgba(255,255,255,0.8)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.3)',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {url.split('/').pop()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
