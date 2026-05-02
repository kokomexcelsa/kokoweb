import { defineConfig } from 'astro/config';

const base = '/kokoweb';

export default defineConfig({
  site: 'https://kokomexcelsa.github.io',
  base,
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
  vite: {
    plugins: [
      {
        name: 'kokoweb-dev-index-compat',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (!req.url) {
              next();
              return;
            }

            const url = new URL(req.url, 'http://localhost');
            if (url.pathname === `${base}/` || url.pathname === `${base}/index.html`) {
              req.url = `/${url.search}`;
            } else if (url.pathname === '/index.html') {
              req.url = `/${url.search}`;
            }
            next();
          });
        }
      }
    ]
  }
});
