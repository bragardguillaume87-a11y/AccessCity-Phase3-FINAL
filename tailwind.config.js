/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				// ===== NEW V2 DESIGN TOKENS (WCAG AA) =====
				'primary-v2': {
					50: 'var(--color-primary-50)',
					100: 'var(--color-primary-100)',
					200: 'var(--color-primary-200)',
					300: 'var(--color-primary-300)',
					400: 'var(--color-primary-400)',
					500: 'var(--color-primary-500)',
					600: 'var(--color-primary-600)',
					700: 'var(--color-primary-700)',
					800: 'var(--color-primary-800)',
					900: 'var(--color-primary-900)',
					DEFAULT: 'var(--color-primary-500)',
				},
				'secondary-v2': {
					50: 'var(--color-secondary-50)',
					100: 'var(--color-secondary-100)',
					200: 'var(--color-secondary-200)',
					300: 'var(--color-secondary-300)',
					400: 'var(--color-secondary-400)',
					500: 'var(--color-secondary-500)',
					600: 'var(--color-secondary-600)',
					700: 'var(--color-secondary-700)',
					800: 'var(--color-secondary-800)',
					900: 'var(--color-secondary-900)',
					DEFAULT: 'var(--color-secondary-500)',
				},
				'success-v2': {
					light: 'var(--color-success-light)',
					DEFAULT: 'var(--color-success)',
					dark: 'var(--color-success-dark)',
				},
				'warning-v2': {
					light: 'var(--color-warning-light)',
					DEFAULT: 'var(--color-warning)',
					dark: 'var(--color-warning-dark)',
				},
				'danger-v2': {
					light: 'var(--color-danger-light)',
					DEFAULT: 'var(--color-danger)',
					dark: 'var(--color-danger-dark)',
				},
				'info-v2': {
					light: 'var(--color-info-light)',
					DEFAULT: 'var(--color-info)',
					dark: 'var(--color-info-dark)',
				},
				'background-v2': 'var(--color-background)',
				'foreground-v2': 'var(--color-foreground)',
				'muted-v2': 'var(--color-muted)',
				'muted-foreground-v2': 'var(--color-muted-foreground)',
				'border-v2': 'var(--color-border)',
				'border-strong-v2': 'var(--color-border-strong)',
				'input-v2': 'var(--color-input)',
				'ring-v2': 'var(--color-ring)',

				// ===== EXISTING COLORS (KEEP UNCHANGED) =====
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					hover: '#2563eb',
					light: '#60a5fa',
					dark: '#1d4ed8',
					foreground: 'hsl(var(--primary-foreground))'
				},
				'app-bg': '#f8fafc',
				'panel-bg': '#ffffff',
				'panel-bg-alt': '#f1f5f9',
				border: 'hsl(var(--border))',
				'border-strong': '#cbd5e1',
				'txt-primary': '#0f172a',
				'txt-secondary': '#475569',
				'txt-tertiary': '#94a3b8',
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					hover: '#2563eb',
					light: '#dbeafe',
					foreground: 'hsl(var(--accent-foreground))'
				},
				success: '#10b981',
				warning: '#f59e0b',
				error: '#ef4444',
				'game-purple': '#8B5CF6',
				'game-purple-hover': '#7C3AED',
				'game-purple-glow': 'rgba(139, 92, 246, 0.5)',
				'game-teal': '#14B8A6',
				'game-teal-hover': '#0D9488',
				'game-teal-glow': 'rgba(20, 184, 166, 0.5)',
				'game-orange': '#F97316',
				'game-orange-hover': '#EA580C',
				'game-orange-glow': 'rgba(249, 115, 22, 0.5)',
				'game-blue': '#3B82F6',
				'game-blue-hover': '#2563EB',
				'game-blue-glow': 'rgba(59, 130, 246, 0.5)',
				'game-pink': '#EC4899',
				'game-pink-hover': '#DB2777',
				'game-pink-glow': 'rgba(236, 72, 153, 0.5)',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			// ===== NEW V2 SPACING TOKENS =====
			spacing: {
				'1-v2': 'var(--space-1)',
				'2-v2': 'var(--space-2)',
				'3-v2': 'var(--space-3)',
				'4-v2': 'var(--space-4)',
				'5-v2': 'var(--space-5)',
				'6-v2': 'var(--space-6)',
				'8-v2': 'var(--space-8)',
				'10-v2': 'var(--space-10)',
				'12-v2': 'var(--space-12)',
				'16-v2': 'var(--space-16)',
				'20-v2': 'var(--space-20)',
			},
			// ===== NEW V2 FONT FAMILY =====
			fontFamily: {
				'sans-v2': 'var(--font-family-base)',
				'mono-v2': 'var(--font-family-mono)',
			},
			// ===== NEW V2 FONT SIZE =====
			fontSize: {
				'xs-v2': 'var(--font-size-xs)',
				'sm-v2': 'var(--font-size-sm)',
				'base-v2': 'var(--font-size-base)',
				'lg-v2': 'var(--font-size-lg)',
				'xl-v2': 'var(--font-size-xl)',
				'2xl-v2': 'var(--font-size-2xl)',
				'3xl-v2': 'var(--font-size-3xl)',
				'4xl-v2': 'var(--font-size-4xl)',
			},
			boxShadow: {
				// ===== NEW V2 SHADOW TOKENS =====
				'xs-v2': 'var(--shadow-xs)',
				'sm-v2': 'var(--shadow-sm)',
				'md-v2': 'var(--shadow-md)',
				'lg-v2': 'var(--shadow-lg)',
				'xl-v2': 'var(--shadow-xl)',
				'2xl-v2': 'var(--shadow-2xl)',
				'inner-v2': 'var(--shadow-inner)',
				'focus-v2': 'var(--shadow-focus)',

				// ===== EXISTING SHADOWS (KEEP UNCHANGED) =====
				app: '0 1px 3px rgba(0, 0, 0, 0.1)',
				'app-md': '0 4px 12px rgba(0, 0, 0, 0.15)',
				'game-glow': '0 0 20px var(--glow-color, rgba(139, 92, 246, 0.3))',
				'game-glow-lg': '0 0 40px var(--glow-color, rgba(139, 92, 246, 0.4))',
				'game-card': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
				'game-card-hover': '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
			},
			borderRadius: {
				// ===== NEW V2 RADIUS TOKENS =====
				'sm-v2': 'var(--radius-sm)',
				'md-v2': 'var(--radius-md)',
				'lg-v2': 'var(--radius-lg)',
				'xl-v2': 'var(--radius-xl)',
				'2xl-v2': 'var(--radius-2xl)',
				'full-v2': 'var(--radius-full)',

				// ===== EXISTING RADIUS (KEEP UNCHANGED) =====
				app: '8px',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			// ===== NEW V2 TRANSITIONS =====
			transitionDuration: {
				'fast-v2': '150ms',
				'base-v2': '200ms',
				'slow-v2': '300ms',
				'slower-v2': '500ms',
			},
			transitionTimingFunction: {
				'ease-in-v2': 'var(--ease-in)',
				'ease-out-v2': 'var(--ease-out)',
				'ease-in-out-v2': 'var(--ease-in-out)',
			},
			// ===== NEW V2 Z-INDEX =====
			zIndex: {
				'base-v2': '0',
				'dropdown-v2': '1000',
				'sticky-v2': '1020',
				'fixed-v2': '1030',
				'modal-backdrop-v2': '1040',
				'modal-v2': '1050',
				'popover-v2': '1060',
				'tooltip-v2': '1070',
				'notification-v2': '1080',
				'max-v2': '9999',
			},
			animation: {
				'fade-in': 'fadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1)',
				'slide-in': 'slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
				'slide-in-delay': 'slideIn 400ms cubic-bezier(0.4, 0, 0.2, 1)',
				'bounce-subtle': 'bounceSubtle 400ms cubic-bezier(0.4, 0, 0.2, 1)',
				'glow-pulse': 'glowPulse 2s ease-in-out infinite',
				shimmer: 'shimmer 2s linear infinite',
				float: 'float 3s ease-in-out infinite',
				'scale-in': 'scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
				shake: 'shake 400ms ease-in-out',
				// AAA Animations
				'dice-roll': 'diceRoll 1s ease-in-out',
				'confetti-fall': 'confettiFall 3s ease-out forwards',
				'pulse-glow-aaa': 'pulseGlowAAA 2s ease-in-out infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': {
						opacity: '0',
						transform: 'translateY(12px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				slideIn: {
					'0%': {
						opacity: '0',
						transform: 'translateX(-20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				bounceSubtle: {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-8px)'
					}
				},
				glowPulse: {
					'0%, 100%': {
						boxShadow: '0 0 20px var(--glow-color, rgba(139, 92, 246, 0.3))'
					},
					'50%': {
						boxShadow: '0 0 40px var(--glow-color, rgba(139, 92, 246, 0.6))'
					}
				},
				shimmer: {
					'0%': {
						backgroundPosition: '-1000px 0'
					},
					'100%': {
						backgroundPosition: '1000px 0'
					}
				},
				float: {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				scaleIn: {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				shake: {
					'0%, 100%': {
						transform: 'translateX(0)'
					},
					'25%': {
						transform: 'translateX(-8px)'
					},
					'75%': {
						transform: 'translateX(8px)'
					}
				},
				// AAA Keyframes
				diceRoll: {
					'0%, 100%': {
						transform: 'rotate(0deg)'
					},
					'25%': {
						transform: 'rotate(90deg)'
					},
					'50%': {
						transform: 'rotate(180deg)'
					},
					'75%': {
						transform: 'rotate(270deg)'
					}
				},
				confettiFall: {
					'0%': {
						transform: 'translateY(-100vh) rotate(0deg)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateY(100vh) rotate(720deg)',
						opacity: '0'
					}
				},
				pulseGlowAAA: {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
					},
					'50%': {
						boxShadow: '0 0 40px rgba(59, 130, 246, 1)'
					}
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
