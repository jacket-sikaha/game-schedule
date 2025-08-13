import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import svgr from "vite-plugin-svgr";
import { resolve } from "path";

// const ORIGIN_SERVER = import.meta.env.VITE_ORIGIN_SERVER;
// https://vitejs.dev/config/
// Vite 默认是不加载 .env 文件的，因为这些文件需要在执行完 Vite 配置后才能确定加载哪一个
export default defineConfig(({ command, mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      svgr(),
      viteCompression({
        algorithm: "gzip",
        threshold: 10240,
        ext: ".gz",
      }),
      visualizer({
        open: process.env.NODE_ENV === "production",
        filename: "bundle-analysis.html",
      }),
    ],
    resolve: {
      // 配置别名 减少查找模块时间消耗
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "./src"),
        },
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            antd: ["antd"],
            vendor: ["react", "react-dom", "react-router-dom"],
            mui: ["@mui/material", "@mui/icons-material"],
            utils: ["axios", "dayjs"],
          },
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        },
      },
      esbuild: {
        dropconsole: true, // 生产环境移除console
        dropdebugger: true, // 移除debugger
      },
      // minify: false
    },
    server: {
      proxy: {
        // string shorthand: http://localhost:5173/foo -> http://localhost:4567/foo
        "/foo": "http://localhost:4567",
        // with options: http://localhost:5173/api/bar-> http://jsonplaceholder.typicode.com/bar
        "/api": {
          target: env.VITE_ORIGIN_SERVER,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        // with RegEx: http://localhost:5173/fallback/ -> http://jsonplaceholder.typicode.com/
        "^/fallback/.*": {
          target: "http://jsonplaceholder.typicode.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/fallback/, ""),
        },
        // Proxying websockets or socket.io: ws://localhost:5173/socket.io -> ws://localhost:5174/socket.io
        "/socket.io": {
          target: "ws://localhost:5174",
          ws: true,
        },
      },
    },
  };
});
