// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

import cloudflare from "@astrojs/cloudflare";

// Cloudflare Pages 适配器将在 Task 5 中添加
// import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // 部署后替换为实际域名
  site: 'https://YOUR-DOMAIN.pages.dev',

  output: 'static',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

  adapter: cloudflare()
});