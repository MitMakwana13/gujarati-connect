/**
 * routes/events/index.ts — Event and RSVP routes
 */

import type { FastifyInstance } from 'fastify';
import { createEventSchema, updateEventSchema, eventListQuerySchema, rsvpSchema } from '@gujarati-global/validators';
import { AppError, ForbiddenError, NotFoundError } from '../../plugins/error-handler.js';

export default async function eventRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /events ───────────────────────────────────────────
  app.get('/', { schema: { tags: ['events'], summary: 'List events' } }, async (req, reply) => {
    const query = eventListQuerySchema.parse(req.query);
    const conditions = [`e.deleted_at IS NULL`, `e.status IN ('upcoming', 'live')`, `e.visibility = 'public'`];
    const values: unknown[] = [];
    let idx = 1;

    if (query.groupId)    { conditions.push(`e.group_id = $${idx++}`);     values.push(query.groupId); }
    if (query.communityId){ conditions.push(`e.community_id = $${idx++}`); values.push(query.communityId); }
    if (query.cityId)     { conditions.push(`e.city_id = $${idx++}`);      values.push(query.cityId); }
    if (query.eventType)  { conditions.push(`e.event_type = $${idx++}`);   values.push(query.eventType); }
    if (query.startsAfter){ conditions.push(`e.starts_at >= $${idx++}`);   values.push(query.startsAfter); }
    if (query.cursor)     { conditions.push(`e.starts_at > $${idx++}`);    values.push(query.cursor); }

    values.push(query.limit + 1);
    const rows = await app.db.query<Record<string, unknown>>(
      `SELECT e.id, e.title, e.description, e.cover_image_url, e.event_type, e.tags,
              e.venue_name, e.city_id, e.starts_at, e.ends_at, e.timezone,
              e.rsvp_count, e.max_attendees, e.visibility, e.status,
              -- NEVER return exact lat/lng in public listing
              p.display_name AS organizer_name, p.avatar_url AS organizer_avatar
       FROM events e JOIN profiles p ON p.user_id = e.organizer_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.starts_at ASC LIMIT $${idx}`,
      values,
    );
    const items = rows.rows.slice(0, query.limit);
    return reply.send({
      data: items,
      meta: { nextCursor: rows.rows.length > query.limit ? (items[items.length - 1]?.['starts_at'] as string) : null, hasMore: rows.rows.length > query.limit },
    });
  });

  // ── GET /events/:id ───────────────────────────────────────
  app.get('/:id', { onRequest: [app.authenticate], schema: { tags: ['events'], summary: 'Get event by ID' } }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const result = await app.db.query<Record<string, unknown>>(
      `SELECT e.*, p.display_name AS organizer_name, p.avatar_url AS organizer_avatar,
              r.status AS my_rsvp
       FROM events e
       JOIN profiles p ON p.user_id = e.organizer_id
       LEFT JOIN event_rsvps r ON r.event_id = e.id AND r.user_id = $2
       WHERE e.id = $1 AND e.deleted_at IS NULL`,
      [id, req.userId],
    );
    if (!result.rows[0]) throw new NotFoundError('Event');
    const event = result.rows[0];

    // Only expose exact coordinates to confirmed RSVPs
    if (event['my_rsvp'] !== 'going') {
      event['latitude'] = null;
      event['longitude'] = null;
    }

    return reply.send({ data: event });
  });

  // ── POST /events ──────────────────────────────────────────
  app.post('/', { onRequest: [app.authenticate], schema: { tags: ['events'], summary: 'Create an event' } }, async (req, reply) => {
    const body = createEventSchema.parse(req.body);
    const result = await app.db.query<{ id: string }>(
      `INSERT INTO events (group_id, community_id, organizer_id, title, description, event_type, tags,
                           venue_name, venue_address, city_id, starts_at, ends_at, timezone,
                           is_recurring, recurrence_rule, max_attendees, waitlist_enabled, visibility, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'upcoming') RETURNING id`,
      [
        body.groupId ?? null, body.communityId ?? null, req.userId,
        body.title, body.description ?? null, body.eventType ?? null, body.tags ?? [],
        body.venueName ?? null, body.venueAddress ?? null, body.cityId ?? null,
        body.startsAt, body.endsAt ?? null, body.timezone,
        body.isRecurring ?? false, body.recurrenceRule ?? null,
        body.maxAttendees ?? null, body.waitlistEnabled ?? false,
        body.visibility ?? 'public',
      ],
    );
    return reply.status(201).send({ data: { id: result.rows[0]?.id } });
  });

  // ── PATCH /events/:id ─────────────────────────────────────
  app.patch('/:id', { onRequest: [app.authenticate], schema: { tags: ['events'], summary: 'Update an event' } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = updateEventSchema.parse(req.body);
    const existing = await app.db.query<{ organizer_id: string }>(
      'SELECT organizer_id FROM events WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    if (!existing.rows[0]) throw new NotFoundError('Event');
    if (existing.rows[0].organizer_id !== req.userId) throw new ForbiddenError('Only the organizer can edit this event');

    const fields: [string, unknown][] = [
      ['title', body.title], ['description', body.description],
      ['cover_image_url', body.coverImageUrl], ['venue_name', body.venueName],
      ['venue_address', body.venueAddress], ['starts_at', body.startsAt],
      ['ends_at', body.endsAt], ['max_attendees', body.maxAttendees],
      ['visibility', body.visibility], ['status', body.status],
    ].filter(([, v]) => v !== undefined) as [string, unknown][];

    if (fields.length > 0) {
      const setClause = fields.map(([col], i) => `${col} = $${i + 1}`).join(', ');
      const values = fields.map(([, v]) => v);
      values.push(id);
      await app.db.query(`UPDATE events SET ${setClause}, updated_at = NOW() WHERE id = $${values.length}`, values);
    }
    return reply.send({ data: { message: 'Event updated' } });
  });

  // ── POST /events/:id/rsvp ─────────────────────────────────
  app.post('/:id/rsvp', { onRequest: [app.authenticate], schema: { tags: ['events'], summary: 'RSVP to an event' } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = rsvpSchema.parse(req.body);

    const eventResult = await app.db.query<{ max_attendees: number | null; rsvp_count: number; waitlist_enabled: boolean; status: string }>(
      'SELECT max_attendees, rsvp_count, waitlist_enabled, status FROM events WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    const event = eventResult.rows[0];
    if (!event || event.status === 'cancelled') throw new NotFoundError('Event');

    let finalStatus: string = status;
    if (status === 'going' && event.max_attendees && event.rsvp_count >= event.max_attendees) {
      if (!event.waitlist_enabled) throw new AppError('EVENT_FULL', 'This event is at capacity', 422);
      finalStatus = 'waitlisted';
    }

    await app.db.query(
      `INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3, updated_at = NOW()`,
      [id, req.userId, finalStatus],
    );

    return reply.status(201).send({ data: { status: finalStatus } });
  });

  // ── DELETE /events/:id/rsvp ───────────────────────────────
  app.delete('/:id/rsvp', { onRequest: [app.authenticate], schema: { tags: ['events'], summary: 'Cancel RSVP' } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.db.query('DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2', [id, req.userId]);
    return reply.send({ data: { message: 'RSVP cancelled' } });
  });
}
