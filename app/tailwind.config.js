/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            brand: {
                bg: '#FFFFFF',      // White - New Base
                panel: '#F1F2F5',   // Light Gray Surface
                surface: '#FFFFFF', // White Surface
                primary: '#E2000F', // Brand Red - Main Action
                secondary: '#686868', // Dove Gray - Secondary Text/borders
                success: '#10b981', // Emerald 500 - Keep for success
                danger: '#E2000F',  // Brand Red - Danger/Error
                highlight: '#333333', // Deep Black/Gray for Text
                border: '#e2e8f0',  // Slate 200 - Subtle Borders
            }
        },
        animation: {
            'blob': 'blob 7s infinite',
            'marquee': 'marquee 30s linear infinite',
            'spotlight': 'spotlight 2s ease .75s 1 forwards',
            'shimmer': 'shimmer 2s linear infinite',
            'meteor': 'meteor 5s linear infinite',
        },
        keyframes: {
            blob: {
                '0%': { transform: 'translate(0px, 0px) scale(1)' },
                '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                '100%': { transform: 'translate(0px, 0px) scale(1)' },
            },
            marquee: {
                '0%': { transform: 'translateX(0%)' },
                '100%': { transform: 'translateX(-50%)' },
            },
            spotlight: {
                '0%': { opacity: 0, transform: 'translate(-72%, -62%) scale(0.5)' },
                '100%': { opacity: 1, transform: 'translate(-50%,-40%) scale(1)' },
            },
            shimmer: {
                from: { backgroundPosition: '0 0' },
                to: { backgroundPosition: '-200% 0' },
            },
            meteor: {
                '0%': { transform: 'rotate(215deg) translateX(0)', opacity: 1 },
                '70%': { opacity: 1 },
                '100%': { transform: 'rotate(215deg) translateX(-500px)', opacity: 0 },
            },
        },
    },
    plugins: [],
}
