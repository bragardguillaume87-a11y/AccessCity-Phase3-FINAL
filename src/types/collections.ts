/**
 * Collection d'assets personnalisée (dossier utilisateur).
 *
 * Les smart collections (Favoris, Récents, Non utilisés, Protagoniste)
 * sont calculées dynamiquement — elles ne sont PAS stockées ici.
 */
export interface AssetCollection {
  /** Identifiant unique (nanoid) */
  id: string;
  /** Nom affiché dans la sidebar */
  name: string;
  /** IDs des assets inclus (= asset.path) */
  assetIds: string[];
}
