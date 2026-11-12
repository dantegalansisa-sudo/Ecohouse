import { openAIKeyVars, type Req, type Res } from './_lib/server.js';

// Diagnóstico de la configuración: solo nombres, nunca valores de claves
export default function handler(_req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7),
    env: process.env.VERCEL_ENV || 'local',
    openaiNamedVariables: Object.keys(process.env).filter((k) => /open\s*_?ai/i.test(k)),
    keyVariables: openAIKeyVars(),
  });
}
