import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2 } from 'lucide-react';

/**
 * GameSettingsSection - Game variables configuration
 * Allows editing of game variables (Empathie, Autonomie, Confiance)
 * Each variable has initial, min, and max values
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onVariableChange - Callback when a variable changes (varName, field, value)
 */
export function GameSettingsSection({ formData, onVariableChange }) {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section Header */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Variables de Jeu
        </h3>
      </div>

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

GameSettingsSection.propTypes = {
  formData: PropTypes.shape({
    game: PropTypes.shape({
      variables: PropTypes.objectOf(
        PropTypes.shape({
          initial: PropTypes.number.isRequired,
          min: PropTypes.number.isRequired,
          max: PropTypes.number.isRequired
        })
      ).isRequired
    }).isRequired
  }).isRequired,
  onVariableChange: PropTypes.func.isRequired
};
