import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Puerto del servidor de desarrollo
    host: "0.0.0.0", // Permite conexiones desde cualquier dirección IP
    allowedHosts: ["e076-94-140-11-14.ngrok-free.app", "localhost"],
    proxy: {
      "/api": {
        target: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000", // Usa la variable de entorno o el valor por defecto
        changeOrigin: true, // Cambia el origen de la solicitud
        secure: false, // Desactiva la validación de certificados SSL (útil para Ngrok)
        rewrite: (path) => path.replace(/^\/api/, ""), // Elimina el prefijo "/api" si es necesario
      },
    },
  },
});
