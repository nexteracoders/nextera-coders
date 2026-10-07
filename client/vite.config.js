import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('@reduxjs') || id.includes('react-redux')) {
                            return 'vendor-redux';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('jspdf') || id.includes('html2canvas')) {
                            return 'vendor-pdf';
                        }
                        if (id.includes('prismjs')) {
                            return 'vendor-prism';
                        }
                    }
                    if (id.includes('dsaProblemsData')) {
                        return 'data-dsa-master-catalog';
                    }
                    if (id.includes('scriptsDocumentation') || id.includes('tutorialDocumentation') || id.includes('tutorialQuizBank')) {
                        return 'data-documentation-banks';
                    }
                },
            },
        },
    },
});
