import type { FastifyInstance } from 'fastify';

export default async function csrfRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { schema: { summary: 'Get CSRF Token' } },
    async (req, reply) => {
      const token = await reply.generateCsrf();
      return reply.send({ csrfToken: token });
    }
  );
}
