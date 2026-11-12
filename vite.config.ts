import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// En local, sirve /api/* con las mismas funciones que corren en Vercel
function localApi(): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // solo las funciones (POST /api/chat, /api/bill); /api/_lib/* son módulos que pide el navegador
        const match = req.url?.match(/^\/api\/([a-z][\w-]*)\/?(\?|$)/);
        if (!match || req.method !== 'POST') return next();
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let mod;
        try {
          mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
        } catch (e) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: String(e) }));
        }
        const response = {
          status(code: number) {
            res.statusCode = code;
            return response;
          },
          json(body: unknown) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(body));
          },
          setHeader: (n: string, v: string) => res.setHeader(n, v),
        };
        await mod.default({ method: req.method, headers: req.headers, body: raw ? JSON.parse(raw) : undefined }, response);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env.local (no se sube a git) alimenta process.env de las funciones en local
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return { plugins: [react(), localApi()] };
});
