/**
 * routes/comments/index.ts — Comment CRUD
 */

import type { FastifyInstance } from 'fastify';
import { ForbiddenError, NotFoundError } from '../../plugins/error-handler.js';

export default async function commentRoutes(app: FastifyInstance): Promise<void> {
  app.patch('/:id', { onRequest: [app.authenticate], schema: { tags: ['comments'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { body } = req.body as { body?: string };
    if (!body?.trim()) throw new ForbiddenError('Comment body is required');

    const existing = await app.db.query<{ author_id: string }>(
      'SELECT author_id FROM comments WHERE id = $1 AND deleted_at IS NULL', [id],
    );
    if (!existing.rows[0]) throw new NotFoundError('Comment');
    if (existing.rows[0].author_id !== req.userId) throw new ForbiddenError('Only the author can edit this comment');

    await app.db.query('UPDATE comments SET body = $1, updated_at = NOW() WHERE id = $2', [body.trim(), id]);
    return reply.send({ data: { message: 'Comment updated' } });
  });

  app.delete('/:id', { onRequest: [app.authenticate], schema: { tags: ['comments'] } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await app.db.query<{ author_id: string }>(
      'SELECT author_id FROM comments WHERE id = $1 AND deleted_at IS NULL', [id],
    );
    if (!existing.rows[0]) throw new NotFoundError('Comment');
    const canDelete = existing.rows[0].author_id === req.userId || ['moderator', 'admin', 'super_admin'].includes(req.userRole ?? '');
    if (!canDelete) throw new ForbiddenError('Insufficient permissions');

    await app.db.query('UPDATE comments SET deleted_at = NOW() WHERE id = $1', [id]);
    return reply.send({ data: { message: 'Comment deleted' } });
  });
}
