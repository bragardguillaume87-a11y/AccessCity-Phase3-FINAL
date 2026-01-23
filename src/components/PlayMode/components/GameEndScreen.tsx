import React from 'react';
import type { GameStats } from '@/types';
import { IconByName } from '@/components/IconByName';
import { PartyPopper, BarChart3, Heart, Zap, Shield, Sparkles } from 'lucide-react';

/**
 * Props for GameEndScreen component
 */
export interface GameEndScreenProps {
  /** Final game statistics */
  variables: GameStats;
  /** Whether to show confetti animation */
  showConfetti: boolean;
  /** Callback to exit game */
  onExit: () => void;
}

/**
 * GameEndScreen - End game screen with stats and animations
 *
 * Features:
 * - Confetti animation on success (avgScore >= 60)
 * - Animated gradient background
 * - Stats display with progress bars
 * - Success/failure message
 * - Return to editor button
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * if (isEnded) {
 *   return <GameEndScreen variables={variables} showConfetti={showConfetti} onExit={onExit} />;
 * }
 * ```
 */
export function GameEndScreen({
  variables,
  showConfetti,
  onExit
}: GameEndScreenProps): React.JSX.Element {
  const avgScore = (variables.Empathie + variables.Autonomie + variables.Confiance) / 3;
  const isSuccess = avgScore >= 60;

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-card to-background flex items-center justify-center relative overflow-hidden">
      {/* Confettis animés */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][
                  Math.floor(Math.random() * 6)
                ]
              }}
            />
          ))}
        </div>
      )}

      {/* Fond animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20 animate-gradient" />

      {/* Contenu principal */}
      <div className="relative z-10 max-w-2xl w-full mx-auto p-8 text-center">
        {/* Icône principale avec animation */}
        <div className="mb-8 animate-scale-in">
          <div
            className={`
              inline-flex items-center justify-center w-32 h-32 rounded-full
              ${
                isSuccess
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-bounce-slow'
                  : 'bg-gradient-to-br from-muted to-muted'
              }
              shadow-2xl
            `}
          >
            <PartyPopper className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Titre animé */}
        <h1
          className={`
            text-5xl font-bold mb-4 animate-fade-in-up
            ${
              isSuccess
                ? 'bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent'
                : 'text-foreground'
            }
          `}
        >
          Fin du jeu !
        </h1>

        <p className="text-muted-foreground mb-12 text-lg animate-fade-in-up animation-delay-200">
          Merci d'avoir joué à cette aventure
        </p>

        {/* Carte statistiques avec animations */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 mb-8 animate-fade-in-up animation-delay-400 shadow-xl">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Statistiques finales</h2>
          </div>

          <div className="space-y-6">
            {/* Empathie */}
            <StatBar
              icon={<Heart className="w-5 h-5 text-red-400" />}
              label="Empathie"
              value={variables.Empathie}
              color="from-red-500 to-pink-500"
              textColor="text-red-400"
              delay="animation-delay-600"
            />

            {/* Autonomie */}
            <StatBar
              icon={<Zap className="w-5 h-5 text-blue-400" />}
              label="Autonomie"
              value={variables.Autonomie}
              color="from-blue-500 to-cyan-500"
              textColor="text-blue-400"
              delay="animation-delay-800"
              animationDelay="0.2s"
            />

            {/* Confiance */}
            <StatBar
              icon={<Shield className="w-5 h-5 text-green-400" />}
              label="Confiance"
              value={variables.Confiance}
              color="from-green-500 to-emerald-500"
              textColor="text-green-400"
              delay="animation-delay-1000"
              animationDelay="0.4s"
            />
          </div>

          {/* Message de succès */}
          {isSuccess && (
            <div className="mt-8 flex items-center justify-center gap-2 text-yellow-400 animate-pulse-slow">
              <Sparkles className="w-5 h-5" />
              <p className="font-semibold text-lg">Félicitations ! Excellent parcours !</p>
              <Sparkles className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Bouton retour */}
        <button
          onClick={onExit}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 mx-auto animate-fade-in-up animation-delay-1200"
        >
          <IconByName name="arrow-left" className="w-5 h-5" />
          Retour à l'éditeur
        </button>
      </div>

      {/* Styles CSS pour les animations */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall linear infinite;
          top: -10px;
        }

        @keyframes gradient {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-gradient {
          animation: gradient 3s ease-in-out infinite;
        }

        @keyframes scale-in {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        @keyframes fade-in-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(-30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes progress-bar {
          from { width: 0; }
        }
        .animate-progress-bar {
          animation: progress-bar 1.5s ease-out;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1200 { animation-delay: 1.2s; }
      `}</style>
    </div>
  );
}

/**
 * StatBar - Stat progress bar component
 */
interface StatBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  textColor: string;
  delay: string;
  animationDelay?: string;
}

function StatBar({
  icon,
  label,
  value,
  color,
  textColor,
  delay,
  animationDelay = '0s'
}: StatBarProps): React.JSX.Element {
  return (
    <div className={`animate-slide-in-right ${delay}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-foreground font-medium">{label}</span>
        </div>
        <span className={`text-2xl font-bold ${value >= 60 ? textColor : 'text-muted-foreground'}`}>
          {value}/100
        </span>
      </div>
      <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out animate-progress-bar`}
          style={{ width: `${value}%`, animationDelay }}
        />
      </div>
    </div>
  );
}
