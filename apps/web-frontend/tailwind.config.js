/** @type {import('tailwindcss').Config} */
export default {
  content: ["index.html", "./src/**/*.{js,jsx,ts,tsx,vue,html}"],
  theme: {
    extend: {
      flex: {
        2: "2 2 0%",
        3: "3 3 0%",
      },
    },
  },
  plugins: [],
};
