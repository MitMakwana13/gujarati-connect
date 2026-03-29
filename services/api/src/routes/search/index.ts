/**
 * routes/search/index.ts — Full-text search (Postgres tsvector)
 */

import type { FastifyInstance } from 'fastify';
import { searchQuerySchema } from '@gujarati-global/validators';

export default async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', { onRequest: [app.authenticate], schema: { tags: ['search'], summary: 'Full-text search across platform' } }, async (req, reply) => {
    const query = searchQuerySchema.parse(req.query);
    const tsQuery = query.q.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(' & ');
    const limit = query.limit;
    const results: Record<string, unknown[]> = { users: [], groups: [], events: [], posts: [], resources: [] };

    const [type] = [query.type];

    if (type === 'all' || type === 'users') {
      const r = await app.db.query<Record<string, unknown>>(
        `SELECT p.user_id AS id, p.display_name, p.bio, p.avatar_url, p.current_city, p.user_type,
                ts_rank(p.search_vector, to_tsquery('english', $1)) AS rank
         FROM profiles p JOIN users u ON u.id = p.user_id
         JOIN privacy_settings ps ON ps.user_id = p.user_id
         WHERE p.search_vector @@ to_tsquery('english', $1)
           AND u.status = 'active' AND p.is_discoverable = true
           AND ps.profile_visibility != 'connections_only'
         ORDER BY rank DESC LIMIT $2`,
        [tsQuery, limit],
      );
      results['users'] = r.rows;
    }

    if (type === 'all' || type === 'groups') {
      const r = await app.db.query<Record<string, unknown>>(
        `SELECT g.id, g.name, g.slug, g.description, g.cover_image_url, g.member_count, g.tags,
                ts_rank(to_tsvector('english', g.name || ' ' || COALESCE(g.description,'')), to_tsquery('english', $1)) AS rank
         FROM groups g WHERE g.status = 'active' AND g.visibility = 'public'
           AND to_tsvector('english', g.name || ' ' || COALESCE(g.description,'')) @@ to_tsquery('english', $1)
         ORDER BY rank DESC LIMIT $2`,
        [tsQuery, limit],
      );
      results['groups'] = r.rows;
    }

    if (type === 'all' || type === 'events') {
      const r = await app.db.query<Record<string, unknown>>(
        `SELECT e.id, e.title, e.description, e.event_type, e.starts_at, e.venue_name, e.rsvp_count,
                ts_rank(e.search_vector, to_tsquery('english', $1)) AS rank
         FROM events e WHERE e.search_vector @@ to_tsquery('english', $1)
           AND e.deleted_at IS NULL AND e.status IN ('upcoming','live') AND e.visibility = 'public'
         ORDER BY rank DESC LIMIT $2`,
        [tsQuery, limit],
      );
      results['events'] = r.rows;
    }

    if (type === 'all' || type === 'posts') {
      const r = await app.db.query<Record<string, unknown>>(
        `SELECT p.id, p.body, p.content_type, p.created_at, p.like_count,
                pr.display_name AS author_name,
                ts_rank(p.search_vector, to_tsquery('english', $1)) AS rank
         FROM posts p JOIN profiles pr ON pr.user_id = p.author_id
         WHERE p.search_vector @@ to_tsquery('english', $1)
           AND p.deleted_at IS NULL AND p.moderation_status = 'published'
         ORDER BY rank DESC LIMIT $2`,
        [tsQuery, limit],
      );
      results['posts'] = r.rows;
    }

    if (type === 'all' || type === 'resources') {
      const r = await app.db.query<Record<string, unknown>>(
        `SELECT rl.id, rl.title, rl.description, rl.category, rl.price, rl.currency,
                ts_rank(rl.search_vector, to_tsquery('english', $1)) AS rank
         FROM resource_listings rl
         WHERE rl.search_vector @@ to_tsquery('english', $1)
           AND rl.deleted_at IS NULL AND rl.is_active = true AND rl.moderation_status = 'published'
         ORDER BY rank DESC LIMIT $2`,
        [tsQuery, limit],
      );
      results['resources'] = r.rows;
    }

    return reply.send({ data: results });
  });
}
