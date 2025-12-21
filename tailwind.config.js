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
  		boxShadow: {
  			app: '0 1px 3px rgba(0, 0, 0, 0.1)',
  			'app-md': '0 4px 12px rgba(0, 0, 0, 0.15)',
  			'game-glow': '0 0 20px var(--glow-color, rgba(139, 92, 246, 0.3))',
  			'game-glow-lg': '0 0 40px var(--glow-color, rgba(139, 92, 246, 0.4))',
  			'game-card': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
  			'game-card-hover': '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
  		},
  		borderRadius: {
  			app: '8px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
  			shake: 'shake 400ms ease-in-out'
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
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
// rebuild
