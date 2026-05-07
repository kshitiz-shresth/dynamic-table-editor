import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    return {
      plugins: [react()],
      root: '.',
    };
  }

  return {
    plugins: [
      react(),
      dts({
        include: ['src'],
        exclude: ['src/demo'],
        outDir: 'dist',
        rollupTypes: true,
      }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'DynamicTableEditor',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
      cssCodeSplit: false,
    },
  };
});
