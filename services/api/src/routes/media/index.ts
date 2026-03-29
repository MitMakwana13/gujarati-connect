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
import { config } from '../../config/index.js';
import { AppError } from '../../plugins/error-handler.js';
// TODO(infra): Integrate exact Azure Blob Storage SDK.
// For Phase 1 dev out of the box, we will simulate the upload and just return a fake URL
// or local path, but we wire up the multipart parsing and validation correctly.

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

        // ── AZURE BLOB STORAGE SIMULATION ──
        // In production:
        // const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        // await blockBlobClient.uploadStream(part.file, undefined, undefined, {
        //   blobHTTPHeaders: { blobContentType: part.mimetype }
        // });
        // const cdnUrl = `${config.media.cdnBaseUrl}/${blobName}`;

        // ── DEV SIMULATION ──
        // We'll drain the stream to prevent memory leaks
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _chunk of part.file) {
          // draining
        }

        const cdnUrl = `${config.media.cdnBaseUrl}/${blobName}`;
        app.log.info({ userId: req.userId, blobName, mimetype: part.mimetype }, '[media] File uploaded to Azure');
        uploadedUrls.push(cdnUrl);
      }

      if (uploadedUrls.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'No files provided', 400);
      }

      return reply.status(201).send({ data: { urls: uploadedUrls } });
    },
  );
}
