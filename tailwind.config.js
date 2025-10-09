/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./libs/reactive-artboard/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			'navy-dark': 'hsl(var(--app-navy-dark))',
  			'navy-medium': 'hsl(var(--app-navy-medium))',
  			lime: 'hsl(var(--app-lime))',
  			'lime-hover': 'hsl(var(--app-lime-hover))',
  			'lime-dark': 'hsl(var(--app-lime-dark))',
  			'app-background': 'hsl(var(--app-background))',
  			'app-foreground': 'hsl(var(--app-foreground))',
  			'app-primary': 'hsl(var(--app-primary))',
  			'app-secondary': 'hsl(var(--app-secondary))',
  			'app-muted': 'hsl(var(--app-muted))',
  			'app-accent': 'hsl(var(--app-accent))',
  			'app-border': 'hsl(var(--app-border))',
  			'doc-primary': 'hsl(var(--doc-primary))',
  			'doc-surface': 'hsl(var(--doc-surface))',
  			'doc-foreground': 'hsl(var(--doc-foreground))',
  			'doc-muted': 'hsl(var(--doc-muted))',
  			'doc-accent': 'hsl(var(--doc-accent))',
  			'doc-border': 'hsl(var(--doc-border))',
  			gray: {
  				'50': 'hsl(var(--app-gray-50))',
  				'100': 'hsl(var(--app-gray-100))',
  				'200': 'hsl(var(--app-gray-200))',
  				'300': 'hsl(var(--app-gray-300))',
  				'500': 'hsl(var(--app-gray-500))',
  				'700': 'hsl(var(--app-gray-700))',
  				'900': 'hsl(var(--app-gray-900))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontSize: {
  			xs: 'var(--text-xs)',
  			sm: 'var(--text-sm)',
  			base: 'var(--text-base)',
  			lg: 'var(--text-lg)',
  			xl: 'var(--text-xl)',
  			'2xl': 'var(--text-2xl)',
  			'3xl': 'var(--text-3xl)',
  			'4xl': 'var(--text-4xl)',
  			'5xl': 'var(--text-5xl)',
  			'6xl': 'var(--text-6xl)',
  			'7xl': 'var(--text-7xl)'
  		},
  		fontWeight: {
  			normal: 'var(--font-normal)',
  			medium: 'var(--font-medium)',
  			semibold: 'var(--font-semibold)',
  			bold: 'var(--font-bold)'
  		},
  		lineHeight: {
  			tight: 'var(--leading-tight)',
  			snug: 'var(--leading-snug)',
  			normal: 'var(--leading-normal)',
  			relaxed: 'var(--leading-relaxed)'
  		},
  		letterSpacing: {
  			tight: 'var(--tracking-tight)',
  			normal: 'var(--tracking-normal)',
  			wide: 'var(--tracking-wide)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'var(--font-serif)',
  				'Georgia',
  				'serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'Menlo',
  				'monospace'
  			]
  		},
  		spacing: {
  			'1': 'var(--space-1)',
  			'2': 'var(--space-2)',
  			'3': 'var(--space-3)',
  			'4': 'var(--space-4)',
  			'5': 'var(--space-5)',
  			'6': 'var(--space-6)',
  			'8': 'var(--space-8)',
  			'10': 'var(--space-10)',
  			'12': 'var(--space-12)',
  			'16': 'var(--space-16)',
  			'20': 'var(--space-20)',
  			'24': 'var(--space-24)',
  			'32': 'var(--space-32)'
  		},
  		borderRadius: {
  			sm: 'var(--radius-sm)',
  			md: 'var(--radius-md)',
  			lg: 'var(--radius-lg)',
  			xl: 'var(--radius-xl)',
  			'2xl': 'var(--radius-2xl)',
  			full: 'var(--radius-full)'
  		},
  		boxShadow: {
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			DEFAULT: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		transitionDuration: {
  			fast: 'var(--transition-fast)',
  			base: 'var(--transition-base)',
  			slow: 'var(--transition-slow)'
  		},
  		backgroundImage: {
  			'gradient-hero': 'var(--gradient-hero)',
  			'gradient-section': 'var(--gradient-section)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-out',
  			'slide-in': 'slideInRight 0.6s ease-out',
  			opacity: 'opacity 0.25s ease-in-out',
  			appearFromRight: 'appearFromRight 300ms ease-in-out',
  			wiggle: 'wiggle 1.5s ease-in-out infinite',
  			popup: 'popup 0.25s ease-in-out',
  			shimmer: 'shimmer 3s ease-out infinite alternate',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		keyframes: {
  			fadeIn: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideInRight: {
  				from: {
  					opacity: '0',
  					transform: 'translateX(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			opacity: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			appearFromRight: {
  				'0%': {
  					opacity: '0.3',
  					transform: 'translate(15%, 0px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translate(0)'
  				}
  			},
  			wiggle: {
  				'0%, 20%, 80%, 100%': {
  					transform: 'rotate(0deg)'
  				},
  				'30%, 60%': {
  					transform: 'rotate(-2deg)'
  				},
  				'40%, 70%': {
  					transform: 'rotate(2deg)'
  				},
  				'45%': {
  					transform: 'rotate(-4deg)'
  				},
  				'55%': {
  					transform: 'rotate(4deg)'
  				}
  			},
  			popup: {
  				'0%': {
  					transform: 'scale(0.8)',
  					opacity: '0.8'
  				},
  				'50%': {
  					transform: 'scale(1.1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '0 50%'
  				},
  				'50%': {
  					backgroundPosition: '100% 50%'
  				},
  				'100%': {
  					backgroundPosition: '0% 50%'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		container: {
  			center: true,
  			padding: {
  				DEFAULT: 'var(--space-6)',
  				md: 'var(--space-8)'
  			},
  			screens: {
  				sm: '640px',
  				md: '768px',
  				lg: '1024px',
  				xl: '1280px',
  				'2xl': '1536px'
  			}
  		}
  	}
  },
  plugins: [],
};
