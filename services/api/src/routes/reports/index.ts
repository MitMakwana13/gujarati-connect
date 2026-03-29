/**
 * routes/reports/index.ts — Content and user reporting
 */

import type { FastifyInstance } from 'fastify';
import { createReportSchema } from '@gujarati-global/validators';

export default async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { onRequest: [app.authenticate], schema: { tags: ['reports'], summary: 'Submit a report' } }, async (req, reply) => {
    const body = createReportSchema.parse(req.body);
    await app.db.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, body.targetType, body.targetId, body.reason, body.description ?? null],
    );
    return reply.status(201).send({ data: { message: 'Report submitted. Thank you for helping keep the community safe.' } });
  });
}
