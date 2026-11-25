import Fastify, { type FastifyInstance } from 'fastify';

export interface BuildAppOptions {
  logger?: boolean;
}

/** Builds the Fastify app without starting it, so tests can use `app.inject()`. */
export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? false });

  app.get('/healthz', async () => ({ status: 'ok' }));

  return app;
}
