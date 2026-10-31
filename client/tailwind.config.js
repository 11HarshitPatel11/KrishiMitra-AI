/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                    950: '#052e16',
                },
                earth: {
                    50: '#fdfbf7',
                    100: '#f7f2e7',
                    200: '#ede1ca',
                    300: '#dfcba4',
                    400: '#ceaf79',
                    500: '#b89456',
                    600: '#9d7742',
                    700: '#7c5a34',
                    800: '#64482d',
                    900: '#523c27',
                },
                surface: {
                    bg: '#FAFAF7',
                    card: '#FFFFFF',
                    subtle: '#F4F4F0',
                    border: '#E7E5E4',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            boxShadow: {
                'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 1px rgba(0, 0, 0, 0.02)',
                'card': '0 2px 4px -1px rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
                'card-hover': '0 10px 25px -3px rgba(22, 101, 52, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
                'dropdown': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
            },
            borderRadius: {
                'xl': '0.875rem',
                '2xl': '1.25rem',
            }
        },
    },
    plugins: [],
};
