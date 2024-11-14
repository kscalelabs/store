/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	fontFamily: {
  		sans: ["Inter", "sans-serif"],
  		orbitron: ["Orbitron", "sans-serif"],
  		mono: ["monospace"]
  	},
  	extend: {
  		animation: {
  			meteor: 'meteor 5s linear infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		keyframes: {
  			meteor: {
  				'0%': {
  					transform: 'rotate(215deg) translateX(0)',
  					opacity: '1'
  				},
  				'70%': {
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'rotate(215deg) translateX(-500px)',
  					opacity: '0'
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			gray: {
  				'1': '#ffffff',
  				'2': '#f9f9fb',
  				'3': '#eff0f3',
  				'4': '#e7e8ec',
  				'5': '#e0e1e6',
  				'6': '#d8d9e0',
  				'7': '#cdced7',
  				'8': '#b9bbc6',
  				'9': '#8b8d98',
  				'10': '#80828d',
  				'11': '#62636c',
  				'12': '#000000'
  			},
  			primary: {
  				'1': '#fefcfb',
  				'2': '#fff5f1',
  				'3': '#ffe8de',
  				'4': '#ffd7c7',
  				'5': '#ffc9b4',
  				'6': '#ffb89f',
  				'7': '#ffa284',
  				'8': '#fb8765',
  				'9': '#ffffff',
  				'10': '#f14000',
  				'11': '#de3500',
  				'12': '#000000',
  				DEFAULT: '#ff4f00',
  				foreground: '#000000'
  			},
  			background: '#000000',
  			foreground: '#ffffff',
  			card: {
  				DEFAULT: '#000000',
  				foreground: '#ffffff'
  			},
  			popover: {
  				DEFAULT: '#000000',
  				foreground: '#ffffff'
  			},
  			secondary: {
  				DEFAULT: '#000000',
  				foreground: '#ffffff'
  			},
  			muted: {
  				DEFAULT: '#000000',
  				foreground: '#ffffff'
  			},
  			accent: {
  				DEFAULT: '#000000',
  				foreground: '#ffffff'
  			},
  			destructive: {
  				DEFAULT: '#DD4425',
  				foreground: '#ffffff'
  			},
  			border: '#ffffff',
  			input: '#000000',
  			ring: '#ffffff',
  			chart: {
  				'1': 'rgb(59, 130, 246)',
  				'2': 'rgb(16, 185, 129)',
  				'3': 'rgb(251, 146, 60)',
  				'4': 'rgb(147, 51, 234)',
  				'5': 'rgb(236, 72, 153)'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
  base: {
    "html, body": {
      color: "#ffffff",
      backgroundColor: "#000000",
    },
  },
};
