import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/send-otp": "http://localhost:3001",
      "/verify-otp": "http://localhost:3001",
    },
  },
});
