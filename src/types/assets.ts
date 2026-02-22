export interface Asset {
  id: string;
  name: string;
  path: string;
  category: string;
  subcategory?: string;
  tags?: string[];
}

export interface AssetManifest {
  backgrounds?: Record<string, string[]>;
  illustrations?: Record<string, string[]>;
  characters?: Record<string, string[]>;
  props?: Record<string, string[]>;
  [category: string]: Record<string, string[]> | undefined;
}

export interface AssetUsageInfo {
  total: number;
  scenes: string[];
  characters: string[];
  sceneCount: number;
  characterCount: number;
}

export interface AssetStats {
  total: number;
  used: number;
  unused: number;
  categoryCount: {
    all: number;
    backgrounds: number;
    characters: number;
    illustrations: number;
    music: number;
    sfx: number;
    voices: number;
  };
}
