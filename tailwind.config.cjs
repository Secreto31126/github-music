/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#141414',
				secondary: '#B80000',
				contrast: '#E0E0E0',
				gradient: '#1A3552',
				selected: '#06B148'
			}
		}
	},
	plugins: []
};
