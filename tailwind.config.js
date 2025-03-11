/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{js,cjs,mjs,ts,cts,mts,html,css}"],
  theme: {
    extend: {
      // 这里可以添加你的自定义主题扩展
    },
  },
  plugins: [
    // 如果你在 HTML 中已经引入了 daisyUI，这里不需要再添加
  ],
  daisyui: {
    themes: ["cupcake"],
  },
} 