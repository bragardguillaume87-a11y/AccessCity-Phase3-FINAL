/**
 * ThemeSelector - Dropdown to change the graph theme
 *
 * Positioned in the toolbar of the DialogueGraphModal.
 * Allows switching between available themes (Default, Cosmos, etc.)
 */
import { Palette } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUIStore } from '@/stores';
import { GRAPH_THEMES } from '@/config/graphThemes';

export function ThemeSelector() {
  const currentThemeId = useUIStore((state) => state.graphThemeId);
  const setGraphThemeId = useUIStore((state) => state.setGraphThemeId);

  return (
    <div className="flex items-center gap-2">
      <Palette className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      <Select value={currentThemeId} onValueChange={setGraphThemeId}>
        <SelectTrigger
          className="w-[130px] h-8 text-xs bg-transparent border-border/50 hover:border-border focus:ring-1 focus:ring-cyan-500"
          aria-label="Sélectionner le thème visuel"
        >
          <SelectValue placeholder="Thème" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(GRAPH_THEMES).map((theme) => (
            <SelectItem
              key={theme.id}
              value={theme.id}
              className="text-xs"
            >
              <div className="flex flex-col">
                <span className="font-medium">{theme.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {theme.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
