import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Sparkles, Eye } from 'lucide-react';

/**
 * CharacterStatsBar - Displays aggregate statistics for all characters
 * Inspired by Nintendo UX Guide: Visual stats cards with smooth animations
 *
 * THEME FIXES (Phase 6D):
 * - bg-green-50 → bg-green-500/10 (dark mode compatible)
 * - bg-blue-50 → bg-blue-500/10 (dark mode compatible)
 * - text-green-700 → text-green-400 (better contrast on dark)
 * - text-blue-700 → text-blue-400 (better contrast on dark)
 *
 * UX ENHANCEMENTS:
 * - Hover: scale(1.05) for "magnetic lift" effect
 * - Transition: cubic-bezier(0.4, 0, 0.2, 1) for smooth feel
 */
function CharacterStatsBar({ totalStats }) {
  const stats = [
    {
      id: 'total',
      label: 'Total',
      value: totalStats.total,
      icon: Users,
      bgColor: 'bg-primary/5',
      borderColor: 'border-primary/20',
      iconBgColor: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor: 'text-foreground'
    },
    {
      id: 'complete',
      label: 'Complets',
      value: totalStats.complete,
      icon: Sparkles,
      bgColor: 'bg-green-500/10', // FIXED: was bg-green-50
      borderColor: 'border-green-500/20',
      iconBgColor: 'bg-green-500/10',
      iconColor: 'text-green-500', // FIXED: was text-green-600
      valueColor: 'text-green-400' // FIXED: was text-green-700
    },
    {
      id: 'withSprites',
      label: 'Avec sprites',
      value: totalStats.withSprites,
      icon: Eye,
      bgColor: 'bg-blue-500/10', // FIXED: was bg-blue-50
      borderColor: 'border-blue-500/20',
      iconBgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500', // FIXED: was text-blue-600
      valueColor: 'text-blue-400' // FIXED: was text-blue-700
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.id}
            className={`
              ${stat.borderColor} ${stat.bgColor}
              transition-all duration-200 ease-out
              hover:scale-105 hover:shadow-lg
              cursor-default
            `}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${stat.iconBgColor}`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${stat.valueColor}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

CharacterStatsBar.propTypes = {
  totalStats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    complete: PropTypes.number.isRequired,
    withSprites: PropTypes.number.isRequired
  }).isRequired
};

export default CharacterStatsBar;
