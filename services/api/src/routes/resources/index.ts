/**
 * routes/resources/index.ts — Resource board routes
 *
 * SECURITY: contact_detail is NEVER returned to unauthenticated users.
 */

import type { FastifyInstance } from 'fastify';
import { createResourceSchema, updateResourceSchema, resourceListQuerySchema } from '@gujarati-global/validators';
import { ForbiddenError, NotFoundError } from '../../plugins/error-handler.js';

export default async function resourceRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /resources ────────────────────────────────────────
  app.get('/', { onRequest: [app.authenticate], schema: { tags: ['resources'], summary: 'List resource listings' } }, async (req, reply) => {
    const query = resourceListQuerySchema.parse(req.query);
    const conditions = [`rl.deleted_at IS NULL`, `rl.is_active = true`, `rl.moderation_status = 'published'`];
    const values: unknown[] = [];
    let idx = 1;

    if (query.cityId)   { conditions.push(`rl.city_id = $${idx++}`);   values.push(query.cityId); }
    if (query.category) { conditions.push(`rl.category = $${idx++}`);  values.push(query.category); }
    if (query.cursor)   { conditions.push(`rl.created_at < $${idx++}`); values.push(query.cursor); }

    values.push(query.limit + 1);
    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT rl.id, rl.category, rl.title, rl.description, rl.media_urls,
              rl.contact_method,
              -- contact_detail exposed to authenticated community members only
              rl.contact_detail,
              rl.price, rl.currency, rl.expires_at, rl.created_at,
              p.display_name AS author_name, p.avatar_url AS author_avatar,
              rl.author_id
       FROM resource_listings rl
       JOIN profiles p ON p.user_id = rl.author_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY rl.created_at DESC LIMIT $${idx}`,
      values,
    );
    const items = rows.rows.slice(0, query.limit);
    return reply.send({
      data: items,
      meta: { nextCursor: rows.rows.length > query.limit ? (items[items.length - 1]?.['created_at'] as string) : null, hasMore: rows.rows.length > query.limit },
    });
  });

  // ── GET /resources/:id ────────────────────────────────────
  app.get('/:id', { onRequest: [app.authenticate], schema: { tags: ['resources'], summary: 'Get resource by ID' } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await app.db.query<Record<string, unknown>>(
      `SELECT rl.*, p.display_name AS author_name, p.avatar_url AS author_avatar
       FROM resource_listings rl JOIN profiles p ON p.user_id = rl.author_id
       WHERE rl.id = $1 AND rl.deleted_at IS NULL`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundError('Resource');
    return reply.send({ data: result.rows[0] });
  });

  // ── POST /resources ───────────────────────────────────────
  app.post('/', { onRequest: [app.authenticate], schema: { tags: ['resources'], summary: 'Create resource listing' } }, async (req, reply) => {
    const body = createResourceSchema.parse(req.body);
    const result = await app.db.query<{ id: string }>(
      `INSERT INTO resource_listings (author_id, city_id, category, title, description, media_urls,
                                      contact_method, contact_detail, price, currency, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        req.userId, body.cityId ?? null, body.category, body.title, body.description,
        body.mediaUrls ?? [], body.contactMethod, body.contactDetail ?? null,
        body.price ?? null, body.currency ?? 'USD', body.expiresAt ?? null,
      ],
    );
    return reply.status(201).send({ data: { id: result.rows[0]?.id } });
  });

  // ── PATCH /resources/:id ──────────────────────────────────
  app.patch('/:id', { onRequest: [app.authenticate], schema: { tags: ['resources'], summary: 'Update resource listing' } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = updateResourceSchema.parse(req.body);
    const existing = await app.db.query<{ author_id: string }>(
      'SELECT author_id FROM resource_listings WHERE id = $1 AND deleted_at IS NULL', [id],
    );
    if (!existing.rows[0]) throw new NotFoundError('Resource');
    if (existing.rows[0].author_id !== req.userId) throw new ForbiddenError('Only the author can edit this listing');

    const fields: [string, unknown][] = [
      ['title', body.title], ['description', body.description],
      ['media_urls', body.mediaUrls], ['is_active', body.isActive],
      ['price', body.price], ['expires_at', body.expiresAt],
    ].filter(([, v]) => v !== undefined) as [string, unknown][];

    if (fields.length > 0) {
      const setClause = fields.map(([col], i) => `${col} = $${i + 1}`).join(', ');
      const vals = [...fields.map(([, v]) => v), id];
      await app.db.query(`UPDATE resource_listings SET ${setClause}, updated_at = NOW() WHERE id = $${vals.length}`, vals);
    }
    return reply.send({ data: { message: 'Listing updated' } });
  });
}
