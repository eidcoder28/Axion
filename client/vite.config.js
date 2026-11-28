import { defineConfig, loadEnv } from "vite";
import path from "path";
import sharedConfig from "../shared/config.js";

const __dirname = import.meta.dirname;
const rootDir = path.resolve(__dirname, "..");

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, rootDir, "");
    // The app won't start unless the port is valid, so we don't need to validate it again here.
    // And because it will still start if the port DOESN'T EXIST, I added a fallback port
    const port = env.PORT || sharedConfig.DEFAULT_PORT;

    return {
        resolve: {
            alias: {
                "@app": path.resolve(__dirname, "src/js"),
                "@shared": path.resolve(__dirname, "../shared"),
            },
        },
        server: {
            port: 5173,
            proxy: {
                "/api": `http://localhost:${port}`,
            }
        },
        build: {
            sourcemap: mode === "production" ? "hidden" : true,
            chunkSizeWarningLimit: 600
        }
    };
});