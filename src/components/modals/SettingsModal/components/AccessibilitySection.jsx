import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Accessibility } from 'lucide-react';

/**
 * AccessibilitySection - Accessibility settings (placeholder for future implementation)
 * Display-only section for accessibility preferences
 * These settings are not yet functional but provide UI for future implementation
 */
export function AccessibilitySection() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section Header */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Accessibility className="h-5 w-5 text-primary" />
          Paramètres d'Accessibilité
        </h3>
      </div>

      {/* Accessibility Options */}
      <div className="space-y-4">
        {/* Description */}
        <p className="text-muted-foreground">
          Configure les fonctionnalités d'accessibilité pour améliorer ton expérience de l'éditeur.
        </p>

        <Separator />

        {/* High Contrast Mode */}
        <div className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
          <Checkbox
            id="high-contrast"
            disabled
            className="transition-transform duration-200 hover:scale-110"
          />
          <label
            htmlFor="high-contrast"
            className="text-sm font-semibold cursor-not-allowed opacity-70"
          >
            Mode Contraste Élevé
          </label>
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
          <Checkbox
            id="reduce-motion"
            disabled
            className="transition-transform duration-200 hover:scale-110"
          />
          <label
            htmlFor="reduce-motion"
            className="text-sm font-semibold cursor-not-allowed opacity-70"
          >
            Réduire les animations
          </label>
        </div>

        {/* Screen Reader Optimizations */}
        <div className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
          <Checkbox
            id="screen-reader"
            disabled
            className="transition-transform duration-200 hover:scale-110"
          />
          <label
            htmlFor="screen-reader"
            className="text-sm font-semibold cursor-not-allowed opacity-70"
          >
            Optimisations Lecteur d'Écran
          </label>
        </div>

        <Separator />

        {/* Font Size */}
        <div className="transition-all duration-200 hover:translate-x-1">
          <label htmlFor="font-size" className="block text-sm font-semibold mb-2">
            Taille de police
          </label>
          <select
            id="font-size"
            disabled
            className="w-full px-4 py-2 border border-input bg-background rounded-md text-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring cursor-not-allowed opacity-70
                     transition-all duration-200 hover:border-primary/50"
          >
            <option value="small">Petite</option>
            <option value="medium">Moyenne (Par défaut)</option>
            <option value="large">Grande</option>
          </select>
        </div>

        {/* Info Message */}
        <p className="text-sm text-muted-foreground mt-4 px-2 py-3 bg-muted/30 rounded-md border border-muted">
          Les fonctionnalités d'accessibilité sont en développement. Certaines options peuvent ne pas être totalement fonctionnelles.
        </p>
      </div>
    </div>
  );
}

AccessibilitySection.propTypes = {};
