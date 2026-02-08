/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      colors: {
        // Modern Orange/Peach Palette
        primary: {
          50: '#FFF5E6',   // Pale Peach
          100: '#FFE5CC',  // Light Peach
          200: '#FFD4B3',  // Soft Peach
          300: '#FFC299',  // Warm Peach
          400: '#FFB84D',  // Medium Orange/Tangerine
          500: '#FF8C42',  // Vibrant Orange
          600: '#FF6B35',  // Deep Orange
          700: '#E55A2B',  // Dark Orange
          800: '#CC4A21',  // Darker Orange
          900: '#B33A17',  // Deepest Orange
        },
        // Keep blue for secondary actions
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#007BFF',
          700: '#0056b3',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Modern gray scale
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Accent colors for variety
        accent: {
          green: '#10B981',
          purple: '#8B5CF6',
          teal: '#14B8A6',
          pink: '#EC4899',
        }
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-modern': 'linear-gradient(135deg, #FFF5E6 0%, #FFE5CC 50%, #FF8C42 100%)',
        'gradient-orange': 'linear-gradient(135deg, #FFB84D 0%, #FF6B35 100%)',
      }
    },
  },
  plugins: [],
}
