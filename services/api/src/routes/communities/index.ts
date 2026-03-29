/**
 * routes/communities/index.ts — Community listing routes
 */

import type { FastifyInstance } from 'fastify';
import { paginationQuerySchema } from '@gujarati-global/validators';
import { NotFoundError } from '../../plugins/error-handler.js';

export default async function communityRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', { schema: { tags: ['communities'], summary: 'List active communities' } }, async (req, reply) => {
    const { limit, cursor } = paginationQuerySchema.parse(req.query);
    const conditions = [`c.status = 'active'`];
    const values: unknown[] = [];
    if (cursor) { conditions.push(`c.member_count < $1`); values.push(cursor); }
    values.push(limit + 1);

    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT c.id, c.name, c.slug, c.description, c.cover_image_url, c.member_count, c.is_official,
              ci.name AS city_name, ci.country AS city_country
       FROM communities c LEFT JOIN cities ci ON ci.id = c.city_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.member_count DESC LIMIT $${values.length}`,
      values,
    );
    const items = rows.rows.slice(0, limit);
    return reply.send({
      data: items,
      meta: { nextCursor: rows.rows.length > limit ? String(items[items.length - 1]?.['member_count'] ?? '') : null, hasMore: rows.rows.length > limit },
    });
  });

  app.get('/:slug', { schema: { tags: ['communities'], summary: 'Get community by slug' } }, async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const result = await app.db.query<Record<string, unknown>>(
      `SELECT c.*, ci.name AS city_name, ci.country AS city_country
       FROM communities c LEFT JOIN cities ci ON ci.id = c.city_id
       WHERE c.slug = $1 AND c.status = 'active'`,
      [slug],
    );
    if (!result.rows[0]) throw new NotFoundError('Community');
    return reply.send({ data: result.rows[0] });
  });
}
