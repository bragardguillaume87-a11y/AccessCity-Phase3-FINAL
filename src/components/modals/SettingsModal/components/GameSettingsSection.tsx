import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Gamepad2, BarChart3 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { SettingsFormData } from '../hooks/useSettingsImportExport';

/**
 * Props for GameSettingsSection component
 */
export interface GameSettingsSectionProps {
  /** Current form data */
  formData: SettingsFormData;
  /** Callback when a variable changes (varName, field, value) */
  onVariableChange: (varName: string, field: string, value: number) => void;
}

/**
 * GameSettingsSection - Game variables configuration
 *
 * Allows editing of game variables (Physique, Mentale) and Stats HUD toggle.
 * Each variable has initial, min, and max values that can be configured.
 *
 * @param props - Component props
 * @param props.formData - Current form data
 * @param props.onVariableChange - Callback when a variable changes (varName, field, value)
 *
 * @example
 * ```tsx
 * <GameSettingsSection
 *   formData={formData}
 *   onVariableChange={handleVariableChange}
 * />
 * ```
 */
export function GameSettingsSection({
  formData,
  onVariableChange
}: GameSettingsSectionProps): React.ReactElement {
  const enableStatsHUD = useSettingsStore(s => s.enableStatsHUD);
  const setEnableStatsHUD = useSettingsStore(s => s.setEnableStatsHUD);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Variables de Jeu
        </h3>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Afficher les stats pendant le jeu</p>
                <p className="text-xs text-muted-foreground">
                  Montre la Physique et la Mentale en haut de l'écran de jeu
                </p>
              </div>
            </div>
            <Switch
              checked={enableStatsHUD}
              onCheckedChange={setEnableStatsHUD}
              aria-label="Activer l'affichage des stats en jeu"
            />
          </div>
        </CardContent>
      </Card>

      {/* Game Variables */}
      <div className="space-y-4">
        {Object.entries(formData.game.variables).map(([varName, varConfig]) => (
          <Card
            key={varName}
            className="transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:scale-102"
          >
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-primary">{varName}</h4>
              <div className="grid grid-cols-3 gap-4">
                {/* Initial Value */}
                <div>
                  <label
                    htmlFor={`${varName}-initial`}
                    className="block text-xs font-semibold text-muted-foreground mb-1"
                  >
                    Valeur initiale
                  </label>
                  <Input
                    id={`${varName}-initial`}
                    type="number"
                    value={varConfig.initial}
                    onChange={(e) => onVariableChange(varName, 'initial', parseInt(e.target.value))}
                    className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
                  />
                </div>

                {/* Minimum Value */}
                <div>
                  <label
                    htmlFor={`${varName}-min`}
                    className="block text-xs font-semibold text-muted-foreground mb-1"
                  >
                    Minimum
                  </label>
                  <Input
                    id={`${varName}-min`}
                    type="number"
                    value={varConfig.min}
                    onChange={(e) => onVariableChange(varName, 'min', parseInt(e.target.value))}
                    className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
                  />
                </div>

                {/* Maximum Value */}
                <div>
                  <label
                    htmlFor={`${varName}-max`}
                    className="block text-xs font-semibold text-muted-foreground mb-1"
                  >
                    Maximum
                  </label>
                  <Input
                    id={`${varName}-max`}
                    type="number"
                    value={varConfig.max}
                    onChange={(e) => onVariableChange(varName, 'max', parseInt(e.target.value))}
                    className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
