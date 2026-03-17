export interface Asset {
  /** Unique identifier — equals path, computed in useAssets */
  id: string;
  name: string;
  /** Chemin original (absolu en Tauri, relatif web en mode web) */
  path: string;
  /** URL display-ready (asset://localhost/... en Tauri, identique à path en web) */
  url: string;
  category: string;
  /** Source du manifest: 'bundled' | 'user' */
  source?: string;
  /** MIME type (ex: 'image/png', 'audio/mp3') — optionnel selon le manifest */
  type?: string;
  /** Taille en octets — optionnel selon le manifest */
  size?: number;
  /** Tags utilisateur — persistés dans settingsStore (Phase 2) */
  tags?: string[];
}
