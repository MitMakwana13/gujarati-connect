/**
 * routes/media/index.ts — Media upload routes
 *
 * Handles file uploads, stores in Supabase Storage,
 * returns CDN URLs for DB storage.
 * In local dev without Supabase env vars the route still registers but
 * returns 503 on call (so the rest of the API boots fine).
 */

import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import path from 'path';
import { config } from '../../config/index.js';
import { AppError } from '../../plugins/error-handler.js';

// Lazily create the Supabase client so missing env vars don't crash startup
let _supabase: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_SERVICE_KEY'];
    if (!url || !key) {
      throw new AppError(
        'SERVICE_UNAVAILABLE',
        'Media uploads are not configured in this environment (missing SUPABASE_URL / SUPABASE_SERVICE_KEY)',
        503,
      );
    }
    const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export default async function mediaRoutes(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 5,
    },
  });

  app.post(
    '/upload',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: { max: config.rateLimit.upload.max, timeWindow: config.rateLimit.upload.windowMs } },
      schema: { tags: ['media'], summary: 'Upload media files' },
    },
    async (req, reply) => {
      const supabase = getSupabase();
      const parts = req.files();
      const uploadedUrls: string[] = [];

      for await (const part of parts) {
        if (!part.file) continue;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
        if (!allowedTypes.includes(part.mimetype)) {
          throw new AppError('UNSUPPORTED_MEDIA_TYPE', `File type ${part.mimetype} not allowed`, 415);
        }

        const ext = path.extname(part.filename).toLowerCase() || '.bin';
        const blobName = `${req.userId}/${Date.now()}-${randomUUID()}${ext}`;

        const { error } = await supabase.storage
          .from('media')
          .upload(blobName, await part.toBuffer(), {
            contentType: part.mimetype,
            upsert: false,
          });

        if (error) {
          throw new AppError('UPLOAD_FAILED', `Failed to upload file: ${error.message}`, 500);
        }

        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(blobName);
        app.log.info({ userId: req.userId, blobName, mimetype: part.mimetype }, '[media] File uploaded to Supabase');
        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'No files provided', 400);
      }

      return reply.status(201).send({ data: { urls: uploadedUrls } });
    },
  );
}
