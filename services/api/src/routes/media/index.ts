/**
 * routes/media/index.ts — Media upload routes
 *
 * Handles file uploads, stores in Azure Blob Storage,
 * returns CDN URLs for DB storage.
 */

import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/index.js';
import { AppError } from '../../plugins/error-handler.js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export default async function mediaRoutes(app: FastifyInstance): Promise<void> {
  // Register multipart plugin just for this router or globally
  await app.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: 10 * 1024 * 1024, // 10MB limit per file
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
      const parts = req.files();
      const uploadedUrls: string[] = [];

      for await (const part of parts) {
        if (!part.file) continue;

        // Strict mime check (override client Trusting)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
        if (!allowedTypes.includes(part.mimetype)) {
          throw new AppError('UNSUPPORTED_MEDIA_TYPE', `File type ${part.mimetype} not allowed`, 415);
        }

        const ext = path.extname(part.filename).toLowerCase() || '.bin';
        const blobName = `${req.userId}/${Date.now()}-${randomUUID()}${ext}`;

        // ── SUPABASE STORAGE ──
        const { data, error } = await supabase.storage
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
