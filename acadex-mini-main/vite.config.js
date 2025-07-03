import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // Adjust the base path if necessary
  worker: {
    format: 'es',
    plugins: []
  }
});
